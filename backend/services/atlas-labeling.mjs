import {randomUUID,createHash} from 'node:crypto';
import {createKnowledgeBatch,knowledgeBatchPreview} from './knowledge-batch.mjs';
import {decisionEventSchema,labelRunRequestSchema,validKnowledgeState} from './decision-contracts.mjs';
import {decisionReviews} from '../repositories/decision-reviews.mjs';
const leaseMs=300000,batchSize=5;
const fatalReasons=new Set(['jev_auth_failed','unsupported_model','jev_disabled']);
const retryReasons=new Set(['provider_unavailable','invalid_response','jev_rate_limited','jev_busy','jev_cooldown','context_too_large']);
const timestamp=()=>new Date().toISOString();
const publicRun=({_id,lock_owner,lease_until,...row})=>row;
export function labelScope(source,after='',upper){return {source,type:'knowledge',active:true,_id:{$gt:after,...(upper?{$lte:upper}:{})}};}
function requireMongo(db){if(db.dialect!=='mongodb')throw Object.assign(new Error('Atlas primary required'),{code:'atlas_primary_required'});}
export function createAtlasLabeling(db,config,{classify=createKnowledgeBatch(config),clock=Date.now}={}) {
 requireMongo(db);
 const runs=db.collection('label_runs'),events=db.collection('decision_events'),documents=db.database.collection('documents'),reviews=decisionReviews(db);
 const scope=()=>labelScope(config.mongoSource);
 const get=async id=>{const row=await runs.findOne({id,source:config.mongoSource});return row?publicRun(row):null;};
 async function preview(request){
  const settings=labelRunRequestSchema.parse(request);
  const tail=await documents.find(scope(),{projection:{_id:1}}).sort({_id:-1}).limit(1).next();
  const upper=tail?._id||'',filter=labelScope(config.mongoSource,'',upper);
  const eligible=upper?await documents.countDocuments(filter,{limit:settings.limit}):0;
  const sample=eligible?await documents.find(filter).sort({_id:1}).limit(Math.min(batchSize,settings.limit)).toArray():[];
  return {...settings,eligible,upper_bound:upper,batch_size:batchSize,request_preview:sample.length?knowledgeBatchPreview(sample,config.jevModel):null,scope:'active_public_knowledge',notice:'Chỉ phân loại JSON tri thức công khai; không gửi tài khoản, hồ sơ riêng tư hoặc liên hệ. Xem trước không gọi Jev.'};
 }
 async function enqueue(request,accountId=null){
  const plan=await preview(request),id=randomUUID(),now=timestamp();
  const row={id,source:config.mongoSource,status:plan.eligible?'queued':'completed',allow_remote:plan.allow_remote,limit:plan.limit,total:plan.eligible,upper_bound:plan.upper_bound,cursor:'',scanned:0,saved:0,stale:0,jev:0,local:0,needs_review:0,jev_requests:0,attempts:0,last_error_code:null,next_attempt_at:0,lock_owner:'',lease_until:0,created_at:now,updated_at:now,created_by:accountId};
  try{await runs.insertOne(row);}catch(error){if(error.code===11000)throw Object.assign(new Error('An active run already exists'),{code:'label_run_active'});throw error;}
  return publicRun(row);
 }
 async function control(id,action){
  const filter={id,source:config.mongoSource,status:action==='resume'?{$in:['blocked','failed']} : {$in:['queued','running','blocked','failed']}};
  const change={status:action==='resume'?'queued':'cancelled',updated_at:timestamp(),lock_owner:'',lease_until:0,next_attempt_at:0,attempts:0,last_error_code:null};
  try{return !!(await runs.findOneAndUpdate(filter,{$set:change},{returnDocument:'after'}));}catch(error){if(error.code===11000)throw Object.assign(new Error('An active run already exists'),{code:'label_run_active'});throw error;}
 }
 async function runOnce(){
  const owner=randomUUID(),now=clock();
  const run=await runs.findOneAndUpdate({source:config.mongoSource,$or:[{status:'queued',next_attempt_at:{$lte:now}},{status:'running',lease_until:{$lte:now}}]},{$set:{status:'running',lock_owner:owner,lease_until:now+leaseMs,updated_at:timestamp()}},{sort:{created_at:1},returnDocument:'after'});
  if(!run)return {mode:'idle'};
  const owned={id:run.id,status:'running',lock_owner:owner};
  let requestCount=0;
  try{
   const remaining=run.limit-run.scanned;
   const batch=remaining>0&&run.upper_bound?await documents.find(labelScope(run.source,run.cursor,run.upper_bound)).sort({_id:1}).limit(Math.min(batchSize,remaining)).toArray():[];
   if(!batch.length){await runs.updateOne(owned,{$set:{status:'completed',lock_owner:'',lease_until:0,updated_at:timestamp()}});return {mode:'completed',run_id:run.id};}
   if(batch.some(document=>!validKnowledgeState(document).success))throw Object.assign(new Error('Invalid public JSON'),{code:'invalid_document_schema'});
   const started=clock(),result=await classify(batch,run.allow_remote),latency=Math.max(0,clock()-started);
   requestCount=result.jev_requests||0;
   if(!Array.isArray(result.items)||result.items.length!==batch.length)throw Object.assign(new Error('Invalid decision batch'),{code:'invalid_response'});
   const failure=result.items.find(item=>fatalReasons.has(item.reason)||retryReasons.has(item.reason));
   if(failure)throw Object.assign(new Error('Provider decision unavailable'),{code:failure.reason});
   const counters={scanned:batch.length,saved:0,stale:0,jev:0,local:0,needs_review:0,jev_requests:result.jev_requests||0};
   await db.transaction(async()=>{
    // withTransaction may invoke this callback again after a write conflict.
    Object.assign(counters,{saved:0,stale:0,jev:0,local:0,needs_review:0});
    const fence=await runs.updateOne({...owned,lease_until:{$gt:clock()}},{$set:{lease_until:clock()+leaseMs}},db.options());
    if(!fence.matchedCount)throw Object.assign(new Error('Run lease lost'),{code:'lease_lost'});
    for(let index=0;index<batch.length;index++){
     const document=batch[index],decision=result.items[index];
     if(decision.article_id!==document.resource_id)throw Object.assign(new Error('Invalid decision identity'),{code:'invalid_response'});
     // Write fence conflicts with edits to the original record during this transaction.
     const source=await db.collection('data_sync_jobs').updateOne({job_key:'knowledge:'+document.resource_id,revision:document.source_revision},{$inc:{label_fence:1}},db.options());
     const current=await documents.findOne({_id:document._id,source_revision:document.source_revision,content_hash:document.content_hash,active:true},db.options());
     const outcome=source.matchedCount&&current?'saved':'stale';
     const event=decisionEventSchema.parse({id:createHash('sha256').update(run.id+':'+document._id+':'+document.source_revision).digest('hex'),run_id:run.id,source:run.source,article_id:document.resource_id,source_revision:document.source_revision,content_hash:document.content_hash,decision_type:'KNOWLEDGE_TOPIC',provider:decision.mode==='jev'?'jev':'local',model:decision.model||null,topic:decision.topic,confidence:decision.confidence,probabilities:decision.probabilities,requires_review:decision.requires_review,policy_version:decision.policy_version,rubric_version:decision.rubric_version,fallback_used:decision.mode!=='jev',reason:decision.reason||null,latency_ms:latency,outcome,created_at:timestamp()});
     await events.insertOne(event,db.options());
     if(outcome==='saved'){
      await reviews.save(document,decision);counters.saved++;counters[decision.mode==='jev'?'jev':'local']++;if(decision.requires_review)counters.needs_review++;
      // Match the exact projection version. Never overwrite a newer projection.
      await documents.updateOne({_id:document._id,source_revision:document.source_revision,content_hash:document.content_hash},{$set:{jev:decision}},db.options());
     }else counters.stale++;
    }
    const exhausted=run.scanned+batch.length>=run.limit||batch.at(-1)._id===run.upper_bound;
    await runs.updateOne(owned,{$inc:counters,$set:{cursor:batch.at(-1)._id,status:exhausted?'completed':'queued',lock_owner:'',lease_until:0,attempts:0,last_error_code:null,next_attempt_at:0,updated_at:timestamp()}},db.options());
   });
   return {mode:'processed',run_id:run.id,...counters};
  }catch(error){
   if(error.code==='lease_lost')return {mode:'lease_lost'};
   const code=fatalReasons.has(error.code)||retryReasons.has(error.code)||error.code==='invalid_document_schema'?error.code:'labeling_failed';
   const attempts=run.attempts+1,retry=retryReasons.has(code)&&attempts<3;
   await runs.updateOne(owned,{$inc:{jev_requests:requestCount},$set:{status:retry?'queued':fatalReasons.has(code)?'blocked':'failed',last_error_code:code,attempts,next_attempt_at:retry?clock()+Math.min(300000,30000*2**(attempts-1)):0,lock_owner:'',lease_until:0,updated_at:timestamp()}});
   return {mode:retry?'retry_scheduled':'stopped',reason:code,run_id:run.id};
  }
 }
 return {preview,enqueue,get,control,runOnce,
  async list(after='',limit=20){return (await runs.find({source:config.mongoSource,...(after?{id:{$gt:after}}:{})}).sort({id:1}).limit(limit).toArray()).map(publicRun);},
  async eventPage(id,after='',limit=25){return events.find({source:config.mongoSource,run_id:id,id:{$gt:after}},{projection:{_id:0}}).sort({id:1}).limit(limit).toArray();}
 };
}
