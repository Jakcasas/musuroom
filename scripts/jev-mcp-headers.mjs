import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { projectRoot } from '../backend/config.mjs';

// stdout is the credential channel consumed by Codex, never an application log.
export function jevMcpHeaders(path=resolve(projectRoot,'.env')) {
 const env=parseEnv(readFileSync(path,'utf8'));
 const key=env.JEV_API_KEY||env.TYPESAFE_API_KEY||'';
 if(!key||key.length>512||/\s/.test(key)||/^(?:YOUR_|DIEN_|<|\[)/.test(key))throw new Error('Invalid private Jev key');
 return {Authorization:`Bearer ${key}`};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{process.stdout.write(JSON.stringify(jevMcpHeaders()));}
 catch{console.error('Không đọc được key Jev riêng tư trong .env.');process.exitCode=1;}
}
