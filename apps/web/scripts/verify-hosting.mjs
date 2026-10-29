import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {io} from 'socket.io-client';
import {createRoomServer} from '../../server/dist/roomServer.js';

const frontendRoot=fileURLToPath(new URL('../dist/',import.meta.url));
const config={mockMode:true,webOrigin:'https://velnest.example',clientId:'',clientSecret:'',redirectUri:'',broadcasterId:'',secureCookies:false};
const event=(socket,name,predicate=()=>true)=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{socket.off(name,listener);reject(new Error(`No ${name}`));},3000);
  const listener=value=>{if(predicate(value)){clearTimeout(timer);socket.off(name,listener);resolve(value);}};
  socket.on(name,listener);
});

test('compiled frontend, models, fonts and API share a host without exposing source files',async t=>{
  const {app}=await createRoomServer(config,{logger:false,frontendRoot});t.after(()=>app.close());
  for(const url of ['/', '/?view=overlay']){
    const response=await app.inject(url);
    assert.equal(response.statusCode,200);assert.match(response.headers['content-type'],/text\/html/);
    assert.equal(response.headers['cache-control'],'no-cache');assert.match(response.body,/VELNEST/);
  }
  const html=(await app.inject('/')).body;
  const js=html.match(/src="([^\"]+\.js)"/)[1];
  const bundle=await app.inject(js);assert.equal(bundle.statusCode,200);
  assert.match(bundle.headers['content-type'],/javascript/);assert.match(bundle.headers['cache-control'],/immutable/);
  for(const url of ['/models/riff.glb','/models/afterparty.glb','/models/props/lightstick.glb']){
    const response=await app.inject(url);assert.equal(response.statusCode,200);
    assert.equal(response.rawPayload.subarray(0,4).toString(),'glTF');
    assert.equal(response.headers['cache-control'],'no-cache');
  }
  const font=await app.inject('/fonts/manrope-latin.woff2');assert.equal(font.statusCode,200);assert.match(font.headers['content-type'],/font\/woff2/);
  const decoder=await app.inject('/vendor/draco/draco_decoder.wasm');assert.equal(decoder.statusCode,200);assert.match(decoder.headers['content-type'],/application\/wasm/);
  assert.equal((await app.inject('/dev/room-review.html')).statusCode,404,'art fixture is not shipped');
  for(const url of ['/.env','/README.md','/apps/server/src/twitchAuth.ts','/%2e%2e%2f%2e%2e%2f.env','/assets/not-real.js']){
    const response=await app.inject(url);assert.ok([400,403,404].includes(response.statusCode));
    assert.doesNotMatch(response.body,/TWITCH_CLIENT_SECRET|test-secret/);
  }
  assert.deepEqual((await app.inject('/health')).json(),{ok:true,service:'velnest-realtime'});
  assert.equal((await app.inject('/api/config')).json().mockMode,true);
});

test('web hosting preserves realtime observers and real-mode identity checks',async t=>{
  for(const mockMode of [true,false]){
    const {app}=await createRoomServer({...config,mockMode},{logger:false,frontendRoot});t.after(()=>app.close());
    await app.listen({host:'127.0.0.1',port:0});
    const socket=io(`http://127.0.0.1:${app.server.address().port}`,{autoConnect:false,transports:['websocket'],extraHeaders:{Origin:config.webOrigin}});
    t.after(()=>socket.disconnect());
    const connected=event(socket,'connect'),initial=event(socket,'roomState');socket.connect();await connected;
    assert.deepEqual(await initial,[]);
    const result=mockMode?event(socket,'roomState',people=>people.length===1):event(socket,'roomError');
    socket.emit('joinRoom',{displayName:'Hosted check',avatarId:'arc'});
    if(mockMode)assert.equal((await result)[0].displayName,'Hosted check');
    else assert.equal((await result).code,'sign_in_required');
  }
});

test('hosting fails clearly when compiled frontend is missing',async()=>{
  await assert.rejects(createRoomServer(config,{logger:false,frontendRoot:fileURLToPath(new URL('../no-built-site/',import.meta.url))}),/Run pnpm build/);
});
