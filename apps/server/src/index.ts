import cors from "@fastify/cors";
import Fastify from "fastify";
import { Server } from "socket.io";
import {
  AVATARS,
  ACTIONS,
  COSMETICS,
  canOccupy,
  moveInRoom,
  type ActionId,
  type AvatarId,
  type ClientToServerEvents,
  type Participant,
  type ServerToClientEvents
} from "@velnest/shared";

const port = Number(process.env.PORT ?? 3001);
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
const app = Fastify({ logger: true });

await app.register(cors, { origin: webOrigin });

app.get("/health", async () => ({ ok: true, service: "velnest-realtime" }));
app.get("/api/config", async () => ({ mockMode: true, room: "demo" }));

const io = new Server<ClientToServerEvents, ServerToClientEvents>(app.server, {
  cors: { origin: webOrigin, methods: ["GET", "POST"] }
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
  let destination: {x:number;y:number} | null=null;
  const navigation=setInterval(()=>{
    const participant=participants.get(socket.id);
    if(!participant || !destination) return;
    const dx=destination.x-participant.x, dy=destination.y-participant.y;
    const length=Math.hypot(dx,dy);
    if(length<.15) { destination=null; return; }
    const step=Math.min(length,2.25);
    const next=moveInRoom(participant.x,participant.y,dx/length*step,dy/length*step);
    if(next.x===participant.x && next.y===participant.y) { destination=null; return; }
    participant.x=next.x; participant.y=next.y;
    emitRoomState();
  },70);
  socket.on('moveTo',position=>{
    if(!position || !canOccupy(position.x,position.y)) return;
    destination={x:position.x,y:position.y};
  });
  // Late-joining viewers—especially OBS Browser Sources—need the current
  // snapshot immediately instead of waiting for the next player event.
  socket.emit("roomState", [...participants.values()]);

  socket.on("joinRoom", ({ displayName, avatarId, cosmetic }) => {
    if (!allowedAvatarIds.has(avatarId)) return;

    let x=20 + Math.round(Math.random()*60);
    let y=24 + Math.round(Math.random()*52);
    if(!canOccupy(x,y)) { x=50; y=70; }
    participants.set(socket.id, {
      id: socket.id,
      displayName: cleanDisplayName(displayName),
      avatarId: avatarId as AvatarId,
      x,
      y,
      action: null,
      actionNonce: 0,
      cosmetic: COSMETICS.some(item => item.id === cosmetic) ? cosmetic! : 'none'
    });
    emitRoomState();
  });

  socket.on("move", ({ dx, dy }) => {
    destination=null;
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

  socket.on("disconnect", () => {
    clearInterval(navigation);
    participants.delete(socket.id);
    emitRoomState();
  });
});

await app.listen({ port, host: "0.0.0.0" });

