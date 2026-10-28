# VELNEST

VELNEST is a subscriber-only interactive world for Twitch communities. Viewers sign in with Twitch, choose an avatar, and control it from desktop or mobile while the shared world appears in OBS.

## Current build

The default local build uses clearly marked demo identity. The room includes:

- three Blender-built, animated humanoid avatars with interchangeable accessories;
- real-time shared movement across browser tabs/devices;
- keyboard and touch controls;
- a clean OBS overlay view;
- event-driven 3D arrival, destination and reaction effects;
- server-side Twitch OAuth, subscriber verification and expiring sessions.

Real Twitch sign-in requires an application configured in the Twitch Developer Console. See [Twitch setup](docs/TWITCH-SETUP.md). Until credentials are configured and a live account walkthrough succeeds, the Twitch integration is not considered verified against Twitch itself.

## Run locally

```powershell
pnpm install
Copy-Item .env.example .env
pnpm dev
```

Open `http://localhost:5173`. For an OBS Browser Source, use:

```text
http://localhost:5173/?view=overlay
```

The realtime server runs at `http://localhost:3001`.

## Verify

```powershell
pnpm typecheck
pnpm build
pnpm test:auth
pnpm test:room
pnpm test:animations
pnpm test:motion
```

`test:auth` exercises the real HTTP routes and Socket.IO room against a simulated Twitch provider. It does not use a real Twitch account.

## Project map

- `apps/web` — viewer controller and OBS overlay
- `apps/server` — authoritative realtime room server
- `packages/shared` — shared event contracts and avatar definitions
- `docs` — migrated product context, architecture, and daily plan

Start with [docs/DAY-1.md](docs/DAY-1.md).

