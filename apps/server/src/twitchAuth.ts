import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

const SESSION_COOKIE = 'velnest_session';
const STATE_COOKIE = 'velnest_oauth';
const MINUTE = 60_000;

export type AuthConfig = {
  mockMode: boolean;
  webOrigin: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  broadcasterId: string;
  secureCookies: boolean;
  admission?: 'signed-in' | 'subscribers';
};
export type TwitchIdentity = { id: string; displayName: string; role: 'subscriber' | 'broadcaster' | 'viewer' };
type Session = { user: TwitchIdentity; token: string; expiresAt: number; validatedAt: number };
type Validation = { client_id: string; user_id: string; expires_in: number; scopes: string[] };

export function authConfigFromEnv(): AuthConfig {
  return {
    mockMode: process.env.MOCK_MODE === 'true' || (process.env.MOCK_MODE === undefined && process.env.NODE_ENV !== 'production'),
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    clientId: process.env.TWITCH_CLIENT_ID ?? '',
    clientSecret: process.env.TWITCH_CLIENT_SECRET ?? '',
    redirectUri: process.env.TWITCH_REDIRECT_URI ?? 'http://localhost:3001/auth/twitch/callback',
    broadcasterId: process.env.TWITCH_BROADCASTER_ID ?? '',
    secureCookies: process.env.NODE_ENV === 'production',
    admission: process.env.TWITCH_ADMISSION === 'subscribers' ? 'subscribers' : 'signed-in',
  };
}

