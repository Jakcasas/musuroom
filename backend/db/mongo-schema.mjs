import {mongoDecisionValidator} from '../services/decision-contracts.mjs';
const string={bsonType:'string'};
const integer=(minimum,maximum)=>({bsonType:['int','long','double'],minimum,...(maximum===undefined?{}:{maximum}),multipleOf:1});
const choice=(...values)=>({enum:values});
const schema=(required,properties)=>({$jsonSchema:{bsonType:'object',required:required.split(','),properties}});
const rating=integer(1,9);
export const validators={
  decision_events:mongoDecisionValidator(),
  label_runs:schema('id,source,status,allow_remote,limit,cursor,scanned,saved,stale,jev,local,needs_review,jev_requests,attempts,lease_until,next_attempt_at',{
    id:string,source:string,status:choice('queued','running','completed','blocked','failed','cancelled'),allow_remote:{bsonType:'bool'},limit:integer(1,10000),cursor:string,
    scanned:integer(0),saved:integer(0),stale:integer(0),jev:integer(0),local:integer(0),needs_review:integer(0),jev_requests:integer(0),attempts:integer(0),lease_until:integer(0),next_attempt_at:integer(0)
  }),
  sensory_evaluations:schema('id,session_code,sample_code,tester_type,color_score,aroma_score,umami_taste_score,aftertaste_score,overall_acceptance,comments,created_at',{
    id:string,session_code:string,sample_code:string,tester_type:choice('JUDGE','STUDENT','CONSUMER','OTHER'),color_score:rating,aroma_score:rating,umami_taste_score:rating,aftertaste_score:rating,overall_acceptance:rating,comments:{bsonType:'string',maxLength:1000}
  }),
  judge_accounts:schema('id,display_name,role,enabled,secret_salt,secret_hash,expires_at',{
    id:string,role:choice('JUDGE','ADMIN'),enabled:integer(0,1),expires_at:integer(0),secret_salt:{bsonType:'string',pattern:'^[a-f0-9]{32}$'},secret_hash:{bsonType:'string',pattern:'^[a-f0-9]{128}$'}
  }),
  auth_sessions:schema('token_hash,account_id,csrf_token,created_at,expires_at,last_seen,credential_hash',{token_hash:string,account_id:string,expires_at:integer(0),last_seen:integer(0)}),
  sample_requests:schema('id,full_name,contact,contact_normalized,consent_at,status',{id:string,contact_normalized:string,status:choice('PENDING','SENT','FEEDBACK_RECEIVED','CANCELLED')}),
  quality_documents:schema('id,file_name,title,doc_type,size_bytes,sha256,evidence_status',{
    id:string,file_name:{bsonType:'string',pattern:'^[0-9a-f-]{36}\\.(pdf|txt|csv|docx|xlsx|png|jpg|webp|mp4)$'},doc_type:choice('BRIEF','SOP','COGS','COA','MEDIA','REPORT'),size_bytes:integer(1,50*1024*1024),sha256:{bsonType:'string',pattern:'^[a-f0-9]{64}$'},evidence_status:choice('DRAFT','FINAL')
  }),
  product_samples:schema('id,sample_code,metrics,nutrition,evidence_document_id,publication_status',{
    id:string,sample_code:string,metrics:{bsonType:'object'},nutrition:{bsonType:'object'},publication_status:choice('PUBLIC','PRIVATE')
  }),
  research_records:schema('id,kind,title,data,published,public_token,revision,created_at,updated_at',{
    id:string,kind:choice('sample','rubric','clause'),data:{bsonType:'object'},published:integer(0,1),revision:integer(1)
  }),
  research_scores:schema('rubric_id,sample_id,judge_id,scores,total,revision,sample_revision,updated_at',{
    scores:{bsonType:'array',minItems:1,maxItems:10,items:{bsonType:'number',minimum:0,maximum:10}},total:{bsonType:'number',minimum:0,maximum:100},revision:integer(1),sample_revision:integer(1)
  }),
  data_sync_jobs:schema('job_key,resource_type,resource_id,revision,synced_revision',{
    job_key:string,resource_type:choice('knowledge','sensory','product'),revision:integer(1),synced_revision:integer(0)
  }),
  knowledge_decision_reviews:schema('article_id,source_revision,content_hash,decision_version,decision,review_status',{
    source_revision:integer(1),decision:{bsonType:'object'},review_status:choice('pending','confirmed','rejected')
  }),
  research_vectors:schema('record_id,source_revision,model,embedding,norm',{
    record_id:string,source_revision:integer(1),model:string,embedding:{bsonType:'array',minItems:384,maxItems:384,items:{bsonType:'number',minimum:-1000,maximum:1000}},norm:{bsonType:'number',minimum:0}
  })
};
