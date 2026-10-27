import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  AVATARS,
  type AvatarId,
  type ClientToServerEvents,
  type Participant,
  type ServerToClientEvents
} from "@velnest/shared";

type VelnestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
type Direction = { dx: number; dy: number };

const realtimeUrl = import.meta.env.VITE_REALTIME_URL ?? "http://localhost:3001";
const isOverlay = new URLSearchParams(window.location.search).get("view") === "overlay";

function World({ participants, connected }: { participants: Participant[]; connected: boolean }) {
  return (
    <section className="world-shell" aria-label="VELNEST shared world">
      <div className="world-topline">
        <span className="live-dot" data-connected={connected} />
        {connected ? "VELNEST LIVE" : "RECONNECTING"}
        <span>{participants.length} inside</span>
      </div>
      <div className="world">
        <div className="moon" />
        <div className="hill hill-one" />
        <div className="hill hill-two" />
        <div className="pond" />
        <div className="fire"><i /><i /><i /></div>
        {participants.map((participant) => {
          const avatar = AVATARS.find((item) => item.id === participant.avatarId) ?? AVATARS[0];
          return (
            <div
              className="participant"
              key={participant.id}
              style={{ left: `${participant.x}%`, top: `${participant.y}%` }}
            >
              <span className="nameplate">{participant.displayName}</span>
              <span
                className="avatar"
                style={{
                  "--avatar": avatar.color,
                  "--accent": avatar.accent,
                  backgroundImage: `url(${avatar.image})`,
                  backgroundPosition: avatar.position
                } as React.CSSProperties}
              />
              <span className="shadow" />
            </div>
          );
        })}
        {participants.length === 0 && (
          <div className="empty-world">
            <span>THE NEST IS QUIET</span>
            Waiting for the first subscriber
          </div>
        )}
      </div>
    </section>
  );
}

function Dpad({ onMove }: { onMove: (direction: Direction) => void }) {
  const button = (label: string, direction: Direction, className: string) => (
    <button
      className={className}
      aria-label={label}
      onPointerDown={() => onMove(direction)}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div className="dpad">
      {button("↑", { dx: 0, dy: -1 }, "up")}
      {button("←", { dx: -1, dy: 0 }, "left")}
      <span className="dpad-center" />
      {button("→", { dx: 1, dy: 0 }, "right")}
      {button("↓", { dx: 0, dy: 1 }, "down")}
    </div>
  );
}

export function App() {
  const socket = useMemo<VelnestSocket>(() => io(realtimeUrl, { autoConnect: true }), []);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connected, setConnected] = useState(socket.connected);
  const [joined, setJoined] = useState(isOverlay);
  const [displayName, setDisplayName] = useState(() => `Nestling${Math.floor(10 + Math.random() * 90)}`);
  const [avatarId, setAvatarId] = useState<AvatarId>("riff");
  const joinedProfile = useRef<{ displayName: string; avatarId: AvatarId } | null>(null);

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      if (!isOverlay && joinedProfile.current) {
        socket.emit("joinRoom", joinedProfile.current);
      }
    };
    const onDisconnect = () => setConnected(false);
    const onRoomState = (state: Participant[]) => setParticipants(state);
    if (!socket.connected) socket.connect();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("roomState", onRoomState);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("roomState", onRoomState);
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (!joined || isOverlay) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const directions: Record<string, Direction> = {
        ArrowUp: { dx: 0, dy: -1 }, w: { dx: 0, dy: -1 },
        ArrowDown: { dx: 0, dy: 1 }, s: { dx: 0, dy: 1 },
        ArrowLeft: { dx: -1, dy: 0 }, a: { dx: -1, dy: 0 },
        ArrowRight: { dx: 1, dy: 0 }, d: { dx: 1, dy: 0 }
      };
      const direction = directions[event.key];
      if (direction) {
        event.preventDefault();
        socket.emit("move", direction);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [joined, socket]);

  const join = () => {
    joinedProfile.current = { displayName, avatarId };
    socket.emit("joinRoom", joinedProfile.current);
    setJoined(true);
  };

  if (isOverlay) {
    return <main className="overlay"><World participants={participants} connected={connected} /></main>;
  }

  return (
    <main className="app-shell">
      <header>
        <a className="brand" href="/">VELNEST<span>✦</span></a>
        <div className="mock-pill">DAY 1 · MOCK TWITCH ID</div>
      </header>

      {!joined ? (
        <section className="join-layout">
          <div className="intro">
            <p className="eyebrow">YOUR PLACE IN THE STREAM</p>
            <h1>Don’t just watch.<br /><em>Be there.</em></h1>
            <p className="lede">A tiny shared world for the people who make a Twitch community feel like home.</p>
            <div className="proof"><span>LIVE PROTOTYPE</span> Real Twitch entitlement arrives Day 2.</div>
          </div>

          <div className="join-card">
            <div className="step"><span>01</span> Choose your name</div>
            <label>
              <span>DISPLAY NAME</span>
              <input value={displayName} maxLength={20} onChange={(event) => setDisplayName(event.target.value)} />
            </label>
            <div className="step"><span>02</span> Choose your form</div>
            <div className="avatar-grid">
              {AVATARS.map((avatar) => (
                <button
                  className="avatar-card"
                  data-selected={avatar.id === avatarId}
                  key={avatar.id}
                  onClick={() => setAvatarId(avatar.id)}
                  type="button"
                  style={{ "--avatar": avatar.color, "--accent": avatar.accent } as React.CSSProperties}
                >
                  <b style={{ backgroundImage: `url(${avatar.image})`, backgroundPosition: avatar.position }} />
                  <span>{avatar.name}</span>
                </button>
              ))}
            </div>
            <button className="enter-button" onClick={join} disabled={!displayName.trim()} type="button">
              Enter the nest <span>→</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="play-layout">
          <World participants={participants} connected={connected} />
          <aside className="controller">
            <p className="eyebrow">YOU’RE INSIDE</p>
            <h2>Move your character</h2>
            <p>Use WASD, arrow keys, or the controls below. Open another tab to add a second character.</p>
            <Dpad onMove={(direction) => socket.emit("move", direction)} />
            <div className="obs-note">
              <span>OBS BROWSER SOURCE</span>
              <code>http://localhost:5173/?view=overlay</code>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}

