import {fileURLToPath} from 'node:url';
// The classic-script film supplies decoder URLs explicitly. Three's unused
// default URL constants still need a valid base when bundled outside ESM.
export default {publicDir:false,define:{'import.meta.url':'document.baseURI'},build:{emptyOutDir:false,outDir:fileURLToPath(new URL('./assets/vendor',import.meta.url)),lib:{entry:fileURLToPath(new URL('./scene.mjs',import.meta.url)),name:'VelnestFilm',formats:['iife'],fileName:()=> 'scene.js'},target:'es2022',minify:true}};
