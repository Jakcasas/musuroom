import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../backend/config.mjs';
import { createApp } from '../backend/app.mjs';
import { createModelGateway } from '../backend/services/model-gateway.mjs';
import { assistantContext } from '../backend/services/assistant-context.mjs';
import { createAssistant } from '../backend/services/assistant.mjs';
import { sensoryMetrics, sensoryMetricsFromDistribution, criteria } from '../backend/services/sensory-metrics.mjs';
import { sensoryRepository } from '../backend/repositories/sensory.mjs';
import { openDatabase } from '../backend/db/database.mjs';
import { articles } from '../dist/knowledge-data.js';

const token = 'optimization-test-token-'.repeat(3);
const config = extra => loadConfig({ DATABASE_PATH: ':memory:', API_WRITE_TOKEN: token, AI_PROVIDER: 'openrouter', OPENROUTER_API_KEY: 'mock-key', AI_MODEL: 'mock/model', ...extra });
const completion = (content = 'Có tài liệu phù hợp. [2]', finish_reason = 'stop') => Response.json({ choices: [{ finish_reason, message: { content } }] });
const prompt = { temperature: 0.2, messages: [{ role: 'user', content: 'test' }] };

test('Context budget bounds escaped Unicode documents while retaining provenance and limitations', async () => {
  const large = articles.slice(0, 3).map(a => ({ ...a, body: 'Nội dung \\" 🍄 '.repeat(10000) }));
  for (const limit of [3000, 12000, 24000]) {
    const context = assistantContext(large, limit);
    assert.ok(JSON.stringify(context).length <= limit);
    assert.deepEqual(context.map(a => a.ref), large.map(a => a.ref));
    assert.ok(context.every(a => a.truncated && a.limitation === large.find(x => x.ref === a.ref).limitation));
    assert.ok(context.every(a => !/[\uD800-\uDBFF]$/.test(a.body)));
  }
  assert.deepEqual(assistantContext([]), []);
  let payload;
  const assistant = createAssistant(config({ AI_CONTEXT_MAX_CHARS: '3000' }), { all: () => large }, async (_, options) => {
    payload = JSON.parse(JSON.parse(options.body).messages[1].content);
    return completion('Theo tài liệu đã truy xuất. [1, 2]');
  });
  assert.equal((await assistant('nấm umami')).mode, 'ai');
  assert.ok(payload.documents.length <= 3);
  assert.ok(JSON.stringify(payload.documents).length <= 3000);
});

test('Gateway honors bounded provider cooldown without retrying or retaining request contents', async () => {
  let clock = 0;
  let calls = 0;
  const gateway = createModelGateway(config(), async (_, options) => {
    calls++;
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer mock-key');
    assert.ok(!options.body.includes('mock-key'));
    return calls === 1 ? new Response(null, { status: 429, headers: { 'Retry-After': '99999' } }) : completion();
  }, { now: () => clock });
  const failed = await gateway(prompt);
  assert.equal(failed.reason, 'provider_unavailable');
  assert.equal(failed.retry_after, 120);
  assert.equal((await gateway(prompt)).reason, 'provider_cooldown');
  assert.equal(calls, 1);
  clock = 120000;
  assert.ok((await gateway(prompt)).text);
  assert.equal(calls, 2);
});

test('Gateway rejects truncated/error completions, oversized streams, redirects and stalled response bodies', async () => {
  for (const response of [completion('Chưa hết câu [2]', 'length'), completion('Filtered [2]', 'content_filter'), Response.json({ error: { message: 'private provider detail' } }), new Response('x'.repeat(70000))]) {
    const result = await createModelGateway(config(), async () => response)(prompt);
    assert.ok(result.reason);
    assert.ok(!JSON.stringify(result).includes('private provider detail'));
  }
  assert.equal((await createModelGateway(config(), async () => { throw new Error('redirect'); })(prompt)).reason, 'provider_unavailable');
  let cancelled = false;
  const stalled = new Response(new ReadableStream({ cancel() { cancelled = true; } }));
  const gateway = createModelGateway({ ...config(), timeout: 20, aiCooldownMs: 0 }, async () => stalled);
  assert.equal((await gateway(prompt)).reason, 'provider_unavailable');
  assert.equal(cancelled, true);
});

