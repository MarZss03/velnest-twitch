# VELNEST

VELNEST is a subscriber-only interactive world for Twitch communities. Viewers sign in with Twitch, choose an avatar, and control it from desktop or mobile while the shared world appears in OBS.

## Current build

The default local build uses clearly marked demo identity. The room includes:

- three Blender-built, animated humanoid avatars with interchangeable accessories;
- real-time shared movement across browser tabs/devices;
- keyboard and touch controls;
- a clean OBS overlay view;
- event-driven 3D arrival, destination and reaction effects;
- three reservable sofa seats with walk-to-seat, Blender-authored sitting and standing transitions;
- server-side Twitch OAuth, subscriber verification and expiring sessions.
- broadcaster-only removal with a five-minute identity timeout.
- a 24-character admission limit, with full-room spectating and automatic entry availability when a place opens.

Real Twitch sign-in requires an application configured in the Twitch Developer Console. See [Twitch setup](docs/TWITCH-SETUP.md). Until credentials are configured and a live account walkthrough succeeds, the Twitch integration is not considered verified against Twitch itself.

## Run locally

Verified on Windows with Node.js **22.23.2** and pnpm **11.25.0**. The package-manager version is pinned in `package.json`. Exported 3D models and fonts are included: Blender is only needed to edit or regenerate the source assets.

From the repository root in PowerShell:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm dev
```

In a POSIX shell, use `cp .env.example .env` for the copy step. macOS/Linux have not been separately verified.

Open `http://localhost:5173`. For an OBS Browser Source, use:

```text
http://localhost:5173/?view=overlay
```

The realtime server runs at `http://localhost:3001`.

If port 5173 is occupied, Vite may select another port. Set `WEB_ORIGIN` in `.env` to the exact frontend origin printed by Vite, then restart the app. For a phone on the same trusted network, both `WEB_ORIGIN` and `VITE_REALTIME_URL` need the development computer's reachable network address instead of `localhost`; a responsive browser preview does not establish physical-phone connectivity.

An editable 12-second Blender/HyperFrames motion study and its verified 1080p MP4 are in [art/motion/velnest-room](art/motion/velnest-room/README.md). This staged character sequence is separate from the required live Twitch contest demonstration.

## Verify

```powershell
pnpm typecheck
pnpm build
pnpm test:auth
pnpm test:room
pnpm test:animations
pnpm test:motion
pnpm test:seating
pnpm test:capacity
pnpm test:labels
pnpm test:cosmetics
```

`test:auth` exercises the real HTTP routes and Socket.IO room against a simulated Twitch provider. It does not use a real Twitch account.

See [clean-clone verification](docs/REPRODUCIBILITY.md) for the tested public revision and the limits of that evidence.

The [Blender pose boards](art/blender/review/README.md) show 72 sampled character/accessory/action combinations. `test:cosmetics` additionally checks 360 runtime samples, delayed asset loading and disposal when accessories are switched.

## Project map

- `apps/web` — viewer controller and OBS overlay
- `apps/server` — authoritative realtime room server
- `packages/shared` — shared event contracts and avatar definitions
- `docs` — migrated product context, architecture, and daily plan

Start with [docs/DAY-1.md](docs/DAY-1.md).

