import { operation } from '../db/operation.mjs';
import { Router } from 'express';
import { dataJobs,projectDocument,dataStatus } from '../services/data-projections.mjs';
import { knowledgeDecisionRequest,createKnowledgeClassifier } from '../services/knowledge-decisions.mjs';
import { rateLimit } from '../security/rate-limit.mjs';
import { createKnowledgeBatch,knowledgeBatchPreview } from '../services/knowledge-batch.mjs';
import { decisionReviews } from '../repositories/decision-reviews.mjs';
import {createAtlasLabeling} from '../services/atlas-labeling.mjs';
import {decisionSchemas,labelRunRequestSchema} from '../services/decision-contracts.mjs';
import {validateBody} from '../services/input-schemas.mjs';
export function dataRouter(db,security,config,fetchImpl) {
 const router=Router(),classify=createKnowledgeClassifier(config,fetchImpl),batch=createKnowledgeBatch(config,fetchImpl),reviews=decisionReviews(db);
 router.use('/admin/data',security.requireAdmin);
 router.get('/admin/data/schemas',(req,res)=>res.json(decisionSchemas));
 const labeler=db.dialect==='mongodb'?createAtlasLabeling(db,config,{classify:batch}):null;
 router.use('/admin/data/label-runs',(req,res,next)=>labeler?next():res.status(409).json({error:'atlas_primary_required'}));
 router.post('/admin/data/label-runs/preview',validateBody(labelRunRequestSchema),async(req,res)=>res.json(await labeler.preview(req.body)));
 router.post('/admin/data/label-runs',validateBody(labelRunRequestSchema),rateLimit(2,'classification_rate_limit'),async(req,res)=>{
  try{const run=await labeler.enqueue(req.body,req.principal.account_id);await security.audit(req.principal.account_id,'LABEL_RUN_CREATED',run.id);res.status(202).json(run);}
  catch(error){if(error.code==='label_run_active')return res.status(409).json({error:error.code});throw error;}
 });
 const pageQuery=req=>{const after=req.query.after??'',limit=Number(req.query.limit??25);return typeof after==='string'&&/^[a-f0-9-]{0,64}$/.test(after)&&Number.isInteger(limit)&&limit>=1&&limit<=100?{after,limit}:null;};
 router.get('/admin/data/label-runs',async(req,res)=>{const page=pageQuery(req);if(!page)return res.status(400).json({error:'invalid_pagination'});const items=await labeler.list(page.after,page.limit);res.json({items,next_cursor:items.length===page.limit?items.at(-1).id:null});});
 router.use('/admin/data/label-runs/:id',(req,res,next)=>/^[a-f0-9-]{36}$/.test(req.params.id)?next():res.status(400).json({error:'invalid_run_id'}));
 router.get('/admin/data/label-runs/:id',async(req,res)=>{const run=await labeler.get(req.params.id);run?res.json(run):res.status(404).json({error:'run_not_found'});});
 router.get('/admin/data/label-runs/:id/events',async(req,res)=>{const page=pageQuery(req);if(!page)return res.status(400).json({error:'invalid_pagination'});const items=await labeler.eventPage(req.params.id,page.after,page.limit);res.json({items,next_cursor:items.length===page.limit?items.at(-1).id:null});});
 router.post('/admin/data/label-runs/:id/control',async(req,res)=>{
  if(!['resume','cancel'].includes(req.body?.action))return res.status(422).json({error:'invalid_run_action'});
  try{if(!await labeler.control(req.params.id,req.body.action))return res.status(409).json({error:'run_state_changed'});await security.audit(req.principal.account_id,'LABEL_RUN_'+req.body.action.toUpperCase(),req.params.id);res.json(await labeler.get(req.params.id));}
  catch(error){if(error.code==='label_run_active')return res.status(409).json({error:error.code});throw error;}
 });
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
  const job=await operation(db,'jobs.get',()=>db.prepare('SELECT * FROM data_sync_jobs WHERE job_key=? AND resource_type=?')).get('knowledge:'+id,'knowledge');
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
