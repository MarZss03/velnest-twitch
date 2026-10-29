import assert from 'node:assert/strict';
import {test} from 'node:test';
import {roomPixelRatio} from '../src/roomRenderBudget.ts';
test('live room keeps OBS and high-DPI buffers within the 720p budget',()=>{
 for(const [w,h,dpr] of [[1920,1080,1],[3840,2160,2],[390,844,3],[1280,720,1],[820,520,2]]){
  const ratio=roomPixelRatio(w,h,dpr);
  assert.ok(w*h*ratio**2<=1280*720+1);
  assert.ok(ratio>0&&ratio<=1.25&&ratio<=dpr);
 }
 assert.equal(roomPixelRatio(1280,720,1),1);
});
test('invalid layout or display density cannot allocate non-finite buffers',()=>{
 for(const args of [[0,0,NaN],[NaN,800,2],[500,Infinity,0],[-1,200,1]])
  assert.ok(Number.isFinite(roomPixelRatio(...args))&&roomPixelRatio(...args)>0);
});
