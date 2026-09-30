import express from 'express';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { loadConfig, projectRoot } from './config.mjs';
import { openDatabase } from './db/database.mjs';
import { knowledgeRepository } from './repositories/knowledge.mjs';
import { batchRepository } from './repositories/batches.mjs';
import { createAssistant } from './services/assistant.mjs';
import { v1Router } from './routes/v1.mjs';
import { createSecurity } from './security/auth.mjs';
import { judgeRouter } from './routes/judge.mjs';
import { calculate } from '../dist/core.js';
export function createApplication({ config = loadConfig(), database, fetchImpl } = {}) {
  const db = database || openDatabase(config.databasePath);
  const app = express();
  app.disable('x-powered-by');
  const knowledge = knowledgeRepository(db);
  const batches = batchRepository(db);
  const answer = createAssistant(config, knowledge, fetchImpl);
  app.locals.db = db;
  const security = createSecurity(db,config);
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store', 'X-Frame-Options':'DENY', 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'; object-src 'none'" });
    let path;
    try { path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { return res.status(400).json({ error: 'invalid_url' }); }
    if (path.includes('\0') || path.includes('\\') || path.split('/').some(part => part.startsWith('.'))) return res.status(403).json({ error: 'forbidden_path' });
    const host = (req.headers.host || '').split(':')[0];
    if (!['127.0.0.1', 'localhost'].includes(host)) return res.status(403).json({ error: 'invalid_host' });
    if (req.headers.origin) {
      try { const origin = new URL(req.headers.origin); if (origin.origin !== `http://${req.headers.host}`) return res.status(403).json({ error: 'cross_origin_forbidden' }); }
      catch { return res.status(403).json({ error: 'invalid_origin' }); }
    }
    next();
  });
  app.use('/api', (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) return res.status(415).json({ error: 'json_required' });
    next();
  });
  app.use(express.json({ limit: '16kb', strict: true }));
  app.get('/healthz', (req, res) => { db.prepare('SELECT 1').get(); res.json({ app: 'musuroom', version: '1.3.0', database: 'ok' }); });
  app.get('/api/status', (req, res) => res.json({ app: 'musuroom', version: '1.3.0', aiEnabled: config.provider !== 'disabled', mode: config.provider === 'disabled' ? 'retrieval' : 'ai', articleCount: knowledge.all().length }));
  app.get('/api/knowledge', (req, res) => {
    const q = req.query.q ?? ''; const category = req.query.category ?? '';
    if (typeof q !== 'string' || q.length > 200 || typeof category !== 'string' || category.length > 100) return res.status(400).json({ error: 'invalid_query' });
    const all = knowledge.all(); const items = knowledge.search(q, category);
    res.json({ items, total: items.length, categories: [...new Set(all.map(a => a.category))] });
  });
  app.get('/api/knowledge/:id', (req, res) => { const item = knowledge.get(req.params.id); item ? res.json(item) : res.status(404).json({ error: 'article_not_found' }); });
  app.post('/api/estimate', (req, res) => { const result = calculate(req.body || {}); res.status(Object.keys(result.errors).length ? 422 : 200).json(result); });
  const authorize = security.requireAdmin;
  app.use('/api/batches', authorize);
  app.get('/api/batches', (req, res) => {
    const limit = Number(req.query.limit ?? 20); const offset = Number(req.query.offset ?? 0);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0 || offset > 1000000) return res.status(400).json({ error: 'invalid_pagination' });
    res.json({ items: batches.list(limit, offset), limit, offset });
  });
  app.get('/api/batches/:id', (req, res) => { const row = batches.get(req.params.id); row ? res.json(row) : res.status(404).json({ error: 'batch_not_found' }); });
  app.post('/api/batches', (req, res) => {
    const body = req.body || {};
    const result = calculate(body);
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120) result.errors.name = 'Tên mẻ cần từ 1–120 ký tự.';
    if (body.notes !== undefined && (typeof body.notes !== 'string' || body.notes.length > 2000)) result.errors.notes = 'Ghi chú tối đa 2.000 ký tự.';
    if (Object.keys(result.errors).length) return res.status(422).json({ errors: result.errors });
    const row = batches.create({ ...body, name: body.name.trim() }, result);
    res.status(201).location(`/api/batches/${row.id}`).json(row);
  });
  let windowStart = Date.now(); let requestCount = 0;
  app.post('/api/chat', async (req, res) => {
    const question = req.body?.question;
    if (typeof question !== 'string' || question.trim().length < 2 || question.length > 1000) return res.status(422).json({ error: 'question_must_be_2_to_1000_characters' });
    if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); requestCount = 0; }
    if (++requestCount > config.chatLimit) return res.status(429).set('Retry-After', '60').json({ error: 'rate_limit_exceeded' });
    res.json(await answer(question.trim()));
  });
  app.use('/api/v1', judgeRouter(db,security,config,fetchImpl));
  app.use('/api/v1', v1Router(db, authorize, config, fetchImpl, security.requireReviewer));
  app.use('/api', (req, res) => res.status(404).json({ error: 'endpoint_not_found' }));
  app.use((req, res, next) => ['GET', 'HEAD'].includes(req.method) ? next() : res.status(405).set('Allow', 'GET, HEAD').json({ error: 'method_not_allowed' }));
  app.use(express.static(resolve(projectRoot, 'dist'), { dotfiles: 'deny', index: 'index.html' }));
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
  server.on('close', () => app.locals.db.close());
  return server;
}
