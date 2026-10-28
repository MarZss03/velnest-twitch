import assert from 'node:assert/strict';
import { test } from 'node:test';
import { io } from 'socket.io-client';
import { createRoomServer } from '../../server/dist/roomServer.js';

const config = { mockMode: false, webOrigin: 'http://localhost:5173', clientId: 'test-client', clientSecret: 'test-secret', redirectUri: 'http://localhost:3001/auth/twitch/callback', broadcasterId: '900', secureCookies: false, admission:'subscribers' };
const json = (data, status=200) => new Response(JSON.stringify(data), {status,headers:{'Content-Type':'application/json'}});
const pair = value => value.split(';')[0];
function event(socket, name, predicate=()=>true) {
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{socket.off(name,onEvent);reject(new Error(`Timed out waiting for ${name}`));},3000);
    const onEvent=value=>{if(predicate(value)){clearTimeout(timeout);socket.off(name,onEvent);resolve(value);}};
    socket.on(name,onEvent);
  });
}
async function fixture(t, overrides={}) {
  let clock=1_000_000;
  const state={subscribed:true,userId:'100',invalid:false,scopes:['user:read:subscriptions'], ...overrides};
  const calls=[];
  const provider=async (input,init)=>{
    const url=new URL(input); calls.push(url.pathname);
    if(url.pathname==='/oauth2/token') {
      assert.equal(init.method,'POST');
      assert.equal(init.body.get('grant_type'),'authorization_code');
      assert.equal(init.body.get('redirect_uri'),config.redirectUri);
      return json({access_token:'test-only-access',expires_in:3600});
    }
    if(url.pathname==='/oauth2/validate') return state.invalid ? json({},401) : json({client_id:config.clientId,user_id:state.userId,expires_in:3600,scopes:state.scopes});
    if(url.pathname==='/helix/users') return json({data:[{id:state.userId,display_name:'VerifiedViewer'}]});
    if(url.pathname==='/helix/subscriptions/user') {
      assert.equal(url.searchParams.get('user_id'),state.userId);
      assert.equal(url.searchParams.get('broadcaster_id'),config.broadcasterId);
      return state.subscribed ? json({data:[{tier:'1000'}]}) : json({},404);
    }
    throw new Error(`Unexpected provider route: ${url.pathname}`);
  };
  const server=await createRoomServer({...config,...overrides.config},{fetch:provider,now:()=>clock,logger:false});
  t.after(()=>server.app.close());
  async function begin() {
    const res=await server.app.inject('/auth/twitch');
    assert.equal(res.statusCode,302);
    const url=new URL(res.headers.location);
    assert.equal(url.origin,'https://id.twitch.tv');
    assert.equal(url.searchParams.get('scope'),overrides.config?.admission==='signed-in' ? null : 'user:read:subscriptions');
    return {state:url.searchParams.get('state'),cookie:pair(res.headers['set-cookie'])};
  }
  async function login() {
    const start=await begin();
    const response=await server.app.inject({url:`/auth/twitch/callback?state=${start.state}&code=test-code`,headers:{cookie:start.cookie}});
    const cookies=response.headers['set-cookie'];
    const sessionCookie=Array.isArray(cookies) ? cookies.find(value=>value.startsWith('velnest_session=')) : undefined;
    return {response,cookie:sessionCookie?pair(sessionCookie):undefined,start};
  }
  async function connect(cookie) {
    if(!server.app.server.listening) await server.app.listen({port:0,host:'127.0.0.1'});
    const address=server.app.server.address();
    const socket=io(`http://127.0.0.1:${address.port}`,{autoConnect:false,transports:['websocket'],extraHeaders:{Origin:config.webOrigin,...(cookie?{Cookie:cookie}:{})}});
    t.after(()=>socket.disconnect());
    const connected=event(socket,'connect'); socket.connect(); await connected;
    return socket;
  }
  return {...server,state,calls,begin,login,connect,advance:ms=>{clock+=ms;}};
}

