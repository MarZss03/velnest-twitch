import assert from 'node:assert/strict';
import {test} from 'node:test';
import {setTimeout as delay} from 'node:timers/promises';
import {io} from 'socket.io-client';
import {ROOM_CAPACITY,SEATS} from '@velnest/shared';
import {createRoomServer} from '../../server/dist/roomServer.js';

function waitFor(socket,name,predicate=()=>true){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{socket.off(name,listener);reject(new Error(`No matching ${name}`));},5000);
    const listener=value=>{if(predicate(value)){clearTimeout(timer);socket.off(name,listener);resolve(value);}};
    socket.on(name,listener);
  });
}
function admission(socket){
  return new Promise((resolve,reject)=>{
    const finish=result=>{clearTimeout(timer);socket.off('roomState',state);socket.off('roomError',error);resolve(result);};
    const state=people=>{if(people.some(person=>person.id===socket.id))finish('joined');};
    const error=value=>finish(value.code);
    const timer=setTimeout(()=>{socket.off('roomState',state);socket.off('roomError',error);reject(new Error('No admission result'));},5000);
    socket.on('roomState',state);socket.on('roomError',error);
  });
}

test('racing joins respect capacity, observers stay connected and freed places can be reclaimed',{timeout:15000},async t=>{
  const origin='http://localhost:5173';
  const {app}=await createRoomServer({mockMode:true,webOrigin:origin,clientId:'',clientSecret:'',redirectUri:'',broadcasterId:'',secureCookies:false},{logger:false});
  await app.listen({host:'127.0.0.1',port:0});
  t.after(()=>app.close());
  const connect=async()=>{
    const socket=io(`http://127.0.0.1:${app.server.address().port}`,{autoConnect:false,transports:['websocket'],extraHeaders:{Origin:origin}});
    t.after(()=>socket.disconnect());
    socket.on('roomState',people=>assert.ok(people.length<=ROOM_CAPACITY,'no observer may receive an overbooked snapshot'));
    const connected=waitFor(socket,'connect');
    socket.initialState=waitFor(socket,'roomState');
    socket.connect();await connected;await socket.initialState;return socket;
  };
  const clients=await Promise.all(Array.from({length:ROOM_CAPACITY+2},connect));
  const outcomes=clients.map(admission);
  clients.forEach((socket,index)=>socket.emit('joinRoom',{displayName:`Guest${index}`,avatarId:'riff'}));
  const results=await Promise.all(outcomes);
  assert.equal(results.filter(result=>result==='joined').length,ROOM_CAPACITY);
  assert.equal(results.filter(result=>result==='room_full').length,2);
  const joined=clients.filter((_,i)=>results[i]==='joined');
  const denied=clients.filter((_,i)=>results[i]==='room_full');
  const observer=await connect();
  assert.equal((await observer.initialState).length,ROOM_CAPACITY,'late OBS sees a full room without consuming a place');
  assert.ok(denied.every(socket=>socket.connected),'full-room spectators keep receiving updates');

  await delay(320); // A valid repeat join must be outside the existing join-rate window.
  let changed=waitFor(observer,'roomState',people=>people.find(person=>person.id===joined[0].id)?.avatarId==='muse');
  joined[0].emit('joinRoom',{displayName:'Changed identity',avatarId:'muse'});
  assert.equal((await changed).length,ROOM_CAPACITY,'existing membership must not consume a second place');
  changed=waitFor(observer,'roomState',people=>people.find(person=>person.id===joined[0].id)?.seat?.id===SEATS[0].id);
  joined[0].emit('sit',SEATS[0].id);await changed;
  changed=waitFor(observer,'roomState',people=>people.length===ROOM_CAPACITY-1);
  joined[0].emit('leaveRoom');
  assert.ok((await changed).every(person=>person.seat?.id!==SEATS[0].id),'leaving also releases the sofa reservation');
  let retry=admission(denied[0]);denied[0].emit('joinRoom',{displayName:'Retry',avatarId:'arc'});
  assert.equal(await retry,'joined','a previously denied spectator may enter once a place opens');
  changed=waitFor(observer,'roomState',people=>people.length===ROOM_CAPACITY-1);
  denied[0].disconnect();await changed;
  retry=admission(denied[1]);denied[1].emit('joinRoom',{displayName:'After disconnect',avatarId:'muse'});
  assert.equal(await retry,'joined','disconnect must release capacity');
});
