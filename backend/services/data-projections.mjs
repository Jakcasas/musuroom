import { operation } from '../db/operation.mjs';
import { createHash } from 'node:crypto';
import { sensoryRepository } from '../repositories/sensory.mjs';
import { sensoryMetricsFromDistribution } from './sensory-metrics.mjs';
import { releaseInfo } from '../version.mjs';
export const dataTypes=['knowledge','sensory','product'];
export async function projectDocument(db,job,source) {
 let data=null;
 if(job.resource_type==='knowledge'){
  const row=await operation(db,'knowledge.project',()=>db.prepare('SELECT a.id,a.title,a.category,a.summary,a.body,a.application,a.limitation,a.tags_json,s.id AS ref,s.citation,s.url,s.publication_year,s.access_scope FROM knowledge_articles a JOIN sources s ON s.id=a.source_id WHERE a.id=?')).get(job.resource_id);
  if(row){const{tags_json,...rest}=row;data={...rest,tags:JSON.parse(tags_json)};}
 }else if(job.resource_type==='sensory'){
  const[session,sample]=job.resource_id.split(':');
  const metrics=sensoryMetricsFromDistribution(await sensoryRepository(db).distribution(session,sample),session,sample);
  if(metrics.count)data=metrics;
 }else if(job.resource_type==='product'){
  const row=await operation(db,'products.project',()=>db.prepare("SELECT p.id,p.sample_code,p.label,p.origin,p.process_notes,p.metrics_json,p.nutrition_json,p.measured_at FROM product_samples p JOIN quality_documents d ON d.id=p.evidence_document_id WHERE p.id=? AND p.publication_status='PUBLIC' AND d.evidence_status='FINAL' AND d.doc_type IN ('COA','REPORT')")).get(job.resource_id);
  if(row){const{metrics_json,nutrition_json,...rest}=row;data={...rest,metrics:JSON.parse(metrics_json),nutrition:JSON.parse(nutrition_json),nutrition_basis:'per 100 g'};}
 }else throw new Error('Unsupported data type');
 const payload={type:job.resource_type,resource_id:job.resource_id,active:data!==null,data};
 return{_id:source+':'+job.job_key,source,...payload,schema_version:1,source_revision:job.revision,content_hash:createHash('sha256').update(JSON.stringify(payload)).digest('hex'),app_version:releaseInfo.version,projected_at:new Date().toISOString()};
}
export function dataJobs(db,{after='',limit=25,type,pending=false}={}) {
 if(!Number.isInteger(limit)||limit<1||limit>100||typeof after!=='string'||after.length>250||(type&&!dataTypes.includes(type)))throw new Error('Invalid data pagination');
 return operation(db,`jobs.list:${type||""}:${pending}`,()=>db.prepare('SELECT job_key,resource_type,resource_id,revision,synced_revision FROM data_sync_jobs WHERE job_key>?'+(type?' AND resource_type=?':'')+(pending?' AND synced_revision<revision':'')+' ORDER BY job_key LIMIT ?')).all(after,...(type?[type]:[]),limit);
}
export async function dataStatus(db,config) {
 const counts=await operation(db,'jobs.counts',()=>db.prepare('SELECT count(*) AS total,sum(CASE WHEN synced_revision<revision THEN 1 ELSE 0 END) AS pending FROM data_sync_jobs')).get();
 const state=await operation(db,'jobs.state',()=>db.prepare("SELECT last_completed_at,last_error_code,last_synced_count FROM data_sync_state WHERE id='mongo'")).get();
 return{mongo_enabled:config.mongoEnabled,atlas_labeling_supported:db.dialect==='mongodb',jev_enrichment:config.mongoEnrichment,source:config.mongoSource,total:Number(counts.total),pending:Number(counts.pending||0),...state};
}
