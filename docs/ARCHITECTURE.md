# Architecture

## Today

```text
Viewer controller (React/Vite) ── Socket.IO ── Realtime server (Fastify)
          │                                          │
          └──────────── same room state ─────────────┘
                             │
                      OBS overlay (React)
```

The server is authoritative for participant identity within a socket session, position bounds, and room membership. Clients render state and send movement intents.

## Twitch integration boundary

The production login flow will use Twitch's server-side authorization-code/OIDC flow. The viewer token requests `user:read:subscriptions`; the backend calls **Check User Subscription** using the configured broadcaster ID and the authenticated viewer ID. Tokens and client secrets stay server-side.

The admission decision becomes:

```text
valid session AND (mock mode OR active subscription to configured broadcaster)
```

Channel Points and subscription lifecycle events are later integrations through EventSub, not requirements for the movement loop.

## Why this shape

- A separate realtime server avoids pretending serverless HTTP is a persistent game socket.
- A browser controller works on desktop and phone without an install.
- The OBS view reuses the same renderer and state stream.
- Shared TypeScript contracts reduce protocol drift during a short build.
- A 2D DOM/canvas-style scene is cheaper and more reliable than 3D for a six-day hackathon.

## Security rules before public deployment

- OAuth `state`, PKCE where supported by the chosen library, secure HTTP-only session cookies, and token validation
- server-side entitlement checks only
- never expose Twitch client secret or refresh tokens to the browser
- movement rate limit and server-side bounds
- fixed allow-listed assets for MVP
- participant kick/ban list and escaped display names
- explicit room capacity

## Current ports

- web: `5173`
- realtime/API: `3001`

