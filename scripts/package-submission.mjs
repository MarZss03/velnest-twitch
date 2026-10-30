import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const revision=git(['rev-parse','HEAD']);
const tracked=git(['ls-files']).split('\n');
if(tracked.some(file=>/(^|\/)\.env($|\.)/.test(file)&&!file.endsWith('.env.example')))throw new Error('Private environment file is tracked; refusing source archive.');
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const out=resolve(root,'downloads/submission',`VELNEST-${date}`);
await mkdir(out,{recursive:true});
const files=[
 ['art/blender/afterparty-preview.png','01-room-render.png'],
 ['docs/previews/night-lounge-web.png','02-working-interface.png'],
 ['docs/previews/night-lounge-three.png','03-simulated-character-art-review.png'],
 ['docs/previews/night-lounge-mobile.png','04-mobile-layout.png'],
 ['docs/previews/night-lounge-obs.png','05-local-obs-proof.png'],
 ['art/motion/velnest-room/renders/velnest-room.mp4','06-staged-motion-study.mp4'],
 ['docs/SUBMISSION.md','project-story.md'],
 ['docs/DEMO-RUNBOOK.md','recording-runbook.md'],
 ['docs/QA-2026-10-29.md','qa-report.md'],
 ['docs/DEMO-DELIVERY.md','demo-evidence.md'],
 ['downloads/final-demo/VELNEST-demo-submission-179s-720p.mp4','07-final-demonstration.mp4'],
 ['docs/FINAL-SUBMISSION.md','final-submission.md'],
 ['docs/RULES-AUDIT-2026-10-30.md','rules-audit.md'],
 ['docs/VIDEO-CREDITS.md','video-credits.md'],
 ['art/vendor/polyhaven/LICENSE.md','furniture-credits.md'],
];
for(const [source,name] of files)await cp(resolve(root,source),resolve(out,name));
git(['archive','--format=zip',`--output=${resolve(out,'velnest-source.zip')}`,revision]);
const hashes=[];
for(const name of [...files.map(([,name])=>name),'velnest-source.zip']){
 const bytes=await readFile(resolve(out,name));
 hashes.push({file:name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile(resolve(out,'manifest.json'),JSON.stringify({revision,created:date,files:hashes},null,2)+'\n');
await writeFile(resolve(out,'START-HERE.md'),`# VELNEST review package\n\nSource revision: ${revision}\nRepository: https://github.com/MarZss03/velnest-twitch\n\n01 is an offline Blender room render. 02 and 04 show the running website.\n03 explicitly shows simulated characters for art review. 05 shows the local OBS Browser Source.\n06 is a staged, silent 12-second motion study, not Twitch broadcast footage.\n07 is the verified 179-second local submission copy, including actual broadcast evidence.\n\nThe English project story, recording runbook, demo evidence and QA report are included.\nThe source ZIP contains only committed files; credentials and raw private recordings are excluded.\nFile hashes are in manifest.json.\n\nThe authorized public Twitch demonstration is complete. Devpost cover and gallery\nfiles and project details are saved. The public video URL is in final-submission.md.\nFinal duration correction and Devpost agreement/submission status are recorded there.\n`);
console.log(`Review package saved: ${out}\nSource: ${revision}\n${hashes.length} checksummed files; no upload performed.`);
