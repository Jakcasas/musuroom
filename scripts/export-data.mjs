import { mkdir,open } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadProjectEnv } from './env.mjs';
import { loadConfig,projectRoot } from '../backend/config.mjs';
import { openConfiguredDatabase } from '../backend/db/configured.mjs';
import { dataJobs,projectDocument } from '../backend/services/data-projections.mjs';
loadProjectEnv();const config=loadConfig(),db=await openConfiguredDatabase(config);
let file,finished=false,count=0;
const name='musuroom-'+new Date().toISOString().replaceAll(/[:.]/g,'-')+'.ndjson';
try{
 await mkdir(resolve(projectRoot,'data/exports'),{recursive:true});file=await open(resolve(projectRoot,'data/exports',name),'wx',0o600);
 let after='';
 for(;;){const jobs=await dataJobs(db,{after,limit:100});if(!jobs.length)break;for(const job of jobs){await file.writeFile(JSON.stringify(await projectDocument(db,job,config.mongoSource))+'\n');count++;}after=jobs.at(-1).job_key;}
 finished=true;
}finally{await file?.close();await db.close();}
if(finished)console.log(JSON.stringify({documents:count,file:'data/exports/'+name,format:'ndjson',consistency:'per document; updates during export can be included'}));
