import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {projectRoot} from '../backend/config.mjs';
let uri=process.env.MONGODB_TEST_URI;
if(!uri){try{uri=parseEnv(readFileSync(resolve(projectRoot,'data/cloud.env'),'utf8')).MONGODB_URI;}catch{}}
if(!uri)throw new Error('Set private MONGODB_TEST_URI or configure data/cloud.env before Atlas integration tests.');
const result=spawnSync(process.execPath,['--test','tests/mongodb.test.mjs'],{cwd:projectRoot,env:{...process.env,MONGODB_URI:uri,RUN_ATLAS_TESTS:'true'},stdio:'inherit',windowsHide:true});
process.exitCode=result.status??1;
