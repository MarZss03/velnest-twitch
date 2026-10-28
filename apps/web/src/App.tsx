import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { AvatarPreview } from './AvatarPreview';
import { Room3D } from './Room3D';
import {
  AVATARS,
  ACTIONS,
  COSMETICS,
  type CosmeticId,
  type ActionId,
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
        {connected ? "Connected to the nest" : "Reconnecting…"}
        <span>{participants.length} inside</span>
      </div>
      <div className="world">
        <Room3D participants={participants} />
        <div className="moon" />
        <div className="hill hill-one" />
        <div className="hill hill-two" />
        <div className="pond" />
        <div className="fire"><i /><i /><i /></div>
        <div className="room-sign" aria-hidden="true">The afterparty<br /><small>Stay for one more game.</small></div>
        <div className="stage-platform" aria-hidden="true" />
        {participants.map((participant) => {
          const avatar = AVATARS.find((item) => item.id === participant.avatarId) ?? AVATARS[0];
          return (
            <div
              className="participant"
              data-action={participant.action ?? "idle"}
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
            <span>Your community goes here.</span>
            Choose your character and make yourself at home.
          </div>
        )}
      </div>
    </section>
  );
}

function Dpad({ onMove }: { onMove: (direction: Direction) => void }) {
  const held = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => { if (held.current) clearInterval(held.current); held.current = null; };
  useEffect(() => {
    window.addEventListener('blur', stop);
    return () => { stop(); window.removeEventListener('blur', stop); };
  }, []);
  const button = (label: string, direction: Direction, className: string) => (
    <button
      className={className}
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        stop(); onMove(direction);
        held.current = setInterval(() => onMove(direction), 70);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onMove(direction); } }}
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

function ActionBar({ onAction }: { onAction: (actionId: ActionId) => void }) {
  return (
    <div className="action-bar" aria-label="Character actions">
      {ACTIONS.map((action) => (
        <button key={action.id} onClick={() => onAction(action.id)} type="button">
          {action.name}
        </button>
      ))}
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
  const [cosmetic, setCosmetic] = useState<CosmeticId>('none');
  const joinedProfile = useRef<{ displayName: string; avatarId: AvatarId; cosmetic: CosmeticId } | null>(null);

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
    const keys = new Set<string>();
    const directions: Record<string, Direction> = {
      ArrowUp: { dx: 0, dy: -1 }, w: { dx: 0, dy: -1 },
      ArrowDown: { dx: 0, dy: 1 }, s: { dx: 0, dy: 1 },
      ArrowLeft: { dx: -1, dy: 0 }, a: { dx: -1, dy: 0 },
      ArrowRight: { dx: 1, dy: 0 }, d: { dx: 1, dy: 0 }
    };
    const tick = () => {
      let dx=0, dy=0;
      keys.forEach(key => { dx+=directions[key].dx; dy+=directions[key].dy; });
      const length=Math.hypot(dx,dy);
      if(length) socket.emit('move',{dx:dx/length,dy:dy/length});
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,[contenteditable="true"]')) return;
      const key=event.key.length===1?event.key.toLowerCase():event.key;
      const direction = directions[key];
      if (direction) {
        event.preventDefault();
        if(!keys.has(key)) { keys.add(key); tick(); }
      }
    };
    const onKeyUp=(event: KeyboardEvent) => keys.delete(event.key.length===1?event.key.toLowerCase():event.key);
    const clear=()=>keys.clear();
    const interval=setInterval(tick,70);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener('keyup',onKeyUp);
    window.addEventListener('blur',clear);
    return () => { clearInterval(interval); window.removeEventListener("keydown", onKeyDown); window.removeEventListener('keyup',onKeyUp); window.removeEventListener('blur',clear); };
  }, [joined, socket]);

  const join = () => {
    joinedProfile.current = { displayName, avatarId, cosmetic };
    socket.emit("joinRoom", joinedProfile.current);
    setJoined(true);
  };

  if (isOverlay) {
    return <main className="overlay"><World participants={participants} connected={connected} /></main>;
  }

  return (
    <main className="app-shell">
      <header>
        <a className="brand" href="/">velnest<span> / </span>the community room</a>
        <div className="mock-pill">Local demo</div>
      </header>

      {!joined ? (
        <section className="join-layout">
          <div className="intro">
            <h1>Meet you in the nest.</h1>
            <p className="lede">Your Twitch community, hanging out between the good moments.</p>
            <World participants={participants} connected={connected} />
          </div>

          <div className="join-card">
            <h2>Make an entrance.</h2>
            <AvatarPreview avatarId={avatarId} cosmetic={cosmetic} />
            <label>
              <span>Your name</span>
              <input value={displayName} maxLength={20} onChange={(event) => setDisplayName(event.target.value)} />
            </label>
            <div className="step">Pick your character</div>
            <div className="avatar-grid">
              {AVATARS.map((avatar) => (
                <button
                  className="avatar-card"
                  data-selected={avatar.id === avatarId}
                  aria-pressed={avatar.id === avatarId}
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
            <label className="cosmetic-picker">
              <span>Bring something along</span>
              <select value={cosmetic} onChange={event => setCosmetic(event.target.value as CosmeticId)}>
                {COSMETICS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <button className="enter-button" onClick={join} disabled={!displayName.trim()} type="button">
              Enter the room
            </button>
            <p className="demo-note">Try the room with a demo name. Twitch sign-in is coming next.</p>
          </div>
        </section>
      ) : (
        <section className="play-layout">
          <World participants={participants} connected={connected} />
          <aside className="controller">
            <h2>Hey, {displayName}.</h2>
            <p>Use WASD, arrow keys, or the controls below. Open another tab to add a second character.</p>
            <Dpad onMove={(direction) => socket.emit("move", direction)} />
            <ActionBar onAction={(actionId) => socket.emit("performAction", actionId)} />
            <label className="cosmetic-picker">
              <span>Your accessory</span>
              <select value={cosmetic} onChange={event => {
                const next=event.target.value as CosmeticId;
                setCosmetic(next);
                if(joinedProfile.current) joinedProfile.current.cosmetic=next;
                socket.emit('changeCosmetic',next);
              }}>
                {COSMETICS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
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

