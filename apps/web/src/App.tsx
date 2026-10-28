import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {SceneBoundary} from './SceneBoundary';
import {
  AVATARS,
  ACTIONS,
  COSMETICS,
  SEATS,
  type SeatId,
  type CosmeticId,
  type ActionId,
  type AvatarId,
  type ClientToServerEvents,
  type Participant,
  type SessionInfo,
  type RoomConfig,
  type ServerToClientEvents
} from "@velnest/shared";

const AvatarPreview=lazy(()=>import('./AvatarPreview').then(module=>({default:module.AvatarPreview})));
const Room3D=lazy(()=>import('./Room3D').then(module=>({default:module.Room3D})));

type VelnestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
type Direction = { dx: number; dy: number };

const realtimeUrl = import.meta.env.VITE_REALTIME_URL ?? "http://localhost:3001";
const isOverlay = new URLSearchParams(window.location.search).get("view") === "overlay";
const overlayUrl = new URL('/?view=overlay',window.location.origin).href;
const authMessages: Record<string,string> = {
  denied: 'Twitch sign-in was cancelled. You can try again whenever you’re ready.',
  invalid_state: 'That sign-in link expired. Please start again.',
  unavailable: 'Twitch sign-in could not finish. Please try again.',
};
const showWorld=()=>{
  window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  document.getElementById('community-world')?.focus({preventScroll:true});
};

