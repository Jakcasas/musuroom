import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {resolve} from 'node:path';
import {loadConfig,projectRoot} from '../backend/config.mjs';
import {readCloudEnvironment} from './cloud-config.mjs';
import {diagnoseJev} from '../backend/services/jev-diagnostics.mjs';
export {diagnoseJev};
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.dirname,'diagnose-jev.mjs')){
 try{
  const config=process.argv.includes('--cloud')?readCloudEnvironment().config:loadConfig(parseEnv(readFileSync(resolve(projectRoot,'.env'),'utf8')));
  const report=await diagnoseJev(config,fetch,{defaultModel:process.argv.includes('--default-model')});
  console.log(JSON.stringify(report,null,2));if(!report.inference_verified)process.exitCode=1;
 }catch{console.error('Không đọc được cấu hình Jev riêng tư; không in secret.');process.exitCode=1;}
}
