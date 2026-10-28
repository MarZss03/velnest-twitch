# Twitch connection

The local room runs in demo mode by default. Real mode uses server-side authorization-code OAuth and validates the token and profile. The default `TWITCH_ADMISSION=signed-in` admits all signed-in Twitch viewers and requests no additional scopes or subscription data. Only the configured broadcaster can manage participants.

## Configure

1. Create a confidential website application in the Twitch Developer Console. Register the exact callback `http://localhost:3001/auth/twitch/callback` for local use.
2. Copy `.env.example` to `.env` in the repository root. Fill in the application client ID, secret, and numeric broadcaster ID. Never commit `.env` or put the secret in a `VITE_` variable.
3. Set `MOCK_MODE=false`, leaving `WEB_ORIGIN=http://localhost:5173` for the standard local ports. A blank `VITE_REALTIME_URL` uses localhost:3001 in development and the current site origin in the compiled single-host app.
4. Restart `pnpm dev`. The entry screen changes from Local demo to Twitch community. Connect with Twitch and return to choose a character.

Optional `TWITCH_ADMISSION=subscribers` requests `user:read:subscriptions` and restricts avatar control to subscribers and the broadcaster. That mode requires an affiliate/partner channel; other signed-in viewers may only watch. The owner selected open admission for the current standard channel. If no credentials are present in real mode, entry stays disabled and the page says the Twitch connection is pending.

## Session behavior

- Tokens and client secrets stay on the server. Browser cookies contain random session IDs, are HttpOnly and SameSite=Lax, and become Secure under `NODE_ENV=production`.
- Login state is random, cookie-bound, single-use and expires after ten minutes.
- Sessions expire within one hour or at token expiry, whichever comes first. Sign in again when the session expires; refresh tokens are not stored.
- Active sessions revalidate the token every fifteen minutes, and subscription status only in subscriber mode. Revoked or expired sessions lose control of their avatar. Log out invalidates the server session immediately.
- Session data is in memory. Restarting the server signs everyone out. This MVP supports one server process; multiple instances require a shared session/room store.
- OAuth callback query strings and provider error bodies are excluded from application logs. Identity responses are not cached.

For a hosted setup, serve the frontend and API on the same site over HTTPS, set the registered callback and environment values to their hosted URLs, and build with the correct `VITE_REALTIME_URL`. The OBS URL shown in the controller follows the page's actual origin.

## Broadcaster room controls

The configured broadcaster sees **Manage the room** before entering and in the controller after entering. Choose a participant, then confirm removal. The participant's verified Twitch identity is denied room control for five minutes across every connected tab, reconnect and fresh login. Existing avatars and seat reservations are removed immediately; observers receive the updated room. The participant may continue watching. The broadcaster cannot remove their own identity.

The server checks the broadcaster session for every removal. Subscribers, anonymous viewers and demo identities cannot moderate. Timeouts are stored in memory and disappear when the server restarts. This is a VELNEST room timeout; it does not ban a user from Twitch chat or change their subscription.

## Evidence and remaining verification

`pnpm test:auth` runs thirteen tests covering callback binding/replay/expiry, scope-free open admission, optional subscriber admission, token scope and revocation, cookie/session expiry, logout origin checks, anonymous rejection, verified display names, reactions, broadcaster access, explicit mock mode and unconfigured real mode. Open-admission coverage checks that no subscription endpoint is called, viewers cannot moderate, broadcaster removal still blocks reentry, timeouts expire and revoked sessions lose access. Other moderation coverage includes multi-connection removal, seat release, fresh-login denial, stale targets and self-removal rejection. HTTP routes and actual Socket.IO connections use a simulated provider.

An isolated local browser fixture verified the broadcaster controls before/after joining, cancellation, confirmed removal, count/list updates, empty state, focus returning to the management heading and responsive layout. The fixture was separate from the application and used simulated accounts; it does not establish real Twitch authorization.

The real application credentials have been verified and configured privately. Still required: complete live user authorization, verify viewer/broadcaster behavior against Twitch and record the product working on Twitch for the contest. Automated provider simulation does not prove those steps. Optional subscriber mode remains unverified against a real affiliate/partner channel.

Official references: [Authorization code flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow), [Check User Subscription](https://dev.twitch.tv/docs/api/reference/#check-user-subscription), [Token validation](https://dev.twitch.tv/docs/authentication/validate-tokens/).
