// Assemble the explicitly requested screen-recorded demonstration locally.
// Private source recordings and synthesized narration stay in downloads/.
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'downloads/final-demo');
await mkdir(resolve(out,'fonts'),{recursive:true});
await copyFile('C:/Windows/Fonts/arial.ttf',resolve(out,'fonts/Arial.ttf'));
const live=resolve(root,'downloads/recordings/2026-10-29 19-09-01.mp4');
const scenes=[
 {id:'01-intro',duration:9,video:resolve(root,'art/motion/velnest-room/renders/velnest-room.mp4'),start:0,title:'VELNEST',note:'A shared place in the stream  /  Authored opening'},
 {id:'02-twitch',duration:10,image:'twitch-live-player.png',title:'Running on Twitch',note:'Actual player capture · meemokiller · October 29, 2026'},
 {id:'03-identity',duration:11,image:'twitch-identity.png',title:'Your Twitch identity, in the room',note:'Open to every signed-in Twitch viewer'},
 {id:'04-character',duration:12,video:live,start:105,title:'Choose a character. Bring a prop.',note:'Actual broadcast recording · Arc with a lightstick'},
 {id:'05-reaction',duration:12,video:live,start:18,title:'Wave. Cheer. Dance.',note:'Actual broadcast recording · server-synchronized actions'},
 {id:'06-seat',duration:11,video:live,start:125,title:'Make yourself at home',note:'Actual broadcast recording · approach and sit'},
 {id:'07-codex',duration:12,image:'blender-source.png',title:'Built with OpenAI Codex',note:'React + Three.js · realtime server · Blender scripts and rigged animation'},
 {id:'08-quality',duration:15,image:'qa-success.png',crop:'crop=iw:820:0:0,',title:'Editable sources. Checked behavior.',note:'12 QA suites · Windows and Linux · CC0 furniture credits in the repository'},
 {id:'09-end',duration:11,video:live,start:155,title:'Meet you in the nest.',note:'github.com/MarZss03/velnest-twitch'},
];
function run(args){
 const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{cwd:out,encoding:'utf8',maxBuffer:4e6,windowsHide:true});
 if(result.status!==0)throw new Error(result.stderr||result.error?.message||'FFmpeg failed');
}
let cursor=0; const manifest=[];
for(const scene of scenes){
 await writeFile(resolve(out,scene.id+'-title.txt'),scene.title);
 await writeFile(resolve(out,scene.id+'-note.txt'),scene.note);
 const input=scene.image?['-loop','1','-framerate','30','-i',scene.image]:['-ss',String(scene.start),'-i',scene.video];
 const vf=`${scene.crop||''}scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x080c16,setsar=1,fps=30,drawtext=fontfile=fonts/Arial.ttf:textfile=${scene.id}-title.txt:fontsize=32:fontcolor=white:x=64:y=56:box=1:boxcolor=0x080c16@0.85:boxborderw=12,drawtext=fontfile=fonts/Arial.ttf:textfile=${scene.id}-note.txt:fontsize=21:fontcolor=0xcaf5f4:x=64:y=644:box=1:boxcolor=0x080c16@0.9:boxborderw=12`;
 run([...input,'-i',`audio/${scene.id}.wav`,'-filter_complex',`[0:v]${vf}[v];[1:a]apad,atrim=duration=${scene.duration},loudnorm=I=-16:TP=-1.5:LRA=9[a]`,'-map','[v]','-map','[a]','-t',String(scene.duration),'-c:v','libx264','-threads','2','-preset','fast','-crf','19','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_trc','bt709','-color_primaries','bt709','-c:a','aac','-ar','48000','-ac','2',scene.id+'.mp4']);
 manifest.push({...scene,timelineStart:cursor});cursor+=scene.duration;
 console.log(`Rendered ${scene.id}: ${scene.duration}s`);
}
await writeFile(resolve(out,'concat.txt'),scenes.map(s=>`file '${s.id}.mp4'`).join('\n'));
run(['-f','concat','-safe','0','-i','concat.txt','-c','copy','-movflags','+faststart','VELNEST-demo.mp4']);
await writeFile(resolve(out,'edit-manifest.json'),JSON.stringify({duration:cursor,voice:'Windows Zira, locally synthesized English narration',scenes:manifest},null,2));
console.log(`Finished ${cursor}s demo: ${resolve(out,'VELNEST-demo.mp4')}`);
