# Architecture

## Current implementation

```text
Viewer controller (React/Vite) ── Socket.IO ── Room server (Fastify)
          │                                      │
          └──── Three.js + shared room state ────┘
                             │
                    OBS browser source
```

The browser loads a Blender-authored lounge, one of three skinned humanoid avatars and optional modular accessories. Six exported clips provide Idle, Walk, Wave, Cheer, Dance and Sit. Controller and OBS mode use the same renderer and authoritative state. Scene bundles are lazy-loaded; fonts and models are served from the repository's public assets.

The room server owns membership, verified identity in real mode, movement, routes around furniture, reactions and three sofa reservations. A 70 ms navigation loop follows an accepted route. A seat is reserved while its owner approaches; arrival switches to the seated state. Moving, standing, leaving, disconnecting, losing authorization or broadcaster removal releases that seat. Late observers receive the current snapshot immediately.

The previous 2D-only proposal was superseded by the requested Blender/Three.js implementation. There is one room per server process, not a general-purpose room editor or a multi-channel hosting service.

## Twitch integration boundary

The implemented login flow is server-side authorization-code OAuth. It requests `user:read:subscriptions`, validates the token, fetches the verified profile and calls Check User Subscription for one configured broadcaster. The broadcaster can enter their own room without a self-subscription. Viewers without entitlement may watch but cannot control an avatar. Tokens and client secrets stay server-side.

Admission requires:

```text
explicit demo mode OR (valid session AND subscriber/broadcaster role AND no active room timeout)
```

Channel Points and subscription lifecycle events are later integrations through EventSub, not requirements for the movement loop.

OAuth state is cookie-bound, single-use and expires after ten minutes. Session cookies carry opaque identifiers and are HttpOnly/SameSite=Lax, with Secure enabled in production. Sessions last at most one hour and revalidate token/subscription every fifteen minutes. Refresh tokens are not stored. Logout invalidates the session. Provider error bodies and OAuth query strings are excluded from application logs.

## Broadcaster controls and storage

Only the verified configured broadcaster can remove a participant. An inline confirmation requests a five-minute timeout, applied to the Twitch identity across every connected tab, reconnect and fresh login. The server removes existing avatars and publishes the new snapshot. This does not change Twitch chat permissions or subscription status. The owner cannot timeout their own broadcaster identity. Demo mode does not grant moderation privileges.

Sessions, participant state and room timeouts are process-local. Restarting signs users out and clears timeouts. Multiple server instances would require shared storage and coordination.

## Motion

Three.js blends authored clips over 160 ms and interpolates toward authoritative movement. Arrival, destination and reaction cues share geometry, expire within 1.6 seconds and cap at 16 concurrent effects. Hidden tabs pause rendering. Reduced motion suppresses celebration movement while retaining stationary destination feedback, text and a correct seated pose. The editable HyperFrames study uses the same assets; it is separate from the live Twitch contest demonstration.

## Why this shape

- A separate realtime server avoids pretending serverless HTTP is a persistent game socket.
- A browser controller works on desktop and phone without an install.
- The OBS view reuses the same renderer and state stream.
- Shared TypeScript contracts reduce protocol drift during a short build.
- Blender sources and exported GLBs keep the requested character/room art editable while Three.js supports the same assets in controller and OBS modes.

## Verification and deployment limits

The public repository has been freshly cloned, installed with its frozen lockfile, built and exercised through two controllers plus an OBS browser view on Windows. Tests cover simulated-provider authentication, room paths, seat races, moderation, actual GLB clips and bounded effects. See REPRODUCIBILITY.md.

Live Twitch account authorization, subscriber/broadcaster walkthrough and final broadcast demonstration remain unverified. Hosting should place frontend and API on the same HTTPS site, with the exact registered callback and origin. The default local URLs require explicit network-address configuration before a physical phone can connect.

The single-room MVP admits at most 24 avatars, counting the broadcaster if they enter. The server synchronously checks capacity before inserting membership, so competing joins cannot overbook. Full-room connections remain observers. Leaving, disconnecting or removal releases capacity; the controller re-enables entry when an updated snapshot contains space. Rejoining on an existing socket does not consume another place. The broadcaster can manage the room without entering an avatar.

Broader ingress limits and physical-device load profiling remain deployment work. The admission ceiling is a product policy, not evidence that 24 avatars meet a particular frame-rate or public-traffic target. Existing movement/action/join limits and effect caps do not establish arbitrary public-room scale. Assets are fixed and allow-listed; user-uploaded models remain outside this MVP.

## Current ports

- web: `5173`
- realtime/API: `3001`