test('Chat and authenticated insights share concurrency; unauthorized requests do not consume insights quota', async t => {
  let release;
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  const server = createApp({ config: config({ AI_MAX_CONCURRENT: '1', INSIGHTS_REQUESTS_PER_MINUTE: '1' }), fetchImpl: async () => {
    started();
    return new Promise(resolve => { release = () => resolve(completion()); });
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { release?.(); await new Promise(resolve => server.close(resolve)); await server.databaseClosed; });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, auth = false) => fetch(origin + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  for (const score of [3, 5, 7]) {
    assert.equal((await post('/api/v1/sensory/submit', { session_code: 'OPT-ROUND', sample_code: 'OPT-MUSH', tester_type: 'CONSUMER', ...Object.fromEntries(criteria.map(c => [c.key, score])), comments: 'Private raw comment' })).status, 201);
  }
  const filter = { session_code: 'OPT-ROUND', sample_code: 'OPT-MUSH' };
  assert.equal((await post('/api/v1/sensory/insights', filter)).status, 401);
  const chat = post('/api/chat', { question: 'Umami là gì?' });
  await ready;
  const insights = await (await post('/api/v1/sensory/insights', filter, true)).json();
  assert.equal(insights.reason, 'ai_busy');
  assert.equal(insights.basis.count, 3);
  assert.ok(!JSON.stringify(insights).includes('Private raw comment'));
  const limited = await post('/api/v1/sensory/insights', filter, true);
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('Retry-After')) > 0);
  release();
  assert.equal((await (await chat).json()).mode, 'ai');
});

test('Database distribution reproduces row-based statistics without transferring comments or tester IDs', async () => {
  const db = openDatabase(':memory:');
  try {
    const repo = sensoryRepository(db);
    for (let i = 0; i < 137; i++) {
      await repo.submit({ session_code: 'CHECK-ROUND', sample_code: 'CHECK-MUSH', tester_type: ['JUDGE','STUDENT','CONSUMER','OTHER'][i % 4], submission_key: null, comments: 'private-' + i, ...Object.fromEntries(criteria.map((c, j) => [c.key, (i * (j + 1) + j) % 9 + 1])) });
    }
    const groups = await repo.distribution('CHECK-ROUND', 'CHECK-MUSH');
    assert.ok(groups.length <= 49);
    assert.ok(groups.every(g => Object.keys(g).sort().join(',') === 'criterion,n,score,tester_type'));
    assert.deepEqual(sensoryMetricsFromDistribution(groups, 'CHECK-ROUND', 'CHECK-MUSH'), sensoryMetrics(await repo.list('CHECK-ROUND', 'CHECK-MUSH'), 'CHECK-ROUND', 'CHECK-MUSH'));
    assert.deepEqual(sensoryMetricsFromDistribution([], 'NONE', 'NONE'), sensoryMetrics([], 'NONE', 'NONE'));
    // A large histogram stays bounded; no expansion into individual scores is needed.
    const large = [...criteria.map(c => ({ criterion: c.key, score: 7, tester_type: null, n: 1000000 })), { criterion: 'tester_type', score: null, tester_type: 'CONSUMER', n: 1000000 }];
    const metrics = sensoryMetricsFromDistribution(large, 'BIG', 'BIG');
    assert.equal(metrics.count, 1000000);
    assert.equal(metrics.metrics.color_score.median, 7);
    assert.equal(metrics.metrics.color_score.sd, 0);
    const even = [...criteria.flatMap(c => [2, 9].map(score => ({ criterion: c.key, score, tester_type: null, n: 1 }))), { criterion: 'tester_type', score: null, tester_type: 'JUDGE', n: 2 }];
    assert.equal(sensoryMetricsFromDistribution(even, 'EVEN', 'EVEN').metrics.color_score.median, 5.5);
  } finally { db.close(); }
});

test('Configuration rejects placeholders and out-of-range cost controls', () => {
  for (const extra of [{ OPENROUTER_API_KEY: 'YOUR_OPENROUTER_API_KEY' }, { AI_MODEL: 'YOUR_OPENROUTER_MODEL_ID' }, { OPENROUTER_API_KEY: 'bad\nkey' }, { AI_MAX_CONCURRENT: '5' }, { AI_CONTEXT_MAX_CHARS: '100' }, { AI_COOLDOWN_MS: '-1' }, { INSIGHTS_REQUESTS_PER_MINUTE: '0' }]) assert.throws(() => config(extra));
  assert.equal(config({ OPENROUTER_API_KEY: ' mock-key ', AI_MODEL: ' mock/model ' }).apiKey, 'mock-key');
});