test('OAuth state is cookie-bound, expiring and single-use', async t=>{
  const f=await fixture(t);
  const start=await f.begin();
  const invalid=await f.app.inject(`/auth/twitch/callback?state=${start.state}&code=test-code`);
  assert.match(invalid.headers.location,/auth=invalid_state$/);
  assert.equal(f.calls.length,0,'invalid state must not reach token exchange');
  const valid=await f.app.inject({url:`/auth/twitch/callback?state=${start.state}&code=test-code`,headers:{cookie:start.cookie}});
  assert.match(valid.headers.location,/auth=connected$/);
  const replay=await f.app.inject({url:`/auth/twitch/callback?state=${start.state}&code=test-code`,headers:{cookie:start.cookie}});
  assert.match(replay.headers.location,/auth=invalid_state$/);
  const expired=await f.begin(); f.advance(600_001);
  const result=await f.app.inject({url:`/auth/twitch/callback?state=${expired.state}&code=test-code`,headers:{cookie:expired.cookie}});
  assert.match(result.headers.location,/auth=invalid_state$/);
});
test('subscriber session contains only public identity and expires after an hour',async t=>{
  const f=await fixture(t);
  const {response,cookie}=await f.login();
  assert.ok(cookie);
  const sessionHeader=response.headers['set-cookie'].find(c=>c.startsWith('velnest_session='));
  assert.match(sessionHeader,/HttpOnly; SameSite=Lax; Max-Age=3600/);
  const session=await f.app.inject({url:'/api/session',headers:{cookie}});
  assert.deepEqual(session.json(),{mockMode:false,user:{id:'100',displayName:'VerifiedViewer',role:'subscriber'}});
  assert.equal(session.headers['cache-control'],'no-store');
  assert.doesNotMatch(session.body,/test-only-access|test-secret/);
  f.advance(3_600_001);
  assert.equal((await f.app.inject({url:'/api/session',headers:{cookie}})).json().user,null);
});
test('cancelled authorization, missing scope and revoked tokens fail closed',async t=>{
  const f=await fixture(t);
  const start=await f.begin();
  const denied=await f.app.inject({url:`/auth/twitch/callback?state=${start.state}&error=access_denied`,headers:{cookie:start.cookie}});
  assert.match(denied.headers.location,/auth=denied$/); assert.equal(f.calls.length,0);
  f.state.scopes=[];
  const invalid=await f.login(); assert.match(invalid.response.headers.location,/auth=unavailable$/); assert.equal(invalid.cookie,undefined);
  f.state.scopes=['user:read:subscriptions'];
  const valid=await f.login();
  f.state.invalid=true; f.advance(15*60_000); await f.auth.sweep();
  assert.equal((await f.app.inject({url:'/api/session',headers:{cookie:valid.cookie}})).json().user,null);
});
test('logout enforces origin and invalidates the server session',async t=>{
  const f=await fixture(t);
  const {cookie}=await f.login();
  assert.equal((await f.app.inject({method:'POST',url:'/auth/logout',headers:{cookie,origin:'https://unrelated.example'}})).statusCode,403);
  assert.ok((await f.app.inject({url:'/api/session',headers:{cookie}})).json().user);
  assert.equal((await f.app.inject({method:'POST',url:'/auth/logout',headers:{cookie,origin:config.webOrigin}})).statusCode,200);
  assert.equal((await f.app.inject({url:'/api/session',headers:{cookie}})).json().user,null);
});
test('anonymous sockets may watch, but cannot join a real room',async t=>{
  const f=await fixture(t); const socket=await f.connect();
  const denied=event(socket,'roomError'); socket.emit('joinRoom',{displayName:'Spoof',avatarId:'riff'});
  assert.equal((await denied).code,'sign_in_required');
});
test('non-subscribers may sign in but cannot control an avatar',async t=>{
  const f=await fixture(t,{subscribed:false}); const {cookie}=await f.login();
  assert.equal((await f.app.inject({url:'/api/session',headers:{cookie}})).json().user.role,'viewer');
  const socket=await f.connect(cookie); const denied=event(socket,'roomError');
  socket.emit('joinRoom',{displayName:'Spoof',avatarId:'riff'});
  assert.equal((await denied).code,'subscription_required');
});

