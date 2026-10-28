# Single-host runtime

The compiled frontend, models, fonts, API and Socket.IO server can now run from one Node process. This avoids shipping a production frontend that points at the developer's localhost. It is a packaging step; no public host has been provisioned.

```text
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

`pnpm start` serves `apps/web/dist` and the room server on `PORT` (default 3001). It fails clearly if the compiled frontend is missing. The repository root, `.env` and source files are not the static root. HTML and models revalidate; hashed application bundles use immutable caching.

Leave `VITE_REALTIME_URL` blank for the compiled site to connect to its own origin. Development still defaults to localhost:3001. An explicit URL remains available when intentionally separating frontend and API.

Set `WEB_ORIGIN` to the exact browser origin, including its scheme and port. In a copied development `.env`, this is normally localhost:5173 and must be changed for a packaged run. If no value exists at all, the packaged entry point defaults to localhost on `PORT`.

For a real hosted deployment, configure `NODE_ENV=production`, `MOCK_MODE=false`, `WEB_ORIGIN=https://your-actual-domain`, the registered HTTPS `TWITCH_REDIRECT_URI`, client ID, client secret and broadcaster ID on the server. A long-running Node host with WebSocket support and HTTPS termination is required. Session and room state are still process-local; this build is not a multi-instance service.

## Local packaged demo

From PowerShell after building:

```powershell
$env:BIND_ADDRESS='127.0.0.1'
$env:PORT='4175'
$env:WEB_ORIGIN='http://localhost:4175'
$env:MOCK_MODE='true'
pnpm start
```

Then open localhost:4175, or localhost:4175/?view=overlay for OBS. This explicitly uses demo identity. For the existing two-port development workflow, the owner can use START-VELNEST.cmd on Windows; the launcher preserves an existing private `.env`.

## Verification and limits

`pnpm test:hosting` builds the actual site and runs three tests covering HTML/overlay routes, JavaScript cache headers, GLBs, fonts, private/source-path rejection, API coexistence, realtime observers, real-mode admission checks and clear missing-build failure. All three passed on October 28, 2026, along with typecheck and the twelve existing authentication tests.

The automated approval system rejected standalone `pnpm start` smoke attempts, including a loopback-only attempt, returning only `blocked by policy`. Therefore this pass does not claim a successful standalone browser walkthrough or a public deployment. The launcher and manual packaged commands are provided for an owner-run check; the automated route/Socket.IO evidence is separate from that missing browser evidence.

Plugin source: https://github.com/fastify/fastify-static. The pinned @fastify/static 10.1.8 package declares Fastify 5.x compatibility.
