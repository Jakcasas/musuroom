import { existsSync, readFileSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { loadEnvFile } from 'node:process';
import { randomUUID, createHash } from 'node:crypto';
import { loadConfig, projectRoot } from '../backend/config.mjs';
import { openDatabase } from '../backend/db/database.mjs';
if (existsSync(resolve(projectRoot,'.env'))) loadEnvFile(resolve(projectRoot,'.env'));
const args=process.argv.slice(2); const option=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const source=option('--file'); const title=option('--title'); const type=option('--type','REPORT'); const status=option('--status','DRAFT');
const types={'.txt':'text/plain; charset=utf-8','.pdf':'application/pdf','.csv':'text/csv; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
if (!source || !title || title.length<2 || title.length>200 || !['BRIEF','SOP','COGS','COA','MEDIA','REPORT'].includes(type) || !['DRAFT','FINAL'].includes(status)) throw new Error('Use --file PATH --title TITLE --type BRIEF|SOP|COGS|COA|MEDIA|REPORT [--status DRAFT|FINAL]');
const sourcePath=resolve(projectRoot,source); const extension=extname(sourcePath).toLowerCase();
if (!types[extension] || !statSync(sourcePath).isFile() || statSync(sourcePath).size>50*1024*1024) throw new Error('Unsupported file type or size (max 50 MB).');
const bytes=readFileSync(sourcePath); if (!bytes.length) throw new Error('Empty document');
const hash=createHash('sha256').update(bytes).digest('hex'); const config=loadConfig(); const db=openDatabase(config.databasePath);
try {
  const previous=db.prepare('SELECT id FROM quality_documents WHERE sha256=?').get(hash);
  if (previous) console.log('Document already registered:',previous.id);
  else {
    const id=randomUUID(); const name=id+extension; mkdirSync(config.documentRoot,{recursive:true});
    writeFileSync(resolve(config.documentRoot,name),bytes,{flag:'wx',mode:0o600});
    db.prepare('INSERT INTO quality_documents(id,title,doc_type,file_name,mime,size_bytes,sha256,evidence_status) VALUES(?,?,?,?,?,?,?,?)').run(id,title,type,name,types[extension],bytes.length,hash,status);
    console.log('Private document registered:',id);
  }
} finally {db.close();}