test('open Twitch admission accepts scope-free viewers, preserves moderation and rejects revoked sessions',async t=>{
  const f=await fixture(t,{subscribed:false,scopes:[],config:{admission:'signed-in'}});
  const guest=await f.login(); assert.ok(guest.cookie);
  assert.equal((await f.app.inject('/api/config')).json().admission,'signed-in');
  assert.equal((await f.app.inject({url:'/api/session',headers:{cookie:guest.cookie}})).json().user.role,'viewer');
  const socket=await f.connect(guest.cookie);
  let changed=event(socket,'roomState',people=>people.length===1);
  socket.emit('joinRoom',{displayName:'SpoofedOwner',avatarId:'riff'});
  assert.equal((await changed)[0].displayName,'VerifiedViewer');
  assert.equal((await socket.timeout(1000).emitWithAck('removeParticipant',socket.id)).ok,false);
  const anonymous=await f.connect(); const denied=event(anonymous,'roomError');
  anonymous.emit('joinRoom',{displayName:'Anonymous',avatarId:'arc'});
  assert.equal((await denied).code,'sign_in_required');
  f.state.userId='900'; const owner=await f.login(); const moderator=await f.connect(owner.cookie);
  const removed=event(socket,'roomError');
  assert.equal((await moderator.timeout(1000).emitWithAck('removeParticipant',socket.id)).ok,true);
  assert.equal((await removed).code,'room_removed');
  const retry=event(socket,'roomError'); socket.emit('joinRoom',{displayName:'Retry',avatarId:'riff'});
  assert.equal((await retry).code,'room_removed');
  f.advance(5*60_000+1);
  const reconnected=await f.connect(guest.cookie);
  changed=event(reconnected,'roomState',people=>people.length===1);
  reconnected.emit('joinRoom',{displayName:'Retry',avatarId:'riff'}); await changed;
  f.state.userId='100'; f.advance(15*60_000); await f.auth.sweep();
  assert.ok((await f.app.inject({url:'/api/session',headers:{cookie:guest.cookie}})).json().user);
  const revoked=event(reconnected,'roomError');
  f.state.invalid=true; f.advance(15*60_000); await f.auth.sweep();
  reconnected.emit('performAction','wave');
  assert.equal((await revoked).code,'sign_in_required');
  assert.ok(!f.calls.includes('/helix/subscriptions/user'),'open admission must never query subscription status');
});
test('subscriber room uses verified identity and removes access after revocation',async t=>{
  const f=await fixture(t); const {cookie}=await f.login(); const socket=await f.connect(cookie);
  const joined=event(socket,'roomState',people=>people.length===1);
  socket.emit('joinRoom',{displayName:'ImpersonatedBroadcaster',avatarId:'muse',cosmetic:'backpack'});
  const [person]=await joined;
  assert.equal(person.displayName,'VerifiedViewer'); assert.equal(person.avatarId,'muse');
  const reaction=event(socket,'roomState',people=>people[0]?.action==='cheer');
  socket.emit('performAction','cheer'); await reaction;
  const removed=event(socket,'roomError');
  f.state.subscribed=false; f.advance(15*60_000); await f.auth.sweep();
  assert.equal((await removed).code,'subscription_required');
});
test('broadcaster can enter their own room without a self-subscription',async t=>{
  const f=await fixture(t,{userId:'900',subscribed:false}); const {cookie}=await f.login();
  assert.equal((await f.app.inject({url:'/api/session',headers:{cookie}})).json().user.role,'broadcaster');
  assert.ok(!f.calls.includes('/helix/subscriptions/user'));
});
test('explicit mock mode still admits demo identities',async t=>{
  const f=await fixture(t,{config:{mockMode:true}}); const socket=await f.connect();
  const joined=event(socket,'roomState',people=>people.length===1);
  socket.emit('joinRoom',{displayName:'DemoNestling',avatarId:'arc'});
  assert.equal((await joined)[0].displayName,'DemoNestling');
});
test('unconfigured real mode exposes no sign-in redirect or accidental mock access',async t=>{
  const f=await fixture(t,{config:{clientId:'',clientSecret:'',broadcasterId:''}});
  assert.deepEqual((await f.app.inject('/api/config')).json(),{mockMode:false,oauthConfigured:false,room:'twitch',admission:'subscribers'});
  assert.equal((await f.app.inject('/auth/twitch')).statusCode,503);
});

