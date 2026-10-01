import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
const migrationFiles=readdirSync(resolve(root,'supabase/migrations')).filter(name=>name.endsWith('.sql'));
const versions=new Set();for(const file of migrationFiles){const match=file.match(/^(\d{14})_\w+\.sql$/);if(!match||versions.has(match[1]))throw new Error('Invalid or duplicate Supabase migration version: '+file);versions.add(match[1]);}
const walk = directory => readdirSync(directory, { withFileTypes:true }).flatMap(entry => entry.isDirectory() ? walk(resolve(directory,entry.name)) : [resolve(directory,entry.name)]);
const files = ['backend','dist','scripts','tests'].flatMap(name => walk(resolve(root,name)));
const code = [...files.filter(file => /\.(?:mjs|js)$/.test(file)), resolve(root,'server.mjs')];
for (const file of code) execFileSync(process.execPath, ['--check',file], { stdio:'pipe',windowsHide:true });
let links = 0;
const dist = resolve(root,'dist');
for (const file of files.filter(file => file.endsWith('.html'))) {
  for (const [, value] of readFileSync(file,'utf8').matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(?:https?:|data:|mailto:|tel:|#)/.test(value)) continue;
    const url = new URL(value, 'http://musuroom.local/' + relative(dist,file).replaceAll(sep,'/'));
    if (url.pathname.startsWith('/api/')) continue;
    const target = resolve(dist, '.' + decodeURIComponent(url.pathname));
    if (!target.startsWith(dist + sep) || !existsSync(target)) throw new Error('Missing local link: ' + relative(root,file) + ' -> ' + value);
    links++;
  }
}
console.log(JSON.stringify({ syntaxFiles:code.length,localLinks:links,status:'ok' }));
