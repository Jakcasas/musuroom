import { loadProjectEnv } from './env.mjs';
import { loadConfig } from '../backend/config.mjs';
import { openConfiguredDatabase } from '../backend/db/configured.mjs';
import { openMongoStore } from '../backend/services/mongo-store.mjs';
import { syncData } from '../backend/services/data-sync.mjs';
import { createKnowledgeClassifier } from '../backend/services/knowledge-decisions.mjs';
loadProjectEnv();let db,store;
try{
 const config=loadConfig();if(!config.mongoEnabled)throw new Error('disabled');
 db=await openConfiguredDatabase(config);store=await openMongoStore(config);
 if(process.argv.includes('--rebuild'))await db.prepare('UPDATE data_sync_jobs SET revision=revision+1,attempts=0,last_error_code=NULL').run();
 const result=await syncData({db,config,store,classify:config.mongoEnrichment?createKnowledgeClassifier(config):undefined});
 console.log(JSON.stringify(result));if(result.mode==='unavailable')process.exitCode=1;
}catch{console.error('Data sync unavailable. Check private database and Atlas configuration; values were not printed.');process.exitCode=1;}
finally{await store?.close();await db?.close();}