function World({ participants, connected, connecting=false, onNavigate, onSit, selfId }: { participants: Participant[]; connected: boolean; connecting?:boolean; onNavigate?: (position:{x:number;y:number})=>void; onSit?: (seatId:SeatId)=>void; selfId?: string }) {
  return (
    <section id="community-world" className="world-shell" tabIndex={-1} aria-label="VELNEST shared world">
      <div className="world-topline">
        {connected ? "Connected to the nest" : connecting ? 'Connecting to the nest…' : 'Live room unavailable'}
        <span>{connected ? `${participants.length} inside` : 'Occupancy unavailable'}</span>
      </div>
      <div className="world">
        <SceneBoundary><Suspense fallback={<div className="room-loading" role="status">Opening the room…</div>}>
          <Room3D participants={connected?participants:[]} occupancyKnown={connected} onNavigate={connected?onNavigate:undefined} onSit={connected?onSit:undefined} selfId={selfId} />
        </Suspense></SceneBoundary>
        {(!connected || participants.length === 0) && (
          <div className="empty-world">
            <span>{connected?'Your community goes here.':connecting?'Connecting to the room…':'Live room unavailable'}</span>
            {connected?'Choose your character and make yourself at home.':connecting?'Your community will appear once connected.':'Your connection will retry automatically.'}
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5m-5 5 5-5 5 5" /></svg>
    </button>
  );

  return (
    <div className="dpad">
      {button("Move up", { dx: 0, dy: -1 }, "up")}
      {button("Move left", { dx: -1, dy: 0 }, "left")}
      <span className="dpad-center" />
      {button("Move right", { dx: 1, dy: 0 }, "right")}
      {button("Move down", { dx: 0, dy: 1 }, "down")}
    </div>
  );
}

function ActionBar({ onAction, active, disabled=false }: { onAction: (actionId: ActionId) => void; active: ActionId | null; disabled?:boolean }) {
  return (
    <div className="action-bar" aria-label="Character actions">
      {ACTIONS.map((action) => (
        <button key={action.id} disabled={disabled} aria-pressed={active===action.id} onClick={() => onAction(action.id)} type="button">
          {action.name}
        </button>
      ))}
    </div>
  );
}

export function App() {
  const socket = useMemo<VelnestSocket>(() => io(realtimeUrl, { autoConnect: false, withCredentials: true }), []);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connected, setConnected] = useState(socket.connected);
  const [joined, setJoined] = useState(isOverlay);
  const [displayName, setDisplayName] = useState(() => `Nestling${Math.floor(10 + Math.random() * 90)}`);
  const [avatarId, setAvatarId] = useState<AvatarId>("riff");
  const [cosmetic, setCosmetic] = useState<CosmeticId>('none');
  const [previewOpen,setPreviewOpen]=useState(false);
  const [roomConfig,setRoomConfig]=useState<RoomConfig|null>(null);
  const [account,setAccount]=useState<SessionInfo['user']>(null);
  const [accountAttempt,setAccountAttempt]=useState(0);
  const [accountLoading,setAccountLoading]=useState(true);
  const [accountError,setAccountError]=useState('');
  const [interactionMessage,setInteractionMessage]=useState('');
  const [roomError,setRoomError]=useState(()=>authMessages[new URLSearchParams(location.search).get('auth')??'']??'');
  const joinedProfile = useRef<{ displayName: string; avatarId: AvatarId; cosmetic: CosmeticId } | null>(null);

  useEffect(()=>{
    const url=new URL(location.href);
    if(url.searchParams.has('auth')) { url.searchParams.delete('auth'); history.replaceState(null,'',url); }
  },[]);

  useEffect(()=>{
    if(isOverlay) return;
    window.scrollTo({top:0,behavior:'instant'});
    if(joined) document.getElementById('community-world')?.focus({preventScroll:true});
  },[joined]);

  useEffect(()=>{
    const controller=new AbortController();
    setAccountLoading(true);
    setAccountError('');
    Promise.all([
      fetch(`${realtimeUrl}/api/config`,{credentials:'include',signal:controller.signal}),
      fetch(`${realtimeUrl}/api/session`,{credentials:'include',signal:controller.signal}),
    ]).then(async ([configResponse,sessionResponse])=>{
      if(!configResponse.ok || !sessionResponse.ok) throw new Error('Account unavailable');
      const [config,session]=await Promise.all([configResponse.json() as Promise<RoomConfig>,sessionResponse.json() as Promise<SessionInfo>]);
      if(controller.signal.aborted) return;
      setRoomConfig(config); setAccount(session.user);
      if(!config.mockMode && session.user) setDisplayName(session.user.displayName);
    }).catch(()=>{ if(!controller.signal.aborted) setAccountError('The room connection is unavailable. Please try again.'); })
      .finally(()=>{ if(!controller.signal.aborted) setAccountLoading(false); });
    return ()=>controller.abort();
  },[accountAttempt]);

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      // The API may become available after the page during local startup.
      setAccountAttempt(attempt=>attempt+1);
      if (!isOverlay && joinedProfile.current) {
        socket.emit("joinRoom", joinedProfile.current);
      }
    };
    const onDisconnect = () => setConnected(false);
    const onRoomState = (state: Participant[]) => setParticipants(state);
    const onRoomError: ServerToClientEvents['roomError'] = error => {
      setRoomError(error.message); joinedProfile.current=null; setJoined(false);
      setAccountAttempt(attempt=>attempt+1);
    };
    if (!socket.connected) socket.connect();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("roomState", onRoomState);
    socket.on('roomError',onRoomError);
    socket.on('interactionError',setInteractionMessage);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("roomState", onRoomState);
      socket.off('roomError',onRoomError);
      socket.off('interactionError',setInteractionMessage);
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
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
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
    if(accountLoading || accountError || !roomConfig || !connected || (!roomConfig.mockMode && (!account || account.role==='viewer'))) return;
    setRoomError('');
    joinedProfile.current = { displayName, avatarId, cosmetic };
    socket.emit("joinRoom", joinedProfile.current);
    setJoined(true);
  };
  const selfParticipant=participants.find(person=>person.id===socket.id);
  const requestSeat=(seatId:SeatId)=>{ setInteractionMessage(''); socket.emit('sit',seatId); showWorld(); };
  const unavailable=Boolean(accountError)||(!connected&&!accountLoading);
  const connecting=!connected&&accountLoading&&!accountError;
  const connectionMessage=accountError||(!connected&&!accountLoading?'The live room is offline. Retry the connection to enter.':'');
  const retryConnection=()=>{setAccountAttempt(attempt=>attempt+1);socket.connect();};

  const signOut=async()=>{
    setAccountLoading(true);
    try {
      const response=await fetch(`${realtimeUrl}/auth/logout`,{method:'POST',credentials:'include'});
      if(!response.ok) throw new Error('Sign-out unavailable');
      socket.emit('leaveRoom'); joinedProfile.current=null; setJoined(false); setAccount(null);
      // Reconnect so the socket handshake carries the cleared session cookie.
      socket.disconnect(); socket.connect();
    } catch { setRoomError('Sign-out could not finish. Please try again.'); }
    finally { setAccountLoading(false); }
  };

  if (isOverlay) {
    return <main className="overlay"><World participants={participants} connected={connected} connecting={connecting} /></main>;
  }

  return (
    <main className="app-shell">
      <header>
        <a className="brand" href="/" aria-label="VELNEST community room">velnest<span className="brand-context"> / the community room</span></a>
        <div className="mock-pill">{unavailable?'Connection unavailable':roomConfig?.mockMode ? 'Local demo' : roomConfig ? 'Twitch community' : 'Connecting…'}</div>
      </header>
      {(roomError || connectionMessage) && <div className="connection-message" role="alert">
        {connectionMessage || roomError}
        {connectionMessage && <button type="button" onClick={retryConnection}>Retry connection</button>}
      </div>}

      {!joined ? (
        <section className="join-layout">
          <div className="intro">
            <h1>Meet you in the nest.</h1>
            <p className="lede">Your Twitch community, hanging out between the good moments.</p>
            <World participants={participants} connected={connected} connecting={connecting} />
          </div>

          <div className="identity-rail">
            <h2>Make an entrance.</h2>
            {roomConfig?.mockMode ? <label>
              <span>Your name</span>
              <input value={displayName} maxLength={20} onChange={(event) => setDisplayName(event.target.value)} />
            </label> : account ? <div className="account-identity">
              <span>Signed in as <strong>{account.displayName}</strong></span>
              <button type="button" onClick={signOut} disabled={accountLoading}>Sign out</button>
            </div> : <p className="account-note">{accountLoading ? 'Checking your connection…' : unavailable?'Reconnect to choose your room identity.':'Bring your Twitch identity into the room.'}</p>}
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
            {roomConfig && !roomConfig.mockMode && !account && roomConfig.oauthConfigured && connected && !accountLoading && !accountError ?
              <a className="enter-button twitch-signin" href={`${realtimeUrl}/auth/twitch`}>Connect with Twitch</a> :
              <button className="enter-button" onClick={join} disabled={!displayName.trim() || !connected || accountLoading || Boolean(accountError) || !roomConfig || (!roomConfig.mockMode && (!account || account.role==='viewer'))} type="button">
                {unavailable?'Connection unavailable':accountLoading ? 'Checking connection…' : !connected ? 'Connecting…' : roomConfig && !roomConfig.mockMode && !roomConfig.oauthConfigured ? 'Twitch connection pending' : account?.role==='viewer' && !roomConfig?.mockMode ? 'Subscriber access required' : 'Enter the room'}
              </button>}
            <p className="demo-note">{unavailable?'Use Retry connection above to reconnect. You can inspect the characters while you wait.':roomConfig?.mockMode ? 'Local demo. Choose a name and try the shared room.' : account?.role==='viewer' ? 'You’re signed in. This room is open to this channel’s subscribers and broadcaster; everyone can watch.' : roomConfig && !roomConfig.oauthConfigured ? 'This room is waiting for its Twitch connection.' : 'Sign in to verify your place in the channel community.'}</p>
            <details className="preview-details" onToggle={event=>setPreviewOpen(event.currentTarget.open)}>
              <summary>Inspect character and animations</summary>
              {previewOpen && <SceneBoundary><Suspense fallback={<div className="preview-loading" role="status">Opening character preview…</div>}><AvatarPreview avatarId={avatarId} cosmetic={cosmetic} /></Suspense></SceneBoundary>}
            </details>
          </div>
        </section>
      ) : (
        <section className="play-layout">
          <World participants={participants} connected={connected} connecting={connecting} selfId={socket.id} onNavigate={position=>socket.emit('moveTo',position)} onSit={requestSeat} />
          <aside className="controller">
            <h1>Hey, {displayName}.</h1>
            <button className="leave-room" type="button" onClick={()=>{
              socket.emit('leaveRoom');
              joinedProfile.current=null;
              setJoined(false);
            }}>Leave and change character</button>
            <p>Click the floor to walk around furniture. Use WASD, arrow keys, or hold the controls below to take over.</p>
            <Dpad onMove={(direction) => socket.emit("move", direction)} />
            <ActionBar disabled={Boolean(selfParticipant?.seat)} active={selfParticipant?.action??null} onAction={(actionId) => socket.emit("performAction", actionId)} />
            <div className="seat-controls" aria-label="Sofa seats">
              <span className="seat-heading">Take a seat</span>
              <div className="seat-options">{SEATS.map((seat,index)=>{
                const occupant=participants.find(person=>person.seat?.id===seat.id);
                const mine=occupant?.id===socket.id;
                return <button type="button" key={seat.id} disabled={Boolean(occupant)} aria-label={`Sit on ${seat.name}${occupant ? `, ${mine?'your seat':`taken by ${occupant.displayName}`}` : ''}`} onClick={()=>requestSeat(seat.id)}>
                  {['Left','Middle','Right'][index]}<small>{mine?'Yours':occupant?'Taken':'Available'}</small>
                </button>;
              })}</div>
              {selfParticipant?.seat ? <button className="stand-button" type="button" onClick={()=>{setInteractionMessage('');socket.emit('stand');showWorld();}}>{selfParticipant.seat.status==='seated'?'Stand up':'Cancel walk to seat'}</button> : <p>Click a cushion or choose a seat above.</p>}
              <p className="seat-status" role="status">{interactionMessage || (selfParticipant?.seat?.status==='approaching'?'Walking to your seat…':selfParticipant?.seat?.status==='seated'?'Make yourself at home. Stand up to react.':'')}</p>
            </div>
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
              <span>OBS browser source</span>
              <code>{overlayUrl}</code>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}

