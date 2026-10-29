import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const video=resolve(here,'renders/velnest-room.mp4');
function run(tool,args){
 const result=spawnSync(tool,args,{encoding:'utf8'});
 if(result.error || result.status!==0)throw new Error(`${tool}: ${result.error?.message||result.stderr}`);
 return result.stdout;
}
const info=JSON.parse(run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',video]));
const stream=info.streams.find(s=>s.codec_type==='video');
assert.equal(stream.width,1920);assert.equal(stream.height,1080);
assert.equal(stream.r_frame_rate,'30/1');assert.equal(Number(stream.nb_frames),360);
assert.equal(Number(info.format.duration),12);assert.equal(stream.codec_name,'h264');
assert.equal(info.streams.filter(s=>s.codec_type==='audio').length,0);
run('ffmpeg',['-v','error','-i',video,'-f','null','-']);
const samples=run('ffmpeg',['-v','error','-i',video,'-vf','fps=1','-f','framemd5','-']).split('\n').filter(s=>s&&!s.startsWith('#')).map(s=>s.split(',').at(-1).trim());
assert.equal(samples.length,12);assert.equal(new Set(samples).size,12);
const bytes=await readFile(video);
assert.ok(bytes.length>1_000_000,'Unexpectedly tiny render: inspect for missing WebGL content');
run('ffmpeg',['-v','error','-y','-i',video,'-vf','fps=1,scale=480:270,tile=4x3','-frames:v','1',resolve(here,'renders/contact-sheet.jpg')]);
const report={passed:true,width:1920,height:1080,fps:30,frames:360,duration:12,codec:stream.codec_name,pixelFormat:stream.pix_fmt,audioStreams:0,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),decodedSamples:samples.length,uniqueSampleFrames:new Set(samples).size,scene:'neon-night-lounge',capture:'single-worker low-memory screenshot',visualInspection:'Review renders/contact-sheet.jpg separately; metadata does not prove image correctness.'};
await writeFile(resolve(here,'render-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