function cookieValue(header: string | undefined, name: string) {
  return header?.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function registerTwitchAuth(app: FastifyInstance, config: AuthConfig, dependencies: { fetch?: typeof fetch; now?: () => number } = {}) {
  const request = dependencies.fetch ?? fetch;
  const now = dependencies.now ?? Date.now;
  const states = new Map<string, number>();
  const sessions = new Map<string, Session>();
  const configured = Boolean(config.clientId && config.clientSecret && config.broadcasterId);
  const requiredScope = config.admission === 'subscribers' ? 'user:read:subscriptions' : undefined;
  const cookie = (name: string, value: string, seconds: number) => `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${config.secureCookies ? '; Secure' : ''}`;
  const returnToRoom = (result: string) => `${config.webOrigin}/?auth=${result}`;
  const helixHeaders = (token: string) => ({ Authorization: `Bearer ${token}`, 'Client-Id': config.clientId });
  const twitch = (url: string, init?: RequestInit) => request(url, { ...init, signal: AbortSignal.timeout(10_000) });

  async function validate(token: string): Promise<Validation> {
    const response = await twitch('https://id.twitch.tv/oauth2/validate', { headers: { Authorization: `OAuth ${token}` } });
    if (!response.ok) throw new Error('Token validation failed');
    const data = await response.json() as Validation;
    if (data.client_id !== config.clientId || !data.user_id || (requiredScope && !data.scopes?.includes(requiredScope)) || !(data.expires_in > 0)) throw new Error('Invalid token identity or scope');
    return data;
  }

  async function entitlement(token: string, userId: string): Promise<TwitchIdentity['role']> {
    if (userId === config.broadcasterId) return 'broadcaster';
    if (config.admission !== 'subscribers') return 'viewer';
    const query = new URLSearchParams({ broadcaster_id: config.broadcasterId, user_id: userId });
    const response = await twitch(`https://api.twitch.tv/helix/subscriptions/user?${query}`, { headers: helixHeaders(token) });
    if (response.status === 404) return 'viewer';
    if (!response.ok) throw new Error('Subscription check failed');
    const body = await response.json() as { data?: unknown[] };
    return body.data?.length ? 'subscriber' : 'viewer';
  }

  function sessionForCookie(header?: string): Session | undefined {
    const id = cookieValue(header, SESSION_COOKIE);
    if (!id) return;
    const session = sessions.get(id);
    if (session && session.expiresAt > now()) return session;
    sessions.delete(id);
  }

  // Sessions never persist across restarts. Revalidate active sessions every 15 minutes,
  // including subscriber eligibility when enabled; revoked tokens always lose access.
  async function sweep() {
    for (const [state, expiry] of states) if (expiry <= now()) states.delete(state);
    await Promise.allSettled([...sessions].map(async ([id, session]) => {
      if (session.expiresAt <= now()) { sessions.delete(id); return; }
      if (now() - session.validatedAt < 15 * MINUTE) return;
      try {
        const data = await validate(session.token);
        if (data.user_id !== session.user.id) throw new Error('Identity changed');
        session.user.role = await entitlement(session.token, data.user_id);
        session.validatedAt = now();
        session.expiresAt = Math.min(session.expiresAt, now() + data.expires_in * 1000);
      } catch { sessions.delete(id); }
    }));
  }
  let sweeping = false;
  const timer = setInterval(async () => {
    if (sweeping) return;
    sweeping = true;
    try { await sweep(); } finally { sweeping = false; }
  }, MINUTE);
  timer.unref();
  app.addHook('onClose', async () => { clearInterval(timer); sessions.clear(); states.clear(); });
  app.addHook('onSend', async (req, reply, payload) => {
    if (req.url.startsWith('/auth/') || req.url.startsWith('/api/session')) reply.header('Cache-Control', 'no-store');
    return payload;
  });

  app.get('/api/config', async () => ({ mockMode: config.mockMode, oauthConfigured: configured, room: config.mockMode ? 'demo' : 'twitch', admission: config.admission ?? 'signed-in' }));
  app.get('/api/session', async req => ({ mockMode: config.mockMode, user: sessionForCookie(req.headers.cookie)?.user ?? null }));
  app.get('/auth/twitch', async (_req, reply) => {
    if (!configured) return reply.code(503).send({ error: 'Twitch sign-in is not configured yet.' });
    if (states.size >= 1000) return reply.code(429).send({ error: 'Too many sign-in attempts. Try again shortly.' });
    const state = randomBytes(32).toString('hex');
    states.set(state, now() + 10 * MINUTE);
    const query = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri, response_type: 'code', state });
    if (requiredScope) query.set('scope', requiredScope);
    return reply.header('Set-Cookie', cookie(STATE_COOKIE, state, 600)).redirect(`https://id.twitch.tv/oauth2/authorize?${query}`);
  });
  app.get<{ Querystring: { state?: string; code?: string; error?: string } }>('/auth/twitch/callback', async (req, reply) => {
    reply.header('Set-Cookie', cookie(STATE_COOKIE, '', 0));
    const { state, code, error } = req.query;
    const expiry = typeof state === 'string' ? states.get(state) : undefined;
    if (!configured || !state || !expiry || expiry <= now() || cookieValue(req.headers.cookie, STATE_COOKIE) !== state) return reply.redirect(returnToRoom('invalid_state'));
    states.delete(state); // Consume before awaiting any upstream request; callbacks cannot replay.
    if (error || typeof code !== 'string' || !code) return reply.redirect(returnToRoom('denied'));
    try {
      const response = await twitch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code, grant_type: 'authorization_code', redirect_uri: config.redirectUri }),
      });
      if (!response.ok) throw new Error('Token exchange failed');
      const tokens = await response.json() as { access_token: string };
      if (!tokens.access_token) throw new Error('Missing token');
      const validation = await validate(tokens.access_token);
      const profileResponse = await twitch('https://api.twitch.tv/helix/users', { headers: helixHeaders(tokens.access_token) });
      if (!profileResponse.ok) throw new Error('Profile lookup failed');
      const profile = (await profileResponse.json() as { data: { id: string; display_name: string }[] }).data?.[0];
      if (!profile || profile.id !== validation.user_id || !profile.display_name) throw new Error('Profile mismatch');
      const role = await entitlement(tokens.access_token, profile.id);
      const seconds = Math.min(3600, validation.expires_in);
      const sessionId = randomBytes(32).toString('hex');
      const oldId = cookieValue(req.headers.cookie, SESSION_COOKIE);
      if (oldId) sessions.delete(oldId);
      sessions.set(sessionId, { token: tokens.access_token, user: { id: profile.id, displayName: profile.display_name, role }, expiresAt: now() + seconds * 1000, validatedAt: now() });
      reply.header('Set-Cookie', [cookie(STATE_COOKIE, '', 0), cookie(SESSION_COOKIE, sessionId, seconds)]);
      return reply.redirect(returnToRoom('connected'));
    } catch {
      // Never log provider response bodies, authorization codes or tokens.
      app.log.warn('Twitch sign-in could not be completed');
      return reply.redirect(returnToRoom('unavailable'));
    }
  });
  app.post('/auth/logout', async (req, reply) => {
    if (req.headers.origin !== config.webOrigin) return reply.code(403).send({ error: 'Unexpected request origin' });
    const id = cookieValue(req.headers.cookie, SESSION_COOKIE);
    if (id) sessions.delete(id);
    return reply.header('Set-Cookie', cookie(SESSION_COOKIE, '', 0)).send({ ok: true });
  });
  return { sessionForCookie, sweep };
}
