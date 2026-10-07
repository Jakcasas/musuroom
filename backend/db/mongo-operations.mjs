import { randomUUID } from 'node:crypto';
import { toDocument, toRow } from './mongodb.mjs';
import { criteria } from '../services/sensory-metrics.mjs';
import { weightedScore } from '../services/research-model.mjs';

// Fixed, named queries: no SQL translation and no client-supplied Mongo filters.
export function nativeOperations(db) {
  const c=db.collection, opts=db.options, stamp=()=>new Date().toISOString();
  const fields=(keys,values)=>Object.fromEntries(keys.split(',').map((key,i)=>[key,values[i]]));
  const one=async(name,filter,projection)=>toRow(await c(name).findOne(filter,{...opts(),...(projection?{projection}: {})}));
  const many=async(name,filter={},sort={id:1},limit=500,skip=0,projection)=> (await c(name).find(filter,{...opts(),...(projection?{projection}: {})}).sort(sort).skip(skip).limit(limit).toArray()).map(toRow);
  const aggregate=(name,pipeline)=>c(name).aggregate(pipeline,{...opts(),maxTimeMS:15000}).toArray();
  const update=async(name,filter,change,extra={})=>{const r=await c(name).updateOne(filter,change,{...opts(),...extra});return{changes:r.matchedCount+r.upsertedCount};};
  const remove=async(name,filter)=>({changes:(await c(name).deleteMany(filter,opts())).deletedCount});
  const insert=async(name,row)=>{await c(name).insertOne(toDocument(row),opts());return{changes:1};};
  const duplicateSafe=async fn=>{try{return await fn();}catch(error){if(error.code===11000)return{changes:0};throw error;}};
  const bump=async(type,id)=>{
    await c('data_sync_jobs').updateOne({job_key:type+':'+id},{$inc:{revision:1},$set:{resource_type:type,resource_id:id,attempts:0,last_error_code:null,updated_at:stamp()},$setOnInsert:{synced_revision:0}},{...opts(),upsert:true});
  };
  const joinedKnowledge=async(filter={})=> (await aggregate('knowledge_articles',[
    {$match:filter},{$lookup:{from:'app_sources',localField:'source_id',foreignField:'id',as:'source'}},{$unwind:'$source'},{$sort:{source_id:1,id:1}},
    {$replaceWith:{$mergeObjects:['$source','$$ROOT']}},{$unset:['source','_id']}
  ])).map(toRow);
  const productFields={_id:0,id:1,sample_code:1,label:1,origin:1,process_notes:1,metrics:1,nutrition:1,measured_at:1,evidence_document_id:1};
  const publicProducts=async filter=>(await aggregate('product_samples',[
    {$match:{...filter,publication_status:'PUBLIC'}},{$lookup:{from:'app_quality_documents',localField:'evidence_document_id',foreignField:'id',as:'evidence'}},{$unwind:'$evidence'},
    {$match:{'evidence.evidence_status':'FINAL','evidence.doc_type':{$in:['COA','REPORT']}}},{$sort:{measured_at:-1,sample_code:1}},{$project:productFields}
  ])).map(toRow);
  const writeScore=async(row,revision)=>duplicateSafe(()=>db.transaction(async()=>{
    // Write to the sample within the transaction: a concurrent sample edit must
    // conflict rather than allowing a score against an obsolete revision.
    const sample=await c('research_records').updateOne({id:row.sample_id,kind:'sample',revision:row.sample_revision},{$inc:{score_fence:1}},opts());
    if(!sample.matchedCount){const e=new Error('Sample revision changed');e.constraint='research_score_sample_revision';throw e;}
    const rubric=await c('research_records').findOne({id:row.rubric_id,kind:'rubric'},opts());
    const scores=JSON.parse(row.scores_json);
    if(!rubric||weightedScore(scores,rubric.data.criteria)!==row.total)throw new Error('Invalid weighted score');
    if(!await c('judge_accounts').findOne({id:row.judge_id,enabled:1},opts()))throw new Error('Judge unavailable');
    const key={rubric_id:row.rubric_id,sample_id:row.sample_id,judge_id:row.judge_id};
    if(!revision)return insert('research_scores',{...row,revision:1});
    return update('research_scores',{...key,revision},{$set:toDocument({...row,revision:revision+1})});
  }));
  return {
    health:async()=>{await db.ping();return{ok:1};},
    'knowledge.count':async()=>({n:await c('knowledge_articles').countDocuments({},opts())}),
    'knowledge.list':()=>joinedKnowledge(),
    'knowledge.project':async([id])=>{
      const r=(await joinedKnowledge({id}))[0];if(!r)return undefined;
      const keys=['id','title','category','summary','body','application','limitation','tags_json','citation','url','publication_year','access_scope'];
      return {...Object.fromEntries(keys.map(key=>[key,r[key]])),ref:r.source_id};
    },
    'research.publishedClauses':()=>many('research_records',{kind:'clause',published:1},{id:1},500,0,{id:1,data:1}),
    'batches.list':([limit,offset])=>many('batches',{}, {created_at:-1,id:-1},limit,offset),
    'batches.get':([id])=>one('batches',{id}),
    'batches.insert':values=>insert('batches',{...fields('id,name,mass_kg,reject_percent,initial_moisture_percent,final_moisture_percent,loss_percent,accepted_kg,powder_kg,yield_percent,notes',values),formula_version:'mass-balance-1',created_at:stamp()}),
    'sensory.key':([session_code,sample_code,submission_key])=>one('sensory_evaluations',{session_code,sample_code,submission_key}),
    'sensory.get':([id])=>one('sensory_evaluations',{id}),
    'sensory.insert':values=>duplicateSafe(()=>db.transaction(async()=>{
      const row={...fields('id,session_code,sample_code,submission_key,tester_type,color_score,aroma_score,umami_taste_score,aftertaste_score,overall_acceptance,comments',values),created_at:stamp()};
      const result=await insert('sensory_evaluations',row);await bump('sensory',row.session_code+':'+row.sample_code);return result;
    })),
    'sensory.list':([session_code,sample_code])=>many('sensory_evaluations',{session_code,sample_code},{created_at:1,id:1},0),
    'sensory.distribution':([session_code,sample_code])=>aggregate('sensory_evaluations',[
      {$match:{session_code,sample_code}},{$project:{observations:[...criteria.map(({key})=>({criterion:{$literal:key},score:'$'+key,tester_type:null})),{criterion:{$literal:'tester_type'},score:null,tester_type:'$tester_type'}]}},
      {$unwind:'$observations'},{$group:{_id:'$observations',n:{$sum:1}}},{$project:{_id:0,criterion:'$_id.criterion',score:'$_id.score',tester_type:'$_id.tester_type',n:1}}
    ]),
    'sensory.groups':()=>aggregate('sensory_evaluations',[{$group:{_id:{session_code:'$session_code',sample_code:'$sample_code'},count:{$sum:1},latest_at:{$max:'$created_at'}}},{$sort:{latest_at:-1}},{$project:{_id:0,session_code:'$_id.session_code',sample_code:'$_id.sample_code',count:1,latest_at:1}}]),
    'sensory.comments':([session_code,sample_code])=>many('sensory_evaluations',{session_code,sample_code,comments:{$ne:''}},{created_at:-1},1000,0,{comments:1}),
    'leads.contact':aliases=>one('sample_requests',{contact_normalized:{$in:aliases}},{id:1,status:1}),
    'leads.get':([id])=>one('sample_requests',{id}),
    'leads.insert':values=>duplicateSafe(()=>insert('sample_requests',{...fields('id,full_name,contact,contact_normalized,organization_type,dietary_preference,shipping_address,consent_at',values),status:'PENDING',created_at:stamp(),updated_at:stamp()})),
    'leads.list':([limit,offset])=>many('sample_requests',{}, {created_at:-1,id:-1},limit,offset,{contact_normalized:0}),
    'leads.byStatus':([status,limit,offset])=>many('sample_requests',{status},{created_at:-1,id:-1},limit,offset,{contact_normalized:0}),
    'leads.update':([status,updated_at,id])=>update('sample_requests',{id},{$set:{status,updated_at}}),
    'leads.delete':([id])=>remove('sample_requests',{id}),
    'documents.get':([id])=>one('quality_documents',{id}),
    'documents.hash':([sha256])=>one('quality_documents',{sha256},{id:1}),
    'documents.list':()=>many('quality_documents',{}, {created_at:-1,id:1},0,0,{file_name:0}),
    'documents.evidence':()=>many('quality_documents',{}, {created_at:-1,id:1},500,0,{id:1,title:1,doc_type:1,evidence_status:1}),
    'documents.insert':values=>insert('quality_documents',{...fields('id,title,doc_type,file_name,mime,size_bytes,sha256,evidence_status',values),created_at:stamp()}),
    'products.public':()=>publicProducts({}),
    'products.project':async([id])=>{const row=(await publicProducts({id}))[0];if(row)delete row.evidence_document_id;return row;},
    'products.code':([sample_code])=>one('product_samples',{sample_code},{id:1}),
    'products.insert':values=>duplicateSafe(()=>db.transaction(async()=>{
      const row={...fields('id,sample_code,label,origin,process_notes,metrics_json,nutrition_json,measured_at,evidence_document_id,publication_status',values),created_at:stamp()};
      if(!await c('quality_documents').findOne({id:row.evidence_document_id,evidence_status:'FINAL',doc_type:{$in:['COA','REPORT']}},opts()))throw new Error('Evidence unavailable');
      const result=await insert('product_samples',row);await bump('product',row.id);return result;
    })),
    'accounts.get':([id])=>one('judge_accounts',{id}),
    'accounts.activeJudge':([id,now])=>one('judge_accounts',{id,role:'JUDGE',enabled:1,expires_at:{$gt:now}}),
    'accounts.insert':values=>insert('judge_accounts',{...fields('id,display_name,role,secret_salt,secret_hash,expires_at',values),enabled:1,created_at:stamp()}),
    'accounts.bootstrap':values=>db.transaction(async()=>{
      const row=fields('id,display_name,role,secret_salt,secret_hash,expires_at',values);
      const result=await update('judge_accounts',{id:row.id},{$set:{...row,enabled:1},$setOnInsert:{created_at:stamp()}},{upsert:true});
      await remove('auth_sessions',{account_id:row.id});return result;
    }),
    'accounts.rotate':([secret_salt,secret_hash,id])=>update('judge_accounts',{id,role:'JUDGE'},{$set:{secret_salt,secret_hash}}),
    'accounts.revoke':([id])=>update('judge_accounts',{id},{$set:{enabled:0}}),
    'audit.insert':([account_id,action,resource_id=null])=>insert('access_audit',{id:randomUUID(),account_id,action,resource_id,created_at:stamp()}),
    'audit.revoke':([account_id])=>insert('access_audit',{id:randomUUID(),account_id,action:'ACCESS_REVOKED',resource_id:null,created_at:stamp()}),
    'sessions.deleteAccount':([account_id])=>remove('auth_sessions',{account_id}),
    'sessions.delete':([token_hash])=>remove('auth_sessions',{token_hash}),
    'sessions.prune':([expiry,idle])=>remove('auth_sessions',{$or:[{expires_at:{$lte:expiry}},{last_seen:{$lte:idle}}]}),
    'sessions.touch':([last_seen,token_hash])=>update('auth_sessions',{token_hash},{$max:{last_seen}}),
    'sessions.get':async([token_hash])=>{
      const session=await c('auth_sessions').findOne({token_hash},opts());if(!session)return undefined;
      const account=await c('judge_accounts').findOne({id:session.account_id},opts());
      if(!account||session.credential_hash!==account.secret_hash)return undefined;
      return {...toRow(session),display_name:account.display_name,role:account.role,enabled:account.enabled,account_expiry:account.expires_at};
    },
    'sessions.insert':([token_hash,csrf_token,created_at,expires_at,last_seen,id,secret_hash,account_expiry,role])=>db.transaction(async()=>{
      const result=await update('judge_accounts',{id,secret_hash,enabled:1,expires_at:account_expiry,role},{$inc:{auth_fence:1}});
      if(!result.changes)return result;
      return insert('auth_sessions',{token_hash,account_id:id,csrf_token,created_at,expires_at,last_seen,credential_hash:secret_hash});
    }),
    'research.get':([id])=>one('research_records',{id}),
    'research.list':([kind])=>many('research_records',{kind},{id:1},500),
    'research.trace':([public_token])=>one('research_records',{public_token,kind:'sample',published:1}),
    'research.insert':values=>insert('research_records',{...fields('id,kind,identity_key,title,data_json,published,public_token,created_at,updated_at',values),revision:1}),
    'research.update':([identity_key,title,data_json,published,updated_at,id,revision])=>update('research_records',{id,revision,kind:{$ne:'rubric'}},{$set:{identity_key,title,data:JSON.parse(data_json),published,updated_at},$inc:{revision:1}}),
    'scores.insert':values=>writeScore(fields('rubric_id,sample_id,judge_id,scores_json,total,sample_revision,updated_at',values),0),
    'scores.update':([scores_json,total,sample_revision,updated_at,rubric_id,sample_id,judge_id,revision])=>writeScore({scores_json,total,sample_revision,updated_at,rubric_id,sample_id,judge_id},revision),
    'scores.mine':([judge_id])=>many('research_scores',{judge_id},{sample_id:1,rubric_id:1},0,0,{judge_id:0,updated_at:0}),
    'scores.summary':()=>aggregate('research_scores',[
      {$lookup:{from:'app_research_records',localField:'sample_id',foreignField:'id',as:'sample'}},{$unwind:'$sample'},
      {$set:{current:{$eq:['$sample_revision','$sample.revision']}}},{$group:{_id:{rubric_id:'$rubric_id',sample_id:'$sample_id',current_sample_revision:'$sample.revision'},judges:{$sum:1},mean_total:{$avg:'$total'},current_judges:{$sum:{$cond:['$current',1,0]}},stale_judges:{$sum:{$cond:['$current',0,1]}},current_mean_total:{$avg:{$cond:['$current','$total',null]}}}},
      {$replaceWith:{$mergeObjects:['$_id','$$ROOT']}},{$unset:'_id'},{$sort:{sample_id:1,rubric_id:1}}
    ]),
    'reviews.save':([article_id,source_revision,content_hash,decision_version,decision_json,updated_at])=>duplicateSafe(()=>update('knowledge_decision_reviews',{article_id,source_revision:{$lte:source_revision}},{$set:{article_id,source_revision,content_hash,decision_version,decision:JSON.parse(decision_json),review_status:'pending',updated_at,reviewed_at:null}},{upsert:true})),
    'reviews.list':(values,[filter])=>{
      const after=values[0],limit=values.at(-1);
      return aggregate('knowledge_decision_reviews',[
        {$match:{article_id:{$gt:after},...(!['all','stale'].includes(filter)?{review_status:filter}:{})}},
        {$lookup:{from:'app_knowledge_articles',localField:'article_id',foreignField:'id',as:'article'}},{$unwind:'$article'},
        {$lookup:{from:'app_data_sync_jobs',let:{key:{$concat:['knowledge:','$article_id']}},pipeline:[{$match:{$expr:{$eq:['$job_key','$$key']}}}],as:'job'}},{$unwind:'$job'},
        ...(filter==='stale'?[{$match:{$expr:{$ne:['$source_revision','$job.revision']}}}]:[]),
        {$set:{title:'$article.title',current_revision:'$job.revision'}},{$unset:['article','job','_id']},{$sort:{article_id:1}},{$limit:limit}
      ]).then(rows=>rows.map(toRow));
    },
    'reviews.review':([review_status,reviewed_at,article_id,decision_version])=>db.transaction(async()=>{
      const review=await c('knowledge_decision_reviews').findOne({article_id,decision_version,review_status:'pending'},opts());if(!review)return{changes:0};
      const lock=await update('data_sync_jobs',{job_key:'knowledge:'+article_id,revision:review.source_revision},{$inc:{review_fence:1}});if(!lock.changes)return{changes:0};
      return update('knowledge_decision_reviews',{article_id,decision_version,review_status:'pending'},{$set:{review_status,reviewed_at}});
    }),
    'jobs.get':([job_key,resource_type])=>one('data_sync_jobs',{job_key,resource_type}),
    'jobs.rebuild':async()=>({changes:(await c('data_sync_jobs').updateMany({},{$inc:{revision:1},$set:{attempts:0,last_error_code:null}},opts())).matchedCount}),
    'jobs.list':(values,[type,pending])=>many('data_sync_jobs',{job_key:{$gt:values[0]},...(type?{resource_type:type}:{}),...(pending==='true'?{$expr:{$lt:['$synced_revision','$revision']}}:{})},{job_key:1},values.at(-1)),
    'jobs.counts':async()=>({total:await c('data_sync_jobs').countDocuments({},opts()),pending:await c('data_sync_jobs').countDocuments({$expr:{$lt:['$synced_revision','$revision']}},opts())}),
    'jobs.state':()=>one('data_sync_state',{id:'mongo'},{last_completed_at:1,last_error_code:1,last_synced_count:1}),
    'sync.claim':([lock_owner,lease_until,now])=>update('data_sync_state',{id:'mongo',lease_until:{$lte:now}},{$set:{lock_owner,lease_until}}),
    'sync.renew':([lease_until,lock_owner,now])=>update('data_sync_state',{id:'mongo',lock_owner,lease_until:{$gt:now}},{$set:{lease_until}}),
    'sync.done':([synced_revision,job_key,revision])=>update('data_sync_jobs',{job_key,synced_revision:{$lt:revision}},{$set:{synced_revision,attempts:0,last_error_code:null}}),
    'sync.error':([last_error_code,job_key])=>update('data_sync_jobs',{job_key,$expr:{$lt:['$synced_revision','$revision']}},{$set:{last_error_code},$inc:{attempts:1}}),
    'sync.release':([last_completed_at,last_error_code,last_synced_count,lock_owner])=>update('data_sync_state',{id:'mongo',lock_owner},{$set:{last_completed_at,last_error_code,last_synced_count,lock_owner:'',lease_until:0}}),
    'sync.failure':([last_error_code])=>update('data_sync_state',{id:'mongo'},{$set:{last_error_code}}),
    'vectors.import':([model,embedding,record_id,source_revision])=>db.transaction(async()=>{
      const source=await update('research_records',{id:record_id,kind:'clause',revision:source_revision},{$inc:{review_fence:1}});
      if(!source.changes)return source;
      const values=JSON.parse(embedding),norm=Math.sqrt(values.reduce((n,v)=>n+v*v,0));
      return update('research_vectors',{record_id},{$set:{record_id,source_revision,model,embedding:values,norm}},{upsert:true});
    }),
    'vectors.search':async([embedding,model])=>{
      const values=JSON.parse(embedding),norm=Math.sqrt(values.reduce((n,v)=>n+v*v,0));
      return (await aggregate('research_vectors',[
        {$match:{model,norm:{$gt:0}}},{$lookup:{from:'app_research_records',localField:'record_id',foreignField:'id',as:'record'}},{$unwind:'$record'},
        {$match:{'record.published':1,$expr:{$eq:['$source_revision','$record.revision']}}},
        {$set:{similarity:{$divide:[{$sum:{$map:{input:{$range:[0,384]},as:'i',in:{$multiply:[{$arrayElemAt:['$embedding','$$i']},{$arrayElemAt:[{$literal:values},'$$i']}]}}}},{$multiply:['$norm',norm]}]}}},
        {$sort:{similarity:-1,record_id:1}},{$limit:5},{$project:{_id:0,id:'$record.id',title:'$record.title',data:'$record.data',similarity:1}}
      ])).map(toRow);
    }
  };
}
