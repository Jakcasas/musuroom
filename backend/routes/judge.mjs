import { operation } from '../db/operation.mjs';
import { Router } from 'express';
import { extname } from 'node:path';
import { createHash } from 'node:crypto';
import { createJevClassifier } from '../services/jev.mjs';
import { jevConnectionStatus } from '../services/jev-client.mjs';
import { documentStorage } from '../services/document-storage.mjs';
import { rateLimit } from '../security/rate-limit.mjs';
export function judgeRouter(db, security, config, fetchImpl) {
  const router = Router(); const classify = createJevClassifier(config, fetchImpl);const storage=documentStorage(config,fetchImpl,db);
  router.post('/auth/login', security.login);
  router.post('/judge/verify', security.login);
  router.get('/auth/session', security.session);
  router.post('/auth/logout', security.requireReviewer, security.logout);
  router.get('/judge/jev/status',security.requireReviewer,(req,res)=>res.json(jevConnectionStatus(config)));
  router.post('/admin/jev/check',security.requireAdmin,rateLimit(2,'jev_diagnostic_rate_limit'),async(req,res)=>{
    if(req.body?.allow_remote!==true)return res.status(422).json({error:'explicit_remote_consent_required'});
    const result=await classify('Nhận xét minh họa kiểm tra kết nối Musuroom: mùi nấm thơm.',true);
    res.json({connection:jevConnectionStatus(config),verification:{mode:result.mode,reason:result.reason||null,requires_review:result.requires_review},notice:'Chỉ gửi câu minh họa cố định, không gửi hồ sơ hoặc dữ liệu của người thử. Kiểm tra có thể dùng một lượt Jev.'});
  });
  router.get('/judge/dossier', security.requireReviewer, async (req,res) => {
    const documents = await operation(db,'documents.list',()=>db.prepare('SELECT id,title,doc_type,mime,size_bytes,sha256,evidence_status,created_at FROM quality_documents ORDER BY created_at DESC,id')).all();
    res.json({ project: { brand: 'Musuroom', title: 'Phát triển bột gia vị từ phụ phẩm nấm ăn để giảm lãng phí thực phẩm', stage: 'Nghiên cứu và hoàn thiện', note: 'Hồ sơ chỉ thể hiện tài liệu đã được người vận hành cung cấp. Chưa công bố công thức hoặc chứng nhận khi chưa có minh chứng.' }, documents: documents.map(d=>({...d,download_url:`/api/v1/judge/documents/${d.id}`})), jev_enabled: config.jevEnabled });
  });
  router.get('/judge/groups', security.requireReviewer, async (req,res) => res.json({ items: await operation(db,'sensory.groups',()=>db.prepare('SELECT session_code,sample_code,count(*) AS count,max(created_at) AS latest_at FROM sensory_evaluations GROUP BY session_code,sample_code ORDER BY latest_at DESC')).all() }));
  router.get('/judge/documents/:id', security.requireReviewer, async (req,res) => {
    const doc = await operation(db,'documents.get',()=>db.prepare('SELECT * FROM quality_documents WHERE id=?')).get(req.params.id);
    if (!doc) return res.status(404).json({ error:'document_not_found' });
    if (!/^[0-9a-f-]{36}\.(pdf|txt|csv|docx|xlsx|png|jpg|webp|mp4)$/.test(doc.file_name)) return res.status(403).json({ error:'invalid_document_path' });
    try {
      const body = await storage.read(doc.file_name);
      if (body.length !== doc.size_bytes || createHash('sha256').update(body).digest('hex') !== doc.sha256) return res.status(409).json({error:'document_integrity_changed'});
      await security.audit(req.principal.account_id,'DOCUMENT_DOWNLOAD',doc.id);
      res.set({ 'Content-Type':doc.mime, 'Content-Disposition':`attachment; filename="musuroom-${doc.id}${extname(doc.file_name)}"`, 'Cache-Control':'no-store' }).send(body);
    } catch { res.status(404).json({error:'document_file_unavailable'}); }
  });
  router.post('/judge/classify', security.requireReviewer, rateLimit(config.chatLimit,'rate_limit_exceeded'), async (req,res) => {
    const comment=req.body?.comment;
    if (typeof comment !== 'string' || comment.trim().length<3 || comment.length>1000) return res.status(422).json({error:'comment_must_be_3_to_1000_characters'});
    res.json(await classify(comment.trim(),req.body.allow_remote===true));
  });
  return router;
}
