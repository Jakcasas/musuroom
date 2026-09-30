import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { projectRoot } from '../backend/config.mjs';
export function loadProjectEnv(){
 const local=resolve(projectRoot,'.env');if(existsSync(local))loadEnvFile(local);
 if(process.env.MUSUROOM_ENV_FILE){
  const {parseEnv}=process.getBuiltinModule('node:util');
  const {readFileSync}=process.getBuiltinModule('node:fs');
  Object.assign(process.env,parseEnv(readFileSync(resolve(projectRoot,process.env.MUSUROOM_ENV_FILE),'utf8')));
 }
}
