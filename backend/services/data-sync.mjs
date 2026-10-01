import { randomUUID } from 'node:crypto';
import { dataJobs,projectDocument } from './data-projections.mjs';
const leaseMs=300000;
export async function syncData({db,config,store,classify,localOnly=false,now=Date.now}) {
 const owner=randomUUID(),start=now();
 const claim=await db.prepare("UPDATE data_sync_state SET lock_owner=?,lease_until=? WHERE id='mongo' AND lease_until<=?").run(owner,start+leaseMs,start);
 if(!claim.changes)return{mode:'busy',synced:0};
 let synced=0,requests=0,errorCode=null,failedBatch=[];
 const renew=async()=>{const result=await db.prepare("UPDATE data_sync_state SET lease_until=? WHERE id='mongo' AND lock_owner=? AND lease_until>?").run(now()+leaseMs,owner,now());if(!result.changes)throw new Error('lease_lost');};
 try{
  const jobs=await dataJobs(db,{limit:config.mongoBatchSize,pending:true});
  for(let offset=0;offset<jobs.length;offset+=10){
   const batch=jobs.slice(offset,offset+10),documents=[];failedBatch=batch;
   for(const job of batch){
    await renew();const document=await projectDocument(db,job,config.mongoSource);
    if(classify&&config.mongoEnrichment&&document.active&&document.type==='knowledge'&&requests<config.mongoJevMax){document.jev=await classify(document);requests++;}
    documents.push(document);
   }
   await renew();await store.write(documents);await renew();
   for(const job of batch){await db.prepare('UPDATE data_sync_jobs SET synced_revision=?,attempts=0,last_error_code=NULL WHERE job_key=? AND synced_revision<?').run(job.revision,job.job_key,job.revision);synced++;}
   failedBatch=[];
  }
  return{mode:'synced',synced,jev_requests:localOnly?0:requests,...(localOnly?{local_classifications:requests}:{})};
 }catch(error){errorCode=error.message==='lease_lost'?'lease_lost':'sync_failed';for(const job of failedBatch)await db.prepare('UPDATE data_sync_jobs SET attempts=attempts+1,last_error_code=? WHERE job_key=? AND synced_revision<revision').run(errorCode,job.job_key);return{mode:'unavailable',reason:errorCode,synced};}
 finally{await db.prepare("UPDATE data_sync_state SET lock_owner='',lease_until=0,last_completed_at=?,last_error_code=?,last_synced_count=? WHERE id='mongo' AND lock_owner=?").run(new Date(now()).toISOString(),errorCode,synced,owner);}
}
export function startDataSync(run,intervalMs) {
 let stopped=false,active=null,timer;
 const tick=()=>{active=Promise.resolve().then(run).catch(()=>{}).finally(()=>{active=null;if(!stopped){timer=setTimeout(tick,intervalMs);timer.unref();}});};
 tick();return async()=>{stopped=true;clearTimeout(timer);await active;};
}
