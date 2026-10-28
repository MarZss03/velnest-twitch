import assert from 'node:assert/strict';
import { test } from 'node:test';
import { io } from 'socket.io-client';
import { SEATS, canOccupy, clearSegment } from '@velnest/shared';
import { createRoomServer } from '../../server/dist/roomServer.js';

function waitFor(socket,event,predicate=()=>true) {
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{socket.off(event,listener);reject(new Error(`No matching ${event}`));},10_000);
    const listener=value=>{if(predicate(value)){clearTimeout(timer);socket.off(event,listener);resolve(value);}};
    socket.on(event,listener);
  });
}
async function room(t) {
  const {app}=await createRoomServer({mockMode:true,webOrigin:'http://localhost:5173',clientId:'',clientSecret:'',redirectUri:'',broadcasterId:'',secureCookies:false},{logger:false});
  await app.listen({host:'127.0.0.1',port:0});
  t.after(()=>app.close());
  const clients=[];
  const connect=async name=>{
    const socket=io(`http://127.0.0.1:${app.server.address().port}`,{autoConnect:false,transports:['websocket'],extraHeaders:{Origin:'http://localhost:5173'}});
    socket.initialState=waitFor(socket,'roomState');
    t.after(()=>socket.disconnect());
    const connected=waitFor(socket,'connect'); socket.connect(); await connected;
    if(name){
      const joined=waitFor(socket,'roomState',people=>people.some(p=>p.id===socket.id));
      socket.emit('joinRoom',{displayName:name,avatarId:'riff'}); await joined;
    }
    clients.push(socket); return socket;
  };
  return {connect,clients};
}

test('seat approaches are walkable without weakening furniture collision',()=>{
  for(const seat of SEATS){
    assert.ok(canOccupy(seat.approach.x,seat.approach.y));
    assert.ok(!canOccupy(seat.position.x,seat.position.y),'cushions remain outside the walkable floor');
  }
});
test('racing claims reserve one seat, walk safely, sit in OBS and release on disconnect',{timeout:15_000},async t=>{
  const f=await room(t), a=await f.connect('One'), b=await f.connect('Two');
  let previous=new Map();
  a.on('roomState',people=>{
    for(const person of people){
      if(person.seat?.status==='approaching'){
        assert.ok(canOccupy(person.x,person.y),'approaching avatar stays on the floor');
        const before=previous.get(person.id);
        if(before?.seat?.status==='approaching') assert.ok(clearSegment(before,person),'approach never crosses furniture');
      }
    }
    previous=new Map(people.map(person=>[person.id,person]));
  });
  const rejected=new Promise(resolve=>{a.once('interactionError',resolve);b.once('interactionError',resolve);});
  const reserved=waitFor(a,'roomState',people=>people.some(person=>person.seat?.id===SEATS[0].id));
  const seated=waitFor(a,'roomState',people=>people.some(person=>person.seat?.status==='seated'));
  a.emit('sit',SEATS[0].id); b.emit('sit',SEATS[0].id);
  const reservation=await reserved;
  assert.equal(reservation.filter(person=>person.seat?.id===SEATS[0].id).length,1);
  assert.match(await rejected,/already has that seat/);
  const result=await seated, owner=result.find(person=>person.seat?.status==='seated');
  assert.deepEqual({x:owner.x,y:owner.y},SEATS[0].position);
  // Late OBS connections receive the seated state without waiting for movement.
  const observer=await f.connect();
  assert.equal((await observer.initialState).find(person=>person.id===owner.id).seat.id,SEATS[0].id);
  const winner=owner.id===a.id?a:b, loser=owner.id===a.id?b:a;
  const gone=waitFor(loser,'roomState',people=>!people.some(person=>person.id===owner.id));
  winner.disconnect(); await gone;
  const reassigned=waitFor(loser,'roomState',people=>people.some(person=>person.id===loser.id && person.seat?.id===SEATS[0].id));
  loser.emit('sit',SEATS[0].id); await reassigned;
});
test('manual movement cancels reservations; standing returns to a valid floor point',{timeout:15_000},async t=>{
  const f=await room(t), socket=await f.connect('Three');
  const reserved=waitFor(socket,'roomState',people=>people[0]?.seat?.status==='approaching');
  socket.emit('sit',SEATS[1].id); await reserved;
  const cancelled=waitFor(socket,'roomState',people=>people[0]?.seat===null);
  socket.emit('move',{dx:1,dy:0});
  const [walking]=await cancelled; assert.ok(canOccupy(walking.x,walking.y));
  const seated=waitFor(socket,'roomState',people=>people[0]?.seat?.status==='seated');
  socket.emit('sit',SEATS[2].id); await seated;
  const blocked=waitFor(socket,'interactionError'); socket.emit('performAction','dance');
  assert.equal(await blocked,'Stand up to react.');
  const stood=waitFor(socket,'roomState',people=>people[0]?.seat===null);
  socket.emit('stand'); const [standing]=await stood;
  assert.deepEqual({x:standing.x,y:standing.y},SEATS[2].approach);
  assert.ok(canOccupy(standing.x,standing.y));
  const reaction=waitFor(socket,'roomState',people=>people[0]?.action==='wave');
  socket.emit('performAction','wave'); await reaction;
});
