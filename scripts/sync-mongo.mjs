import { loadProjectEnv } from './env.mjs';
import { loadConfig } from '../backend/config.mjs';
import { openConfiguredDatabase } from '../backend/db/configured.mjs';
import { openMongoStore } from '../backend/services/mongo-store.mjs';
import { operation } from '../backend/db/operation.mjs';
import { syncData } from '../backend/services/data-sync.mjs';
import { createKnowledgeClassifier } from '../backend/services/knowledge-decisions.mjs';
import { localKnowledgeClassification } from '../backend/services/local-classifier.mjs';
loadProjectEnv();let db,store;
try{
 const localOnly=process.argv.includes('--local-classification'),base=loadConfig(),config=localOnly?{...base,mongoEnrichment:true}:base;if(!config.mongoEnabled)throw new Error('disabled');
 db=await openConfiguredDatabase(config);store=await openMongoStore(config);
 if(process.argv.includes('--rebuild'))await operation(db,'jobs.rebuild',()=>db.prepare('UPDATE data_sync_jobs SET revision=revision+1,attempts=0,last_error_code=NULL')).run();
 const result=await syncData({db,config,store,localOnly,classify:localOnly?document=>localKnowledgeClassification(document,'local_mode_selected'):config.mongoEnrichment?createKnowledgeClassifier(config):undefined});
 console.log(JSON.stringify(result));if(result.mode==='unavailable')process.exitCode=1;
}catch{console.error('Data sync unavailable. Check private database and Atlas configuration; values were not printed.');process.exitCode=1;}
finally{await store?.close();await db?.close();}
