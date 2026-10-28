import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { createRoomServer } from './roomServer.js';

const envFile = fileURLToPath(new URL('../../../.env', import.meta.url));
if (existsSync(envFile)) loadEnvFile(envFile);
const { app } = await createRoomServer();
await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' });
