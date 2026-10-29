import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(root,'apps/server/package.json'));
const checks=[
 ['authentication',['--test','apps/web/scripts/verify-auth.mjs']],
 ['pathfinding',['--test','packages/shared/tests/room.test.mjs']],
 ['animation clips',['apps/web/scripts/verify-animations.mjs']],
 ['reaction motion',['apps/web/scripts/verify-motion.mjs']],
 ['seat reservations',['--test','apps/web/scripts/verify-seating.mjs']],
 ['room capacity',['--test','apps/web/scripts/verify-capacity.mjs']],
 ['nameplate layout',['--test','apps/web/scripts/verify-labels.mjs']],
 ['cosmetic attachment',[resolve(dirname(require.resolve('tsx/package.json')),'dist/cli.mjs'),'apps/web/scripts/verify-cosmetics.mjs']],
 ['night lounge assets',['--test','apps/web/scripts/verify-night-room.mjs']],
 ['GPU resource cleanup',['--test','apps/web/scripts/verify-disposal.mjs']],
 ['production hosting',['--test','apps/web/scripts/verify-hosting.mjs']],
];
for(const [name,args] of checks){
 console.log(`\nChecking ${name}`);
 const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env:{...process.env,GOMAXPROCS:process.env.GOMAXPROCS||'2'}});
 if(result.error || result.status!==0){
  console.error(`QA stopped: ${name}`,result.error?.message||result.signal||result.status);
  process.exit(result.status||1);
 }
}
console.log(`\nPASS: all ${checks.length} QA suites. Browser, real Twitch accounts and video rendering require separate evidence.`);
