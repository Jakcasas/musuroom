import { MongoClient, GridFSBucket } from 'mongodb';
import { AsyncLocalStorage } from 'node:async_hooks';
import { articles } from '../../dist/knowledge-data.js';
import { mongoFailureCode } from '../services/mongo-store.mjs';
import { nativeOperations } from './mongo-operations.mjs';
import { validators } from './mongo-schema.mjs';

export const primaryCollections = ['sources','knowledge_articles','batches','sensory_evaluations','sample_requests','judge_accounts','auth_sessions','quality_documents','product_samples','access_audit','research_records','research_scores','knowledge_decision_reviews','data_sync_jobs','data_sync_state','research_vectors'];
const jsonFields = ['tags','metrics','nutrition','data','scores','decision'];
export function toDocument(row) {
  const copy = {...row};
  for (const key of jsonFields) if (Object.hasOwn(copy,key+'_json')) {
    copy[key]=JSON.parse(copy[key+'_json']); delete copy[key+'_json'];
  }
  return copy;
}
export function toRow(doc) {
  if (!doc) return undefined;
  const {_id, credential_hash, auth_fence, score_fence, review_fence, ...row}=doc;
  for(const key of jsonFields) if(Object.hasOwn(row,key)){row[key+'_json']=JSON.stringify(row[key]);delete row[key];}
  return row;
}
export async function openMongoDatabase(config) {
  const client=new MongoClient(config.mongoUri,{appName:'musuroom-primary',maxPoolSize:10,minPoolSize:0,serverSelectionTimeoutMS:10000,connectTimeoutMS:10000,waitQueueTimeoutMS:10000,socketTimeoutMS:20000,tls:true,retryWrites:true});
  try {
    await client.connect();
    const database=client.db(config.mongoDatabase,{writeConcern:{w:'majority'}});
    await database.command({ping:1});
    const context=new AsyncLocalStorage();
    const store={
      dialect:'mongodb',client,database,
      collection:name=>{if(!primaryCollections.includes(name))throw new Error('Unknown primary collection');return database.collection('app_'+name);},
      options:()=>context.getStore()?{session:context.getStore()}: {},
      async transaction(fn){
        if(context.getStore())return fn();
        const session=client.startSession();
        try{return await session.withTransaction(()=>context.run(session,fn),{readConcern:{level:'snapshot'},writeConcern:{w:'majority'},maxCommitTimeMS:15000});}
        finally{await session.endSession();}
      },
      files:new GridFSBucket(database,{bucketName:'dossier'}),
      close:()=>client.close(),
      async ping(){await database.command({ping:1});return true;}
    };
    await initializeCollections(store);
    const operations=nativeOperations(store);
    store.operation=name=>{
      const [key,...context]=name.split(':');const handler=operations[key];
      if(!handler)throw new Error('Unsupported database operation: '+key);
      const execute=(...args)=>handler(args,context);
      return {all:execute,get:async(...args)=>{const row=await execute(...args);return Array.isArray(row)?row[0]:row;},run:execute};
    };
    await seed(store);
    return store;
  } catch(error) {
    await client.close().catch(()=>{});
    const safe=new Error('MongoDB primary initialization failed');safe.code=mongoFailureCode(error);throw safe;
  }
}
async function initializeCollections(db) {
  const existing=new Set((await db.database.listCollections({},{nameOnly:true}).toArray()).map(x=>x.name));
  for(const name of primaryCollections)if(!existing.has('app_'+name)){
    try{await db.database.createCollection('app_'+name,validators[name]?{validator:validators[name],validationLevel:'strict',validationAction:'error'}:{});}catch(error){if(error.code!==48)throw error;}
  }
  const index=(name,keys,options={})=>db.collection(name).createIndex(keys,options);
  for(const name of primaryCollections.filter(n=>!['auth_sessions','research_scores','knowledge_decision_reviews','data_sync_jobs','research_vectors'].includes(n)))await index(name,{id:1},{unique:true});
  for(const [name,keys] of [['auth_sessions',{token_hash:1}],['research_scores',{rubric_id:1,sample_id:1,judge_id:1}],['knowledge_decision_reviews',{article_id:1}],['data_sync_jobs',{job_key:1}],['research_vectors',{record_id:1}]])await index(name,keys,{unique:true});
  await index('sensory_evaluations',{session_code:1,sample_code:1,submission_key:1},{unique:true,partialFilterExpression:{submission_key:{$type:'string'}}});
  await index('sensory_evaluations',{session_code:1,sample_code:1,created_at:1,id:1});
  await index('sample_requests',{contact_normalized:1},{unique:true});
  await index('sample_requests',{status:1,created_at:-1,id:-1});
  await index('sample_requests',{created_at:-1,id:-1});
  await index('batches',{created_at:-1,id:-1});
  await index('research_records',{identity_key:1},{unique:true,partialFilterExpression:{identity_key:{$type:'string'}}});
  await index('research_records',{public_token:1},{unique:true});
  await index('research_records',{kind:1,published:1,id:1});
  await index('research_records',{kind:1,id:1});
  await index('research_scores',{judge_id:1});
  await index('research_scores',{sample_id:1,rubric_id:1});
  await index('research_vectors',{model:1});
  await index('quality_documents',{file_name:1},{unique:true});
  await index('product_samples',{sample_code:1},{unique:true});
  await index('product_samples',{publication_status:1,measured_at:-1,sample_code:1});
  await index('quality_documents',{created_at:-1,id:1});
  await index('auth_sessions',{account_id:1});
  await index('auth_sessions',{expires_at:1});
  await index('knowledge_articles',{source_id:1,id:1});
  await index('data_sync_jobs',{resource_type:1,job_key:1});
  await db.collection('data_sync_state').updateOne({id:'mongo'},{$setOnInsert:{id:'mongo',lock_owner:'',lease_until:0,last_completed_at:null,last_error_code:null,last_synced_count:0}},{upsert:true});
}
async function seed(db) {
  await db.transaction(async()=>{
    for(const a of articles){
      await db.collection('sources').updateOne({id:a.ref},{$setOnInsert:{id:a.ref,citation:a.source,url:a.url,publication_year:Number(a.year),evidence_type:a.type,access_scope:a.access,reviewed_at:'2026-09-30'}},{...db.options(),upsert:true});
      const stamp=new Date().toISOString();
      await db.collection('knowledge_articles').updateOne({id:a.id},{$setOnInsert:{id:a.id,source_id:a.ref,title:a.title,category:a.category,summary:a.summary,body:a.body,application:a.application,limitation:a.limitation,tags:a.tags,created_at:stamp,updated_at:stamp}},{...db.options(),upsert:true});
      await db.collection('data_sync_jobs').updateOne({job_key:'knowledge:'+a.id},{$setOnInsert:{job_key:'knowledge:'+a.id,resource_type:'knowledge',resource_id:a.id,revision:1,synced_revision:0,attempts:0,last_error_code:null,updated_at:stamp}},{...db.options(),upsert:true});
    }
  });
}
