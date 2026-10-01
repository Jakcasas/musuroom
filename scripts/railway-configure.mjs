import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readCloudEnvironment,cloudKeys } from './cloud-config.mjs';
import { checkCloud } from './cloud-preflight.mjs';
import { railway,targetFlags } from './railway-client.mjs';
export async function configureRailway(env) {
 for(const key of cloudKeys){const value=env[key];await railway(['variable','set',value?key:key+'=',...(value?['--stdin']:[]),'--skip-deploys',...targetFlags],value||undefined);console.log('Configured:',key);}
 console.log('Railway variables configured; private values were not printed.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const{env,config}=readCloudEnvironment(process.argv.slice(2).find(x=>!x.startsWith('--')),{withoutAtlas:process.argv.includes('--without-atlas')});const result=await checkCloud(config);console.log(JSON.stringify(result));if(!result.ready)throw new Error('not_ready');await configureRailway(env);}
 catch{console.error('Railway configuration stopped. Run pnpm cloud:check and check CLI login; private values were not printed.');process.exitCode=1;}
}
