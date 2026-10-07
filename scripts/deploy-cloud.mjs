import { setTimeout } from 'node:timers/promises';
import { resolve } from 'node:path';
import { readCloudEnvironment } from './cloud-config.mjs';
import { configureRailway } from './railway-configure.mjs';
import { checkCloud } from './cloud-preflight.mjs';
import { railway,targetFlags } from './railway-client.mjs';
import { generateQr,verifyPublicApplication,publicLinks } from './generate-qr.mjs';
import { projectRoot } from '../backend/config.mjs';
import { releaseInfo } from '../backend/version.mjs';
import { deploymentId,deploymentReady } from './deployment-status.mjs';
try{
 const{env,config}=readCloudEnvironment(process.argv.slice(2).find(x=>!x.startsWith('--')),{withoutAtlas:process.argv.includes('--without-atlas')});
 const check=await checkCloud(config);console.log(JSON.stringify(check));
 if(!check.ready)throw new Error('Cloud preflight failed; deployment stopped before uploading.');
 await generateQr(config.publicOrigin,resolve(projectRoot,'dist/qr'),{verify:false});
 await configureRailway(env);
 console.log('Uploading release to the configured Railway production service.');
 const id=deploymentId(await railway(['up',...targetFlags,'--detach']));
 console.log('Checking new deployment:',id);
 const started=Date.now();let ready=false;
 while(Date.now()-started<600000){
  const successful=deploymentReady(JSON.parse(await railway(['deployment','list',...targetFlags,'--limit','20','--json'])),id);
  if(successful){try{const response=await fetch(config.publicOrigin+'/healthz',{redirect:'error',signal:AbortSignal.timeout(10000)});const data=await response.json();ready=response.ok&&data.app===releaseInfo.app&&data.version===releaseInfo.version&&data.database==='ok';}catch{}}
  if(ready)break;
  console.log('Waiting for the current release and database health check…');await setTimeout(15000);
 }
 if(!ready)throw new Error('Release health check timed out. Inspect Railway build/deploy logs; QR files were not generated.');
 await verifyPublicApplication(config.publicOrigin);
 const manifestResponse=await fetch(config.publicOrigin+'/qr/manifest.json',{redirect:'error',signal:AbortSignal.timeout(10000)});
 const manifest=await manifestResponse.json();
 if(!manifestResponse.ok||manifest.version!==releaseInfo.version||JSON.stringify(manifest.links)!==JSON.stringify(publicLinks(config.publicOrigin)))throw new Error('Release QR manifest mismatch');
 console.log('Deployment and public QR verified:',releaseInfo.version);
}catch(error){console.error(error.message?.startsWith('Cloud preflight')||error.message?.startsWith('Release health')?error.message:'Cloud deployment failed. Check configuration and Railway dashboard; private values were not printed.');process.exitCode=1;}
