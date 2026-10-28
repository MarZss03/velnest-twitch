import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { createRoomServer } from './roomServer.js';

const envFile = fileURLToPath(new URL('../../../.env', import.meta.url));
if (existsSync(envFile)) loadEnvFile(envFile);
const serveWeb=process.argv.includes('--serve-web') || process.env.NODE_ENV==='production';
if(serveWeb && !process.env.WEB_ORIGIN) process.env.WEB_ORIGIN=`http://localhost:${process.env.PORT??3001}`;
const frontendRoot=serveWeb?fileURLToPath(new URL('../../web/dist/',import.meta.url)):undefined;
const { app } = await createRoomServer(undefined,{frontendRoot});
await app.listen({ port: Number(process.env.PORT ?? 3001), host: process.env.BIND_ADDRESS ?? '0.0.0.0' });
