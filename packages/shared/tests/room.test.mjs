import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findRoomPath,clearSegment,fromWorld,canOccupy} from '../dist/room.js';

test('route goes around the coffee table without crossing furniture',()=>{
  const start=fromWorld(-3.2,0),end=fromWorld(-.6,0);
  assert.equal(clearSegment(start,end),false);
  const route=findRoomPath(start,end);
  assert.ok(route.length>1);
  let previous=start;
  for(const next of route){assert.ok(clearSegment(previous,next));previous=next;}
  assert.deepEqual(route.at(-1),end);
});

test('all reachable room grid targets have collision-free route segments',()=>{
  const start={x:50,y:75};
  for(let x=5;x<=95;x+=5)for(let y=12;y<=88;y+=4){
    if(!canOccupy(x,y))continue;
    const route=findRoomPath(start,{x,y});
    assert.ok(route.length,`missing route to ${x},${y}`);
    let previous=start;
    for(const next of route){assert.ok(clearSegment(previous,next));previous=next;}
  }
});

test('rejects destinations inside furniture and non-finite coordinates',()=>{
  assert.deepEqual(findRoomPath({x:50,y:75},fromWorld(-2,-1.5)),[]);
  assert.deepEqual(findRoomPath({x:50,y:75},{x:NaN,y:50}),[]);
});
