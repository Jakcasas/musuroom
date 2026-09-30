import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'../docs/typesafe-ai/2026-09-30');
const normalize=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const query=process.argv.slice(2).join(' ').trim();
if(!query){console.log('Usage: pnpm docs:search confidence choice rate limits');process.exit(1);}
const terms=normalize(query).split(/\s+/);const manifest=JSON.parse(readFileSync(resolve(root,'manifest.json'),'utf8'));
const matches=manifest.pages.map(page=>{
 const text=readFileSync(resolve(root,page.path),'utf8');const normalized=normalize(text);
 if(!terms.every(term=>normalized.includes(term)))return null;
 const score=terms.reduce((n,term)=>n+(normalize(page.title).includes(term)?10:0)+Math.min(5,normalized.split(term).length-1),0);
 const lines=text.split('\n').filter(line=>terms.some(term=>normalize(line).includes(term))).slice(0,3).map(line=>line.slice(0,240));
 return{page,score,lines};
}).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,10);
for(const{page,lines}of matches)console.log(`\n${page.title}\n${page.url}\n${resolve(root,page.path)}\n${lines.join('\n')}`);
if(!matches.length)console.log('No matching page. Try one or two English technical terms.');
