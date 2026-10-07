import { operation } from '../db/operation.mjs';
import { openMongoStore } from './mongo-store.mjs';
import { createKnowledgeClassifier } from './knowledge-decisions.mjs';
import { syncData,startDataSync } from './data-sync.mjs';
import {createAtlasLabeling} from './atlas-labeling.mjs';
import {createKnowledgeBatch} from './knowledge-batch.mjs';

// Projection and explicit classification jobs persist in the primary database.
export function startDataWorker(db,config,fetchImpl) {
 if(!config.mongoEnabled)return async()=>{};
 let store;
 const classify=config.mongoEnrichment?createKnowledgeClassifier(config,fetchImpl):undefined;
 const labeler=db.dialect==='mongodb'?createAtlasLabeling(db,config,{classify:createKnowledgeBatch(config,fetchImpl)}):null;
 const stop=startDataSync(async()=>{
  try{
   store??=await openMongoStore(config);
   const result=await syncData({db,config,store,classify});
   if(result.mode==='unavailable'){await store.close().catch(()=>{});store=null;}
  }catch(error){
   if(store){await store.close().catch(()=>{});store=null;}
   const code=['atlas_authentication_failed','atlas_permission_denied','atlas_network_unavailable','atlas_tls_failed'].includes(error.code)?error.code:'connection_unavailable';
   await operation(db,'sync.failure',()=>db.prepare("UPDATE data_sync_state SET last_error_code=? WHERE id='mongo'")).run(code);
  }
 },config.mongoSyncMs);
 const stopLabels=labeler?startDataSync(()=>labeler.runOnce(),10000):async()=>{};
 return async()=>{await Promise.all([stop(),stopLabels()]);await store?.close();};
}
