import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadConfig,projectRoot} from '../backend/config.mjs';
import {loadProjectEnv} from './env.mjs';
import {readCloudEnvironment} from './cloud-config.mjs';
import {openConfiguredDatabase} from '../backend/db/configured.mjs';
import {rotateJudgeAccessCode} from '../backend/security/auth.mjs';
const cloud=process.argv.includes('--cloud');
const credentialPath=resolve(projectRoot,cloud?'data/cloud-judge-access.json':'data/judge-access.json');
const environmentPath=resolve(projectRoot,cloud?'data/cloud.env':'.env');
let db;
try {
 let input='',bytes=0;for await(const chunk of process.stdin){bytes+=chunk.length;if(bytes>512)throw new Error('input_too_large');input+=chunk.toString();}
 const code=input.replace(/\r?\n$/,'');
 const previous=JSON.parse(readFileSync(credentialPath,'utf8'));if(previous.role!=='JUDGE')throw new Error('judge_account_required');
 const environment=readFileSync(environmentPath,'utf8');
 loadProjectEnv();const config=cloud?readCloudEnvironment().config:loadConfig();db=await openConfiguredDatabase(config);
 const account=await rotateJudgeAccessCode(db,previous.account_id,code);
 const setting='JUDGE_DEFAULT_ACCOUNT_ID='+account.account_id;
 const updated=/^JUDGE_DEFAULT_ACCOUNT_ID=.*$/m.test(environment)?environment.replace(/^JUDGE_DEFAULT_ACCOUNT_ID=.*$/m,setting):environment.trimEnd()+'\n'+setting+'\n';
 writeFileSync(environmentPath,updated,{mode:0o600});writeFileSync(credentialPath,JSON.stringify(account,null,2),{mode:0o600});
 console.log(JSON.stringify({changed:true,environment:cloud?'cloud':'local',role:'JUDGE',expires_at:account.expires_at,restart_required:true}));
}catch{console.error('Judge code update incomplete. Check the active account, private files and database; no code was printed.');process.exitCode=1;}
finally{await db?.close();}
