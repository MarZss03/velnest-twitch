import cors from "@fastify/cors";
import Fastify from "fastify";
import { Server } from "socket.io";
import { authConfigFromEnv, registerTwitchAuth, type AuthConfig } from './twitchAuth.js';
import {
  AVATARS,
  ACTIONS,
  COSMETICS,
  SEATS,
  ROOM_CAPACITY,
  canOccupy,
  moveInRoom,
  findRoomPath,
  type ActionId,
  type AvatarId,
  type ClientToServerEvents,
  type Participant,
  type ServerToClientEvents
} from "@velnest/shared";

/** Each runtime or integration test owns an isolated room and session store. */
export async function createRoomServer(config: AuthConfig = authConfigFromEnv(), dependencies: { fetch?: typeof fetch; now?: () => number; logger?: boolean } = {}) {
const webOrigin = config.webOrigin;
const app = Fastify({ logger: dependencies.logger===false ? false : { serializers: { req: req => ({ method: req.method, url: req.url?.split('?')[0], hostname: req.hostname, remoteAddress: req.ip }) } } });

await app.register(cors, { origin: webOrigin, credentials: true });
const auth = registerTwitchAuth(app, config, dependencies);

app.get("/health", async () => ({ ok: true, service: "velnest-realtime" }));

const io = new Server<ClientToServerEvents, ServerToClientEvents>(app.server, {
  cors: { origin: webOrigin, methods: ["GET", "POST"], credentials: true },
  allowRequest: (req, callback) => callback(null, !req.headers.origin || req.headers.origin === webOrigin)
});

const participants = new Map<string, Participant>();
// Timeouts belong to verified Twitch identities, so new sockets and fresh logins
// cannot bypass a broadcaster's room decision. They expire with this process.
const roomTimeouts = new Map<string, number>();
const now = dependencies.now ?? Date.now;
const removalMessage = 'The broadcaster removed you from the room for five minutes. You can still watch.';
const allowedAvatarIds = new Set<string>(AVATARS.map((avatar) => avatar.id));
const allowedActionIds = new Set<string>(ACTIONS.map((action) => action.id));

function emitRoomState() {
  io.emit("roomState", [...participants.values()]);
}

function cleanDisplayName(value: string) {
  const normalized = value.replace(/[^\p{L}\p{N}_ -]/gu, "").trim().slice(0, 20);
  return normalized || "Subscriber";
}

io.on("connection", (socket) => {
  let lastMove=0, lastAction=0, lastJoin=0;
  let route: {x:number;y:number}[]=[];
  const releaseSeat=(participant:Participant)=>{
    const seat=SEATS.find(seat=>seat.id===participant.seat?.id);
    if(seat && participant.seat?.status==='seated') Object.assign(participant,seat.approach);
    participant.seat=null;
  };
  const denyAccess = () => {
    const user=auth.sessionForCookie(socket.request.headers.cookie)?.user;
    const timeout=user ? roomTimeouts.get(user.id) : undefined;
    const removed=Boolean(timeout && timeout>now());
    if(user && timeout && !removed) roomTimeouts.delete(user.id);
    if(config.mockMode || (user && user.role !== 'viewer' && !removed)) return false;
    const existed=participants.delete(socket.id);
    route=[];
    if(existed) emitRoomState();
    socket.emit('roomError', { code: removed ? 'room_removed' : user ? 'subscription_required' : 'sign_in_required', message: removed ? removalMessage : user ? 'This room is for channel subscribers. You can still watch the room.' : 'Sign in with Twitch to enter the room.' });
    return true;
  };
  socket.use(([event], next) => {
    if(event !== 'leaveRoom' && denyAccess()) return;
    next();
  });
  socket.on('removeParticipant',(participantId,reply)=>{
    const respond=(ok:boolean,message:string)=>{
      if(typeof reply==='function') reply({ok,message});
      else socket.emit('interactionError',message);
    };
    const moderator=auth.sessionForCookie(socket.request.headers.cookie)?.user;
    if(config.mockMode || moderator?.role!=='broadcaster' || moderator.id!==config.broadcasterId) {
      respond(false,'Only this channel’s broadcaster can remove participants.'); return;
    }
    const target=typeof participantId==='string' ? io.sockets.sockets.get(participantId) : undefined;
    const targetUser=target && auth.sessionForCookie(target.request.headers.cookie)?.user;
    if(!target || !targetUser || !participants.has(participantId)) {
      respond(false,'That participant has already left.'); return;
    }
    if(targetUser.id===moderator.id) { respond(false,'You cannot remove your own broadcaster identity.'); return; }
    for(const [id,expiry] of roomTimeouts) if(expiry<=now()) roomTimeouts.delete(id);
    roomTimeouts.set(targetUser.id,now()+5*60_000);
    for(const peer of io.sockets.sockets.values()) {
      if(auth.sessionForCookie(peer.request.headers.cookie)?.user.id!==targetUser.id) continue;
      participants.delete(peer.id);
      peer.emit('roomError',{code:'room_removed',message:removalMessage});
    }
    emitRoomState();
    respond(true,`${targetUser.displayName} was removed for five minutes.`);
  });
  const navigation=setInterval(()=>{
    const participant=participants.get(socket.id);
    if(participant && denyAccess()) return;
    const destination=route[0];
    if(!participant || !destination) return;
    const dx=destination.x-participant.x, dy=destination.y-participant.y;
    const length=Math.hypot(dx,dy);
    if(length<.15) {
      route.shift();
      if(!route.length && participant.seat?.status==='approaching') {
        const seat=SEATS.find(seat=>seat.id===participant.seat?.id)!;
        Object.assign(participant,seat.position);
        participant.seat.status='seated';
        participant.action=null;
        emitRoomState();
      }
      return;
    }
    const step=Math.min(length,2.25);
    const next=moveInRoom(participant.x,participant.y,dx/length*step,dy/length*step);
    if(next.x===participant.x && next.y===participant.y) {
      route=[]; releaseSeat(participant); emitRoomState();
      socket.emit('interactionError','That seat could not be reached. Choose another spot.');
      return;
    }
    participant.x=next.x; participant.y=next.y;
    emitRoomState();
  },70);
  socket.on('moveTo',position=>{
    if(!position || typeof position.x!=='number' || typeof position.y!=='number' || !canOccupy(position.x,position.y)) return;
    const participant=participants.get(socket.id);
    if(!participant) return;
    releaseSeat(participant);
    route=findRoomPath(participant,position);
    emitRoomState();
  });
  socket.on('sit',seatId=>{
    const participant=participants.get(socket.id);
    const seat=SEATS.find(seat=>seat.id===seatId);
    if(!participant || !seat || participant.seat?.id===seatId) return;
    if([...participants.values()].some(person=>person.seat?.id===seatId)) {
      socket.emit('interactionError','Someone already has that seat. Try another cushion.');
      return;
    }
    const previous=SEATS.find(seat=>seat.id===participant.seat?.id);
    const start=participant.seat?.status==='seated' && previous ? previous.approach : participant;
    const path=findRoomPath(start,seat.approach);
    if(!path.length) { socket.emit('interactionError','That seat could not be reached. Choose another spot.'); return; }
    releaseSeat(participant);
    participant.seat={id:seat.id,status:'approaching'};
    participant.action=null;
    participant.actionNonce=Date.now();
    route=path;
    emitRoomState();
  });
  socket.on('stand',()=>{
    const participant=participants.get(socket.id);
    if(!participant?.seat) return;
    route=[]; releaseSeat(participant); emitRoomState();
  });
  // Late-joining viewers—especially OBS Browser Sources—need the current
  // snapshot immediately instead of waiting for the next player event.
  socket.emit("roomState", [...participants.values()]);

  socket.on("joinRoom", (payload) => {
    if (!payload || typeof payload.displayName!=='string' || typeof payload.avatarId!=='string' || !allowedAvatarIds.has(payload.avatarId)) return;
    // Checked synchronously with insertion: competing joins cannot overbook.
    if(!participants.has(socket.id) && participants.size>=ROOM_CAPACITY) {
      socket.emit('roomError',{code:'room_full',message:`The room is full (${ROOM_CAPACITY} places). You can watch here and enter when someone leaves.`});
      return;
    }
    const now=Date.now();
    if(now-lastJoin<300) return;
    lastJoin=now;
    route=[];
    const {displayName,avatarId,cosmetic}=payload;

    let x=20 + Math.round(Math.random()*60);
    let y=24 + Math.round(Math.random()*52);
    if(!canOccupy(x,y)) { x=50; y=70; }
    participants.set(socket.id, {
      id: socket.id,
      displayName: config.mockMode ? cleanDisplayName(displayName) : auth.sessionForCookie(socket.request.headers.cookie)!.user.displayName,
      avatarId: avatarId as AvatarId,
      x,
      y,
      action: null,
      actionNonce: 0,
      cosmetic: COSMETICS.some(item => item.id === cosmetic) ? cosmetic! : 'none',
      seat: null
    });
    emitRoomState();
  });

  socket.on("move", (payload) => {
    if(!payload || typeof payload.dx!=='number' || typeof payload.dy!=='number' || !Number.isFinite(payload.dx) || !Number.isFinite(payload.dy)) return;
    const now=Date.now();
    if(now-lastMove<40) return;
    lastMove=now;
    const {dx,dy}=payload;
    if(dx===0 && dy===0) return;
    route=[];
    const participant = participants.get(socket.id);
    if (!participant) return;
    releaseSeat(participant);

    const safeDx = Math.max(-1, Math.min(1, Number(dx) || 0));
    const safeDy = Math.max(-1, Math.min(1, Number(dy) || 0));
    const length=Math.max(1,Math.hypot(safeDx,safeDy));
    const position=moveInRoom(participant.x,participant.y,safeDx/length*2.25,safeDy/length*2.25);
    participant.x=position.x;
    participant.y=position.y;
    emitRoomState();
  });

  socket.on("performAction", (actionId) => {
    const participant = participants.get(socket.id);
    if (!participant || !allowedActionIds.has(actionId)) return;
    if(participant.seat) { socket.emit('interactionError','Stand up to react.'); return; }
    const now=Date.now();
    if(now-lastAction<250) return;
    lastAction=now;

    const actionNonce = Date.now();
    participant.action = actionId as ActionId;
    participant.actionNonce = actionNonce;
    emitRoomState();

    setTimeout(() => {
      const current = participants.get(socket.id);
      if (!current || current.actionNonce !== actionNonce) return;
      current.action = null;
      emitRoomState();
    }, 1600);
  });

  socket.on('changeCosmetic', (cosmetic) => {
    const participant = participants.get(socket.id);
    if (!participant || !COSMETICS.some(item => item.id === cosmetic)) return;
    participant.cosmetic = cosmetic;
    emitRoomState();
  });

  socket.on('leaveRoom',()=>{
    route=[];
    participants.delete(socket.id);
    emitRoomState();
  });

  socket.on("disconnect", () => {
    clearInterval(navigation);
    participants.delete(socket.id);
    emitRoomState();
  });
});

app.addHook('preClose', async()=>{ await new Promise<void>(resolve=>io.close(()=>resolve())); });
return { app, io, auth };
}

