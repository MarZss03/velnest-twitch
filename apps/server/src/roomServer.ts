import cors from "@fastify/cors";
import Fastify from "fastify";
import { Server } from "socket.io";
import { authConfigFromEnv, registerTwitchAuth, type AuthConfig } from './twitchAuth.js';
import {
  AVATARS,
  ACTIONS,
  COSMETICS,
  canOccupy,
  moveInRoom,
  findRoomPath,
  type ActionId,
  type AvatarId,
  type ClientToServerEvents,
  type Participant,
  type ServerToClientEvents
} from "@velnest/shared";

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
  const denyAccess = () => {
    const user=auth.sessionForCookie(socket.request.headers.cookie)?.user;
    if(config.mockMode || (user && user.role !== 'viewer')) return false;
    const existed=participants.delete(socket.id);
    route=[];
    if(existed) emitRoomState();
    socket.emit('roomError', { code: user ? 'subscription_required' : 'sign_in_required', message: user ? 'This room is for channel subscribers. You can still watch the room.' : 'Sign in with Twitch to enter the room.' });
    return true;
  };
  socket.use(([event], next) => {
    if(event !== 'leaveRoom' && denyAccess()) return;
    next();
  });
  const navigation=setInterval(()=>{
    const participant=participants.get(socket.id);
    if(participant && denyAccess()) return;
    const destination=route[0];
    if(!participant || !destination) return;
    const dx=destination.x-participant.x, dy=destination.y-participant.y;
    const length=Math.hypot(dx,dy);
    if(length<.15) { route.shift(); return; }
    const step=Math.min(length,2.25);
    const next=moveInRoom(participant.x,participant.y,dx/length*step,dy/length*step);
    if(next.x===participant.x && next.y===participant.y) { route=[]; return; }
    participant.x=next.x; participant.y=next.y;
    emitRoomState();
  },70);
  socket.on('moveTo',position=>{
    if(!position || typeof position.x!=='number' || typeof position.y!=='number' || !canOccupy(position.x,position.y)) return;
    const participant=participants.get(socket.id);
    if(!participant) return;
    route=findRoomPath(participant,position);
  });
  // Late-joining viewers—especially OBS Browser Sources—need the current
  // snapshot immediately instead of waiting for the next player event.
  socket.emit("roomState", [...participants.values()]);

  socket.on("joinRoom", (payload) => {
    if (!payload || typeof payload.displayName!=='string' || typeof payload.avatarId!=='string' || !allowedAvatarIds.has(payload.avatarId)) return;
    const now=Date.now();
    if(now-lastJoin<300) return;
    lastJoin=now;
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
      cosmetic: COSMETICS.some(item => item.id === cosmetic) ? cosmetic! : 'none'
    });
    emitRoomState();
  });

  socket.on("move", (payload) => {
    if(!payload || typeof payload.dx!=='number' || typeof payload.dy!=='number' || !Number.isFinite(payload.dx) || !Number.isFinite(payload.dy)) return;
    const now=Date.now();
    if(now-lastMove<40) return;
    lastMove=now;
    const {dx,dy}=payload;
    route=[];
    const participant = participants.get(socket.id);
    if (!participant) return;

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

