import { Router } from 'express';
import { sensoryRepository } from '../repositories/sensory.mjs';
import { leadsRepository } from '../repositories/leads.mjs';
import { codePattern, sensoryMetrics, sensoryCsv, validateSensory } from '../services/sensory-metrics.mjs';
import { validateRegistration } from '../services/sample-registration.mjs';
import { createSensoryInterpreter } from '../services/sensory-insights.mjs';
import { rateLimit } from '../security/rate-limit.mjs';

const statuses = ['PENDING','SENT','FEEDBACK_RECEIVED','CANCELLED'];
function filters(input) {
  const session = input?.session_code;
  const sample = input?.sample_code;
  return typeof session === 'string' && codePattern.test(session) && typeof sample === 'string' && codePattern.test(sample)
    ? { session, sample } : null;
}
function pagination(input) {
  const limit = Number(input.limit ?? 20);
  const offset = Number(input.offset ?? 0);
  return Number.isInteger(limit) && limit >= 1 && limit <= 100 && Number.isInteger(offset) && offset >= 0 && offset <= 1000000 ? { limit, offset } : null;
}
export function v1Router(db, authorize, config, fetchImpl, reviewer = authorize) {
  const router = Router();
  const sensory = sensoryRepository(db);
  const leads = leadsRepository(db);
  const interpret = createSensoryInterpreter(config, fetchImpl);
  const throttle = rateLimit(60, 'submission_rate_limit');
  router.post('/sensory/submit', throttle, async (req, res) => {
    const { input, errors } = validateSensory(req.body);
    if (Object.keys(errors).length) return res.status(422).json({ errors });
    const result = await sensory.submit(input);
    if (result.conflict) return res.status(409).json({ error: 'submission_key_conflict' });
    res.status(result.repeated ? 200 : 201).json({ id: result.row.id, session_code: result.row.session_code, sample_code: result.row.sample_code, submitted_at: result.row.created_at, repeated: result.repeated });
  });
  router.get('/sensory/analytics', reviewer, async (req, res) => {
    const selected = filters(req.query);
    if (!selected) return res.status(400).json({ error: 'session_code_and_sample_code_required' });
    res.json(sensoryMetrics(await sensory.list(selected.session, selected.sample), selected.session, selected.sample));
  });
  router.post('/sensory/export', reviewer, async (req, res) => {
    const selected = filters(req.body);
    if (!selected) return res.status(422).json({ error: 'session_code_and_sample_code_required' });
    const csv = sensoryCsv(await sensory.list(selected.session, selected.sample));
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="sensory-${selected.session}-${selected.sample}.csv"` }).send(csv);
  });
  router.post('/sensory/insights', reviewer, async (req, res) => {
    const selected = filters(req.body);
    if (!selected) return res.status(422).json({ error: 'session_code_and_sample_code_required' });
    const metrics = sensoryMetrics(await sensory.list(selected.session, selected.sample), selected.session, selected.sample);
    res.json(await interpret(metrics));
  });
  router.post('/leads/register', throttle, async (req, res) => {
    const { input, errors } = validateRegistration(req.body);
    if (Object.keys(errors).length) return res.status(422).json({ errors });
    const result = await leads.register(input);
    res.status(result.repeated ? 200 : 201).json({ id: result.id, status: result.status, repeated: result.repeated, message: 'Đã tiếp nhận đăng ký. Musuroom sẽ liên hệ nếu có đợt mẫu thử phù hợp.' });
  });
  router.get('/admin/leads', authorize, async (req, res) => {
    const page = pagination(req.query);
    const status = req.query.status;
    if (!page || (status !== undefined && (typeof status !== 'string' || !statuses.includes(status)))) return res.status(400).json({ error: 'invalid_query' });
    res.json({ items: await leads.list(status, page.limit, page.offset), ...page });
  });
  router.patch('/admin/leads/:id', authorize, async (req, res) => {
    const status = req.body?.status;
    if (!statuses.includes(status)) return res.status(422).json({ error: 'invalid_status' });
    if (!await leads.get(req.params.id)) return res.status(404).json({ error: 'request_not_found' });
    const row = await leads.updateStatus(req.params.id, status);
    res.json({ id: row.id, status: row.status, updated_at: row.updated_at });
  });
  router.delete('/admin/leads/:id', authorize, async (req, res) => {
    if (!await leads.remove(req.params.id)) return res.status(404).json({ error: 'request_not_found' });
    res.status(204).end();
  });
  return router;
}
