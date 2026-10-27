import cors from "@fastify/cors";
import Fastify from "fastify";
import { Server } from "socket.io";
import {
  AVATARS,
  ACTIONS,
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
  // Late-joining viewers—especially OBS Browser Sources—need the current
  // snapshot immediately instead of waiting for the next player event.
  socket.emit("roomState", [...participants.values()]);

  socket.on("joinRoom", ({ displayName, avatarId }) => {
    if (!allowedAvatarIds.has(avatarId)) return;

    participants.set(socket.id, {
      id: socket.id,
      displayName: cleanDisplayName(displayName),
      avatarId: avatarId as AvatarId,
      x: 20 + Math.round(Math.random() * 60),
      y: 24 + Math.round(Math.random() * 52),
      action: null,
      actionNonce: 0
    });
    emitRoomState();
  });

  socket.on("move", ({ dx, dy }) => {
    const participant = participants.get(socket.id);
    if (!participant) return;

    const safeDx = Math.max(-1, Math.min(1, Number(dx) || 0));
    const safeDy = Math.max(-1, Math.min(1, Number(dy) || 0));
    participant.x = Math.max(5, Math.min(95, participant.x + safeDx * 2.25));
    participant.y = Math.max(12, Math.min(88, participant.y + safeDy * 2.25));
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

  socket.on("disconnect", () => {
    participants.delete(socket.id);
    emitRoomState();
  });
});

await app.listen({ port, host: "0.0.0.0" });

