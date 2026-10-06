import express from 'express';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { loadConfig, projectRoot } from './config.mjs';
import { openDatabase } from './db/database.mjs';
import { knowledgeRepository } from './repositories/knowledge.mjs';
import { batchRepository } from './repositories/batches.mjs';
import { createAssistant } from './services/assistant.mjs';
import { createModelGateway } from './services/model-gateway.mjs';
import { releaseInfo } from './version.mjs';
import { v1Router } from './routes/v1.mjs';
import { bootstrapAccessAccounts, createSecurity } from './security/auth.mjs';
import { judgeRouter } from './routes/judge.mjs';
import { projectRouter } from './routes/project.mjs';
import { dataRouter } from './routes/data.mjs';
import { researchRouter } from './routes/research.mjs';
import { vectorRouter } from './routes/vectors.mjs';
import { createKnowledgeReranker } from './services/knowledge-reranker.mjs';
import { rateLimit } from './security/rate-limit.mjs';
import { calculate } from '../dist/core.js';
export function createApplication({ config = loadConfig(), database, fetchImpl } = {}) {
  if(config.databaseProvider==='postgres' && !database)throw new Error('Open configured Postgres database before creating application');
  const db = database || openDatabase(config.databasePath);
  const bootstrapPromise = bootstrapAccessAccounts(db, config);
  const app = express();
  app.disable('x-powered-by');
  if(config.production)app.set('trust proxy',1);
  app.use(async (req, res, next) => {
    try { await bootstrapPromise; next(); }
    catch { res.status(503).json({ error: 'access_bootstrap_failed' }); }
  });
  const knowledge = knowledgeRepository(db);
  const batches = batchRepository(db);
  const complete = createModelGateway(config, fetchImpl);
  const answer = createAssistant(config, knowledge, fetchImpl, complete);
  const rerank = createKnowledgeReranker(config,fetchImpl);
  app.locals.db = db;
  app.locals.bootstrapPromise = bootstrapPromise;
  const security = createSecurity(db,config);
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store', 'X-Frame-Options':'DENY', 'Permissions-Policy':'camera=(), microphone=(), geolocation=()', 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'; object-src 'none'" });
    if(app.locals.draining)return res.status(503).set('Retry-After','1').json({error:'service_restarting'});
    let path;
    try { path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { return res.status(400).json({ error: 'invalid_url' }); }
    if (path.includes('\0') || path.includes('\\') || path.split('/').some(part => part.startsWith('.'))) return res.status(403).json({ error: 'forbidden_path' });
    const host = (req.headers.host || '').split(':')[0];
    if(config.production){
      res.set('Strict-Transport-Security','max-age=31536000');
      const expected=new URL(config.publicOrigin);
      if(req.path!=='/healthz' && req.headers.host!==expected.host)return res.status(403).json({error:'invalid_host'});
      if(req.path!=='/healthz' && !req.secure)return res.status(403).json({error:'https_required'});
    }else if (!['127.0.0.1', 'localhost'].includes(host)) return res.status(403).json({ error: 'invalid_host' });
    if (req.headers.origin) {
      try { const origin = new URL(req.headers.origin); if (origin.origin !== (config.production?config.publicOrigin:`http://${req.headers.host}`)) return res.status(403).json({ error: 'cross_origin_forbidden' }); }
      catch { return res.status(403).json({ error: 'invalid_origin' }); }
    }
    next();
  });
  app.use('/api', (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) return res.status(415).json({ error: 'json_required' });
    next();
  });
  app.use(express.json({ limit: '16kb', strict: true }));
  app.get('/healthz', async (req, res) => {
    try{await db.prepare('SELECT 1').get();res.json({...releaseInfo,database:'ok'});}
    catch{res.status(503).json({...releaseInfo,database:'unavailable'});}
  });
  app.get('/api/status', async (req, res) => res.json({ ...releaseInfo, aiEnabled: config.provider !== 'disabled', mode: config.provider === 'disabled' ? 'retrieval' : 'ai', articleCount: (await knowledge.all()).length }));
  app.post('/api/knowledge/rerank',rateLimit(5,'search_rate_limit'),async(req,res)=>{
    const {query,category='',allow_remote}=req.body||{};
    if(typeof query!=='string'||query.trim().length<2||query.length>200||typeof category!=='string'||category.length>100||typeof allow_remote!=='boolean')return res.status(422).json({error:'invalid_rerank_request'});
    res.json(await rerank(query.trim(),await knowledge.search(query.trim(),category),allow_remote));
  });
  app.get('/api/knowledge', async (req, res) => {
    const q = req.query.q ?? ''; const category = req.query.category ?? '';
    if (typeof q !== 'string' || q.length > 200 || typeof category !== 'string' || category.length > 100) return res.status(400).json({ error: 'invalid_query' });
    const all = await knowledge.all(); const items = await knowledge.search(q, category);
    res.json({ items, total: items.length, categories: [...new Set(all.map(a => a.category))] });
  });
  app.get('/api/knowledge/:id', async (req, res) => { const item = await knowledge.get(req.params.id); item ? res.json(item) : res.status(404).json({ error: 'article_not_found' }); });
  app.post('/api/estimate', (req, res) => { const result = calculate(req.body || {}); res.status(Object.keys(result.errors).length ? 422 : 200).json(result); });
  const authorize = security.requireAdmin;
  app.use('/api/batches', authorize);
  app.get('/api/batches', async (req, res) => {
    const limit = Number(req.query.limit ?? 20); const offset = Number(req.query.offset ?? 0);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0 || offset > 1000000) return res.status(400).json({ error: 'invalid_pagination' });
    res.json({ items: await batches.list(limit, offset), limit, offset });
  });
  app.get('/api/batches/:id', async (req, res) => { const row = await batches.get(req.params.id); row ? res.json(row) : res.status(404).json({ error: 'batch_not_found' }); });
  app.post('/api/batches', async (req, res) => {
    const body = req.body || {};
    const result = calculate(body);
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120) result.errors.name = 'Tên mẻ cần từ 1–120 ký tự.';
    if (body.notes !== undefined && (typeof body.notes !== 'string' || body.notes.length > 2000)) result.errors.notes = 'Ghi chú tối đa 2.000 ký tự.';
    if (Object.keys(result.errors).length) return res.status(422).json({ errors: result.errors });
    const row = await batches.create({ ...body, name: body.name.trim() }, result);
    res.status(201).location(`/api/batches/${row.id}`).json(row);
  });
  app.post('/api/chat', (req,res,next)=>{
    const question = req.body?.question;
    if (typeof question !== 'string' || question.trim().length < 2 || question.length > 1000) return res.status(422).json({ error: 'question_must_be_2_to_1000_characters' });
    next();
  },rateLimit(config.chatLimit,'rate_limit_exceeded'),async(req,res)=>{
    res.json(await answer(req.body.question.trim()));
  });
  app.use('/api/v1', judgeRouter(db,security,config,fetchImpl));
  app.use('/api/v1', projectRouter(db,security,config));
  app.use('/api/v1', dataRouter(db,security,config,fetchImpl));
  app.use('/api/v1', researchRouter(db,security,config));
  app.use('/api/v1', vectorRouter(db,security));
  app.use('/api/v1', v1Router(db, authorize, config, fetchImpl, security.requireReviewer, complete));
  app.use('/api', (req, res) => res.status(404).json({ error: 'endpoint_not_found' }));
  app.use((req, res, next) => ['GET', 'HEAD'].includes(req.method) ? next() : res.status(405).set('Allow', 'GET, HEAD').json({ error: 'method_not_allowed' }));
  app.use(express.static(resolve(projectRoot, 'dist'), { dotfiles: 'deny', index: 'index.html',setHeaders:(res,path)=>{if(/[/\\]assets[/\\]/.test(path))res.setHeader('Cache-Control','public, max-age=86400');} }));
  app.use((req, res) => res.status(404).type('text').send('Không tìm thấy trang'));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    res.status(status).json({ error: status === 413 ? 'body_too_large' : status === 400 ? 'invalid_json' : 'internal_error' });
  });
  return app;
}
export function createApp(options) {
  const app = createApplication(options);
  const server = createServer(app);
  server.setDraining=()=>{app.locals.draining=true;};
  server.databaseClosed = new Promise((resolve,reject)=>server.once('close',()=>Promise.resolve().then(async()=>{try{await server.stopDataWorker?.();}finally{await app.locals.db.close();}}).then(resolve,reject)));
  return server;
}
