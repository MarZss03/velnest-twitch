import assert from 'node:assert/strict';
import {test} from 'node:test';
import {placeRoomLabel} from '../src/labelLayout.ts';

for(const bounds of [{width:820,height:480},{width:335,height:320}]){
  test(`crowded labels stay bounded and disjoint at ${bounds.width}px`,()=>{
    const placed=[];
    for(let i=0;i<24;i++){
      const box=placeRoomLabel({x:bounds.width/2+(i%4)*3,y:bounds.height/2+(i%3)*5},{width:70,height:24},bounds,placed);
      if(!box)continue;
      assert.ok(box.x-box.width/2>=8 && box.x+box.width/2<=bounds.width-8);
      assert.ok(box.y-box.height>=8 && box.y<=bounds.height-8);
      for(const other of placed) assert.ok(Math.abs(box.x-other.x)>=(box.width+other.width)/2+6 || box.y<=other.y-other.height-6 || box.y-box.height>=other.y+6);
      placed.push(box);
    }
    assert.ok(placed.length>=3,'crowded views retain useful labels');
    assert.ok(placed.length<24,'fully packed views may suppress visual clutter rather than escape bounds');
  });
}
test('offscreen, malformed and oversized labels are omitted',()=>{
  const bounds={width:335,height:320},size={width:70,height:24};
  assert.equal(placeRoomLabel({x:-1,y:100},size,bounds,[]),null);
  assert.equal(placeRoomLabel({x:100,y:NaN},size,bounds,[]),null);
  assert.equal(placeRoomLabel({x:100,y:100},{width:400,height:24},bounds,[]),null);
});
