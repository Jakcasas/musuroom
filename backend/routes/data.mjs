import { Router } from 'express';
import { dataJobs,projectDocument,dataStatus } from '../services/data-projections.mjs';
import { knowledgeDecisionRequest,createKnowledgeClassifier } from '../services/knowledge-decisions.mjs';
import { rateLimit } from '../security/rate-limit.mjs';
import { createKnowledgeBatch,knowledgeBatchPreview } from '../services/knowledge-batch.mjs';
import { decisionReviews } from '../repositories/decision-reviews.mjs';
export function dataRouter(db,security,config,fetchImpl) {
 const router=Router(),classify=createKnowledgeClassifier(config,fetchImpl),batch=createKnowledgeBatch(config,fetchImpl),reviews=decisionReviews(db);
 router.use('/admin/data',security.requireAdmin);
 router.get('/admin/data/status',async(req,res)=>res.json({...await dataStatus(db,config),jev_enabled:config.jevEnabled,batch_size:config.mongoBatchSize}));
 router.get('/admin/data/documents',async(req,res)=>{
  const {after='',type}=req.query,limit=Number(req.query.limit??25);
  if(typeof after!=='string'||after.length>250||(type!==undefined&&(typeof type!=='string'||!['knowledge','sensory','product'].includes(type)))||!Number.isInteger(limit)||limit<1||limit>100)return res.status(400).json({error:'invalid_pagination'});
  const jobs=await dataJobs(db,{after,type,limit});const items=[];
  for(const job of jobs)items.push(await projectDocument(db,job,config.mongoSource));
  res.json({items,next_cursor:jobs.length===limit?jobs.at(-1).job_key:null,limit});
 });
 const document=async req=>{
  const id=req.body?.article_id;
  if(typeof id!=='string'||!/^[a-z0-9-]{1,100}$/.test(id))return null;
  const job=await db.prepare('SELECT * FROM data_sync_jobs WHERE job_key=? AND resource_type=?').get('knowledge:'+id,'knowledge');
  if(!job)return null;
  const item=await projectDocument(db,job,config.mongoSource);return item.active?item:null;
 };
 const validIds=ids=>Array.isArray(ids)&&ids.length>=1&&ids.length<=5&&new Set(ids).size===ids.length&&ids.every(id=>typeof id==='string'&&/^[a-z0-9-]{1,100}$/.test(id));
 const documentsFor=async ids=>{const documents=[];for(const article_id of ids){const item=await document({body:{article_id}});if(!item)return null;documents.push(item);}return documents;};
 router.post('/admin/data/jev-batch-preview',async(req,res)=>{
  if(!validIds(req.body?.article_ids))return res.status(422).json({error:'invalid_classification_batch'});
  const documents=await documentsFor(req.body.article_ids);if(!documents)return res.status(404).json({error:'article_not_found'});
  res.json({...knowledgeBatchPreview(documents,config.jevModel),notice:'Bản xem trước không gọi JevAI. Chỉ gửi khi bạn đồng ý và thực hiện phân loại.'});
 });
 router.post('/admin/data/jev-preview',async(req,res)=>{const item=await document(req);if(!item)return res.status(404).json({error:'article_not_found'});res.json({request:knowledgeDecisionRequest(item,config.jevModel),notice:'Chỉ gửi nội dung bài tri thức này khi bạn chọn phân loại. Không chứa khóa API.'});});
 router.post('/admin/data/classify',rateLimit(5,'classification_rate_limit'),async(req,res)=>{
  if(typeof req.body?.allow_remote!=='boolean')return res.status(422).json({error:'remote_consent_required'});
  const item=await document(req);if(!item)return res.status(404).json({error:'article_not_found'});
  const decision=await classify(item,req.body.allow_remote);
  const decision_version=await reviews.save(item,decision);
  res.json({article_id:item.resource_id,decision_version,...decision});
 });
 router.post('/admin/data/classify-batch',(req,res,next)=>{
  const {article_ids,allow_remote}=req.body||{};
  if(typeof allow_remote!=='boolean'||!validIds(article_ids))return res.status(422).json({error:'invalid_classification_batch'});
  next();
 },rateLimit(3,'classification_rate_limit'),async(req,res)=>{
  const {article_ids,allow_remote}=req.body;
  const documents=await documentsFor(article_ids);if(!documents)return res.status(404).json({error:'article_not_found'});
  const result=await batch(documents,allow_remote);
  for(let index=0;index<documents.length;index++)result.items[index].decision_version=await reviews.save(documents[index],result.items[index]);
  res.json(result);
 });
 router.get('/admin/data/reviews',async(req,res)=>{
  const after=req.query.after??'',limit=Number(req.query.limit??25),filter=req.query.filter??'all';
  if(typeof after!=='string'||after.length>100||!Number.isInteger(limit)||limit<1||limit>100||!['all','pending','confirmed','rejected','stale'].includes(filter))return res.status(400).json({error:'invalid_pagination'});
  const items=await reviews.list(after,limit,filter);res.json({items,filter,next_cursor:items.length===limit?items.at(-1).article_id:null});
 });
 router.post('/admin/data/review',async(req,res)=>{
  const {article_id,decision_version,status}=req.body||{};
  if(typeof article_id!=='string'||!/^[a-z0-9-]{1,100}$/.test(article_id)||typeof decision_version!=='string'||!/^[a-f0-9-]{36}$/.test(decision_version)||!['confirmed','rejected'].includes(status))return res.status(422).json({error:'invalid_review'});
  if(!await reviews.review(article_id,decision_version,status))return res.status(409).json({error:'decision_changed_or_stale'});
  await security.audit(req.principal.account_id,'KNOWLEDGE_'+status.toUpperCase(),article_id);
  res.json({article_id,status});
 });
 return router;
}
