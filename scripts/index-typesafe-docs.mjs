import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve(import.meta.dirname,'../docs/typesafe-ai/2026-09-30');
const full=readFileSync(resolve(root,'llms-full.txt'),'utf8');
const starts=[...full.matchAll(/^# ([^\r\n]+)\r?\nSource: (https:\/\/docs\.typesafe\.ai\/[^\r\n]+)/gm)];
const pages=starts.map((m,i)=>{const content=full.slice(m.index,starts[i+1]?.index??full.length);const path=new URL(m[2]).pathname.slice(1)+'.md';const file=resolve(root,'pages',path);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,content);return{title:m[1],url:m[2],path:'pages/'+path,bytes:Buffer.byteLength(content),sha256:createHash('sha256').update(content).digest('hex')};});
writeFileSync(resolve(root,'manifest.json'),JSON.stringify({retrieved_at:new Date().toISOString(),source:'https://docs.typesafe.ai/llms-full.txt',sha256:createHash('sha256').update(full).digest('hex'),page_count:pages.length,pages},null,2));
// Reading aid retains prose and short code; long code datasets remain in each complete page.
const reading=pages.map(p=>{const content=readFileSync(resolve(root,p.path),'utf8');let fence=0;const prose=[];for(const line of content.split('\n')){const marker=line.trim().match(/^(`{3,})/);if(marker){if(!fence){fence=marker[1].length;prose.push('[Code example: see complete '+p.path+']');}else if(marker[1].length>=fence)fence=0;continue;}if(!fence)prose.push(line.replace(/href="[^"]{200,}"/g,'href="[long playground URL saved in original]"'));}return prose.join('\n');});
for(let i=0;i<reading.length;i+=15)writeFileSync(resolve(root,`reading-${Math.floor(i/15)+1}.md`),reading.slice(i,i+15).join('\n\n'));
console.log(`Indexed ${pages.length} complete pages; reading aids do not replace the archive.`);
