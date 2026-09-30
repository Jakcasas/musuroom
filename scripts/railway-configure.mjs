import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { spawn } from 'node:child_process';
import { loadConfig } from '../backend/config.mjs';
import { publicLinks } from './generate-qr.mjs';
const values=parseEnv(readFileSync(resolve(import.meta.dirname,'../data/cloud.env'),'utf8'));const base=process.argv[2];publicLinks(base);
if(values.DATABASE_URL?.includes('[YOUR-PASSWORD]'))throw new Error('Fill the actual database connection in private data/cloud.env first.');
const env={...values,NODE_ENV:'production',HOST:'0.0.0.0',PORT:'8080',PUBLIC_ORIGIN:new URL(base).origin,API_WRITE_TOKEN:'',AI_PROVIDER:values.AI_PROVIDER||'disabled',JEV_ENABLED:values.JEV_ENABLED||'false'};loadConfig(env);
const allowed=['NODE_ENV','HOST','PORT','PUBLIC_ORIGIN','DATABASE_PROVIDER','DATABASE_URL','DATABASE_CA_CERT','STORAGE_PROVIDER','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_STORAGE_BUCKET','API_WRITE_TOKEN','AI_PROVIDER','OPENROUTER_API_KEY','AI_MODEL','JEV_ENABLED','TYPESAFE_API_KEY','JEV_MODEL'];
const cli=resolve(import.meta.dirname,'../node_modules/@railway/cli/bin/railway.exe');
for(const key of allowed){if(env[key]===undefined)continue;await new Promise((resolve,reject)=>{const child=spawn(cli,['variable','set',key,'--stdin','--skip-deploys','--service','musuroom-web'],{windowsHide:true,stdio:['pipe','ignore','ignore']});child.on('error',()=>reject(new Error('Cannot start Railway CLI.')));child.on('exit',code=>code===0?resolve():reject(new Error('Railway variable update failed: '+key)));child.stdin.end(env[key]);});console.log('Configured:',key);}
console.log('Cloud environment configured; secret values were not printed.');
