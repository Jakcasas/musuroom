import { Router } from 'express';
import { dataJobs,projectDocument,dataStatus } from '../services/data-projections.mjs';
import { knowledgeDecisionRequest,createKnowledgeClassifier } from '../services/knowledge-decisions.mjs';
import { rateLimit } from '../security/rate-limit.mjs';
export function dataRouter(db,security,config,fetchImpl) {
 const router=Router(),classify=createKnowledgeClassifier(config,fetchImpl);
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
 router.post('/admin/data/jev-preview',async(req,res)=>{const item=await document(req);if(!item)return res.status(404).json({error:'article_not_found'});res.json({request:knowledgeDecisionRequest(item,config.jevModel),notice:'Chỉ gửi nội dung bài tri thức này khi bạn chọn phân loại. Không chứa khóa API.'});});
 router.post('/admin/data/classify',rateLimit(5,'classification_rate_limit'),async(req,res)=>{
  if(req.body?.allow_remote!==true)return res.status(422).json({error:'remote_consent_required'});
  const item=await document(req);if(!item)return res.status(404).json({error:'article_not_found'});
  res.json({article_id:item.resource_id,...await classify(item)});
 });
 return router;
}
