# VELNEST

VELNEST is a subscriber-only interactive world for Twitch communities. Viewers sign in with Twitch, choose an avatar, and control it from desktop or mobile while the shared world appears in OBS.

## Day 1 vertical slice

The current build deliberately uses mock identity. It proves the highest-risk experience first:

- three selectable avatars;
- real-time shared movement across browser tabs/devices;
- keyboard and touch controls;
- a clean OBS overlay view;
- a server boundary ready for Twitch OAuth and subscription checks.

## Run locally

```powershell
pnpm install
pnpm dev
```

Open `http://localhost:5173`. For an OBS Browser Source, use:

```text
http://localhost:5173/?view=overlay
```

The realtime server runs at `http://localhost:3001`.

## Project map

- `apps/web` — viewer controller and OBS overlay
- `apps/server` — authoritative realtime room server
- `packages/shared` — shared event contracts and avatar definitions
- `docs` — migrated product context, architecture, and daily plan

Start with [docs/DAY-1.md](docs/DAY-1.md).

