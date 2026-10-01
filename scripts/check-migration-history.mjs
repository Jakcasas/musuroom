import { readFileSync,readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readCloudEnvironment } from './cloud-config.mjs';
import { openPostgresSession } from '../backend/db/postgres.mjs';
import { projectRoot } from '../backend/config.mjs';
const hash=text=>createHash('sha256').update(text.replace(/\r\n/g,'\n').trim()).digest('hex');
let db;
try{
 const {config}=readCloudEnvironment();db=await openPostgresSession(config);await db.exec('BEGIN READ ONLY');
 const remote=await db.prepare('SELECT version,name,statements FROM supabase_migrations.schema_migrations ORDER BY version').all();
 const directory=resolve(projectRoot,'supabase/migrations'),files=readdirSync(directory).filter(file=>file.endsWith('.sql'));
 const local=files.map(file=>{const match=file.match(/^(\d{14})_(\w+)\.sql$/);if(!match)throw new Error('invalid_filename');return{version:match[1],name:match[2],hash:hash(readFileSync(resolve(directory,file),'utf8'))};});
 const missing=remote.filter(row=>!local.some(file=>file.version===row.version)).map(row=>row.version);
 const pending=local.filter(file=>!remote.some(row=>row.version===file.version)).map(file=>file.version);
 const different=remote.filter(row=>{const file=local.find(file=>file.version===row.version);return file&&(file.name!==row.name||file.hash!==hash((row.statements||[]).join('\n')));}).map(row=>row.version);
 const ready=!missing.length&&!pending.length&&!different.length;
 console.log(JSON.stringify({ready,local:local.length,remote:remote.length,missing,pending,different}));if(!ready)process.exitCode=1;
}catch{console.error('Migration history check failed. Check private cloud configuration; values and SQL were not printed.');process.exitCode=1;}
finally{await db?.close();}
