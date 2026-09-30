import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createApp } from '../backend/app.mjs';
import { loadConfig } from '../backend/config.mjs';
import { openDatabase } from '../backend/db/database.mjs';
import { createAssistant } from '../backend/services/assistant.mjs';
import { articles } from '../dist/knowledge-data.js';
import { defaults } from '../dist/core.js';
import { searchArticles } from '../dist/core.js';
import { request } from 'node:http';
const testToken = 'test-only-token-'.repeat(4);
const config = extra => loadConfig({ DATABASE_PATH: ':memory:', API_WRITE_TOKEN: testToken, ...extra });
async function api(t, overrides = {}) {
  const server = createApp({ config: config(overrides) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return { origin, get: (path, options) => fetch(origin + path, options), post: (path, body, headers = {}) => fetch(origin + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }) };
}
test('Config validates port, local binding, token and AI configuration', () => {
  for (const extra of [{ PORT: '0' }, { PORT: 'not-a-port' }, { HOST: '0.0.0.0' }, { AI_PROVIDER: 'unknown' }, { AI_PROVIDER: 'openrouter' }, { API_WRITE_TOKEN: 'short' }]) assert.throws(() => config(extra));
  assert.equal(config().provider, 'disabled');
});
test('Migrations and seeds are idempotent; database persists and enforces foreign keys', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'musuroom-test-'));
  try {
    const path = resolve(directory, 'test.sqlite');
    let db = openDatabase(path);
    db.prepare('UPDATE knowledge_articles SET title=? WHERE id=?').run('Persisted test title', 'umami');
    assert.throws(() => db.prepare('DELETE FROM sources WHERE id=?').run(2));
    db.close(); db = openDatabase(path);
    assert.equal(db.prepare('SELECT count(*) n FROM knowledge_articles').get().n, 6);
    assert.equal(db.prepare('SELECT title FROM knowledge_articles WHERE id=?').get('umami').title, 'Persisted test title');
    assert.equal(db.prepare('SELECT count(*) n FROM schema_migrations').get().n, 1);
    db.close();
  } finally { rmSync(directory, { recursive: true }); }
});
test('Knowledge API reads sources from database and handles invalid queries', async t => {
  const a = await api(t);
  const result = await (await a.get('/api/knowledge?q=hoat%20do%20nuoc')).json();
  assert.deepEqual(result.items.map(x => x.id), ['hoat-do-nuoc']);
  assert.ok(result.items[0].url.startsWith('https://www.fda.gov/'));
  assert.equal((await a.get('/api/knowledge/missing')).status, 404);
  assert.equal((await a.get('/api/knowledge?q=a&q=b')).status, 400);
  assert.equal((await (await a.get('/api/knowledge?q=%27%20OR%201%3D1')).json()).total, searchArticles(articles, "' OR 1=1").length);
  const status = await (await a.get('/api/status')).json();
  assert.equal(status.aiEnabled, false);
  assert.ok(!JSON.stringify(status).includes(testToken));
});
test('Batch API requires token, calculates on server and saves a retrievable row', async t => {
  const a = await api(t); const auth = { Authorization: `Bearer ${testToken}` };
  assert.equal((await a.post('/api/batches', { ...defaults, name: 'Mẻ thử' })).status, 401);
  assert.equal((await a.get('/api/batches')).status, 401);
  assert.equal((await a.post('/api/batches', { ...defaults, name: 'Mẻ thử', mass: -1 }, auth)).status, 422);
  assert.equal((await a.post('/api/batches', { ...defaults, name: 'Mẻ thử', initial: '88' }, auth)).status, 422);
  const created = await a.post('/api/batches', { ...defaults, name: 'Mẻ thử', powder: 999 }, auth);
  assert.equal(created.status, 201);
  const row = await created.json();
  assert.ok(Math.abs(row.powder_kg - 11.152173913043478) < 1e-9);
  assert.equal((await (await a.get(`/api/batches/${row.id}`, { headers: auth })).json()).name, 'Mẻ thử');
  assert.equal((await (await a.get('/api/batches?limit=1', { headers: auth })).json()).items.length, 1);
  assert.equal((await a.get('/api/batches?limit=10000', { headers: auth })).status, 400);
});
test('API rejects cross-origin writes, malformed/large payloads and rate-limits chat', async t => {
  const a = await api(t, { CHAT_REQUESTS_PER_MINUTE: '1' });
  assert.equal((await a.post('/api/chat', { question: 'Umami là gì?' }, { Origin: 'https://example.org' })).status, 403);
  const invalidHost = await new Promise((resolve, reject) => { const req = request(a.origin + '/api/status', { headers: { Host: 'evil.example' } }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); req.end(); });
  assert.equal(invalidHost, 403);
  assert.equal((await a.get('/.env')).status, 403);
  assert.equal((await a.get('/data/musuroom.sqlite')).status, 404);
  assert.equal((await a.post('/api/chat', { question: 'x'.repeat(17000) })).status, 413);
  assert.equal((await a.get('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })).status, 400);
  assert.equal((await a.get('/api/chat', { method: 'POST', body: 'question=umami' })).status, 415);
  assert.equal((await a.post('/api/chat', { question: '' })).status, 422);
  const answer = await (await a.post('/api/chat', { question: 'Umami là gì?' })).json();
  assert.equal(answer.mode, 'retrieval'); assert.ok(answer.sources.some(s => s.id === 'umami'));
  assert.equal((await a.post('/api/chat', { question: 'Umami là gì?' })).status, 429);
});
test('AI uses retrieved context; provider failure or invalid citations fall back safely', async () => {
  const c = config({ AI_PROVIDER: 'openrouter', OPENROUTER_API_KEY: 'test-key', AI_MODEL: 'test/model' });
  const repo = { all: () => articles };
  let payload;
  const assistant = createAssistant(c, repo, async (url, options) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    payload = JSON.parse(options.body);
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'Nghiên cứu trên chân nấm hương xem xét nguyên liệu tăng vị umami. [2]' } }] }) };
  });
  const answer = await assistant('Umami là gì?');
  assert.equal(answer.mode, 'ai'); assert.deepEqual(answer.sources.map(s => s.ref), [2]);
  assert.ok(payload.messages[1].content.includes('limitation'));
  assert.ok(!payload.messages[1].content.includes('test-key'));
  for (const mock of [async () => ({ ok: false }), async () => { throw new Error('timeout'); }, async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'Fake citation [999]' } }] }) })]) {
    const result = await createAssistant(c, repo, mock)('Umami là gì?');
    assert.equal(result.mode, 'retrieval'); assert.ok(result.sources.length);
  }
  const noMatch = await createAssistant(c, repo, () => { throw new Error('must not call'); })('qzx987');
  assert.equal(noMatch.reason, 'no_matches'); assert.equal(noMatch.sources.length, 0);
});
