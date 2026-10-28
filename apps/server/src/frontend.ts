import {existsSync} from 'node:fs';
import {join} from 'node:path';
import type {FastifyInstance} from 'fastify';
import fastifyStatic from '@fastify/static';

/** Only the compiled public frontend is exposed, never the repository root. */
export async function registerFrontend(app:FastifyInstance,root:string){
  if(!existsSync(join(root,'index.html'))) throw new Error('Compiled frontend is missing. Run pnpm build before pnpm start.');
  await app.register(fastifyStatic,{
    root,
    dotfiles:'deny',
    cacheControl:false,
    setHeaders(reply,path){
      reply.header('Cache-Control',/[\\/]assets[\\/]/.test(path)?'public, max-age=31536000, immutable':'no-cache');
      reply.header('X-Content-Type-Options','nosniff');
    }
  });
}
