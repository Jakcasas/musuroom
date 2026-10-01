import { openMongoStore } from './mongo-store.mjs';
import { createKnowledgeClassifier } from './knowledge-decisions.mjs';
import { syncData,startDataSync } from './data-sync.mjs';

// A failed mirror does not interrupt survey intake. Pending SQL jobs survive restarts.
export function startDataWorker(db,config,fetchImpl) {
 if(!config.mongoEnabled)return async()=>{};
 let store;
 const classify=config.mongoEnrichment?createKnowledgeClassifier(config,fetchImpl):undefined;
 const stop=startDataSync(async()=>{
  try{
   store??=await openMongoStore(config);
   const result=await syncData({db,config,store,classify});
   if(result.mode==='unavailable'){await store.close().catch(()=>{});store=null;}
  }catch{
   if(store){await store.close().catch(()=>{});store=null;}
   await db.prepare("UPDATE data_sync_state SET last_error_code='connection_unavailable' WHERE id='mongo'").run();
  }
 },config.mongoSyncMs);
 return async()=>{await stop();await store?.close();};
}
