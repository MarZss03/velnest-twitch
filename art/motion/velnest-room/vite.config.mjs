import {fileURLToPath} from 'node:url';
export default {publicDir:false,build:{emptyOutDir:false,outDir:fileURLToPath(new URL('./assets/vendor',import.meta.url)),lib:{entry:fileURLToPath(new URL('./scene.mjs',import.meta.url)),name:'VelnestFilm',formats:['iife'],fileName:()=> 'scene.js'},target:'es2022',minify:true}};
