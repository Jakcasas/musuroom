import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { projectRoot } from '../backend/config.mjs';
import { cloudTarget } from './cloud-config.mjs';
export const targetFlags=['--project',cloudTarget.project,'--environment',cloudTarget.environment,'--service',cloudTarget.service];
export function railway(args,input) {
 return new Promise((resolveTask,reject)=>{
  const child=spawn(process.execPath,[resolve(projectRoot,'node_modules/@railway/cli/bin/railway.js'),...args],{cwd:projectRoot,windowsHide:true,stdio:['pipe','pipe','pipe']});
  // CLI errors may include credentials; retain no output unless explicitly read as JSON.
  let output='',bytes=0;child.stdout.on('data',data=>{bytes+=data.length;if(bytes<2000000)output+=data;});child.stderr.resume();
  child.on('error',()=>reject(new Error('Cannot start authenticated Railway CLI.')));
  child.on('exit',code=>code===0?resolveTask(output):reject(new Error('Railway operation failed. Check CLI login and service permissions.')));
  child.stdin.on('error',()=>{});child.stdin.end(input??'');
 });
}