test('broadcaster removal clears every identity connection, releases seats and survives reconnect until expiry',async t=>{
  const f=await fixture(t);
  const subscriber=await f.login();
  f.state.userId='900'; const broadcaster=await f.login();
  const owner=await f.connect(broadcaster.cookie);
  const guest=await f.connect(subscriber.cookie);
  const otherTab=await f.connect(subscriber.cookie);
  const observer=await f.connect();
  let changed=event(observer,'roomState',people=>people.length===1);
  guest.emit('joinRoom',{displayName:'Guest',avatarId:'riff'}); await changed;
  changed=event(observer,'roomState',people=>people.length===2);
  otherTab.emit('joinRoom',{displayName:'Guest tab',avatarId:'arc'}); await changed;
  // Use the source seat ID rather than a UI label.
  const {SEATS}=await import('../../../packages/shared/dist/index.js');
  const seat=SEATS[1].id;
  changed=event(observer,'roomState',people=>people.some(person=>person.seat?.id===seat));
  guest.emit('sit',seat); await changed;
  const deniedGuest=await guest.timeout(1000).emitWithAck('removeParticipant',otherTab.id);
  assert.equal(deniedGuest.ok,false,'subscriber must not moderate');
  const removed=event(guest,'roomError'); const otherRemoved=event(otherTab,'roomError');
  changed=event(observer,'roomState',people=>people.length===0);
  const result=await owner.timeout(1000).emitWithAck('removeParticipant',guest.id);
  assert.equal(result.ok,true); assert.equal((await removed).code,'room_removed');
  assert.equal((await otherRemoved).code,'room_removed'); await changed;
  const blocked=event(guest,'roomError'); guest.emit('joinRoom',{displayName:'Retry',avatarId:'muse'});
  assert.equal((await blocked).code,'room_removed');
  const fresh=await f.connect(subscriber.cookie);
  const blockedReconnect=event(fresh,'roomError'); fresh.emit('joinRoom',{displayName:'Reconnect',avatarId:'riff'});
  assert.equal((await blockedReconnect).code,'room_removed');
  f.state.userId='100'; const newLogin=await f.login(); const relogged=await f.connect(newLogin.cookie);
  const blockedLogin=event(relogged,'roomError'); relogged.emit('joinRoom',{displayName:'New login',avatarId:'riff'});
  assert.equal((await blockedLogin).code,'room_removed');
  f.advance(5*60_000+1);
  changed=event(observer,'roomState',people=>people.length===1);
  relogged.emit('joinRoom',{displayName:'After timeout',avatarId:'muse'}); await changed;
  changed=event(observer,'roomState',people=>people[0]?.seat?.id===seat);
  relogged.emit('sit',seat); await changed;
  const gone=await owner.timeout(1000).emitWithAck('removeParticipant','not-a-socket'); assert.equal(gone.ok,false);
  changed=event(observer,'roomState',people=>people.length===2);
  owner.emit('joinRoom',{displayName:'Owner',avatarId:'arc'}); await changed;
  const self=await owner.timeout(1000).emitWithAck('removeParticipant',owner.id);
  assert.equal(self.ok,false,'broadcaster cannot timeout their own identity');
  await f.app.inject({method:'POST',url:'/auth/logout',headers:{cookie:broadcaster.cookie,origin:config.webOrigin}});
  const revoked=event(owner,'roomError'); owner.emit('removeParticipant',relogged.id,()=>assert.fail('revoked moderator must not succeed'));
  assert.equal((await revoked).code,'sign_in_required');
});

test('demo identities cannot grant themselves moderation',async t=>{
  const f=await fixture(t,{config:{mockMode:true}}); const socket=await f.connect();
  const result=await socket.timeout(1000).emitWithAck('removeParticipant','fake');
  assert.equal(result.ok,false);
});
