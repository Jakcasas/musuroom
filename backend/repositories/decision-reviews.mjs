import { operation } from '../db/operation.mjs';
import { randomUUID } from 'node:crypto';
export function decisionReviews(db) {
 return {
  async save(document,decision) {
   const version=randomUUID();
   await operation(db,'reviews.save',()=>db.prepare(`INSERT INTO knowledge_decision_reviews(article_id,source_revision,content_hash,decision_version,decision_json,review_status,updated_at) VALUES(?,?,?,?,?,'pending',?) ON CONFLICT(article_id) DO UPDATE SET source_revision=excluded.source_revision,content_hash=excluded.content_hash,decision_version=excluded.decision_version,decision_json=excluded.decision_json,review_status='pending',updated_at=excluded.updated_at,reviewed_at=NULL WHERE knowledge_decision_reviews.source_revision<=excluded.source_revision`)).run(document.resource_id,document.source_revision,document.content_hash,version,JSON.stringify(decision),new Date().toISOString());
   return version;
  },
  async list(after='',limit=25,filter='all') {
   if(typeof after!=='string'||after.length>100||!Number.isInteger(limit)||limit<1||limit>100||!['all','pending','confirmed','rejected','stale'].includes(filter))throw new Error('Invalid review pagination');
   const condition=filter==='stale'?' AND r.source_revision<>j.revision':filter==='all'?'':' AND r.review_status=?';
   const rows=await operation(db,`reviews.list:${filter}`,()=>db.prepare(`SELECT r.*,a.title,j.revision AS current_revision FROM knowledge_decision_reviews r JOIN knowledge_articles a ON a.id=r.article_id JOIN data_sync_jobs j ON j.job_key=('knowledge:' || r.article_id) WHERE r.article_id>?${condition} ORDER BY r.article_id LIMIT ?`)).all(after,...(['all','stale'].includes(filter)?[]:[filter]),limit);
   return rows.map(({decision_json,...row})=>({...row,decision:JSON.parse(decision_json),stale:row.source_revision!==row.current_revision}));
  },
  async review(articleId,version,status) {
   return (await operation(db,'reviews.review',()=>db.prepare(`UPDATE knowledge_decision_reviews SET review_status=?,reviewed_at=? WHERE article_id=? AND decision_version=? AND review_status='pending' AND source_revision=(SELECT revision FROM data_sync_jobs WHERE job_key=('knowledge:' || knowledge_decision_reviews.article_id))`)).run(status,new Date().toISOString(),articleId,version)).changes===1;
  }
 };
}
