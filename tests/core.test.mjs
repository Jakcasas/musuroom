import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { calculate, defaults, makeCsv, normalize, searchArticles } from '../dist/core.js';
import { articles } from '../dist/knowledge-data.js';
import { createApp } from '../server.mjs';
import { loadConfig } from '../backend/config.mjs';
test('Vietnamese accents, capital Đ, combined category and empty search', () => {
  assert.equal(normalize('ĐỘ ẨM'), 'do am');
  assert.deepEqual(searchArticles(articles, 'phụ phẩm'), searchArticles(articles, 'phu pham'));
  assert.ok(searchArticles(articles, 'hoat do nuoc').some(a => a.id === 'hoat-do-nuoc'));
  assert.ok(searchArticles(articles, 'umami', 'Hương vị').every(a => a.category === 'Hương vị'));
  assert.equal(searchArticles(articles, 'qzx987').length, 0);
  assert.equal(searchArticles(articles, '').length, articles.length);
  assert.equal(searchArticles(articles, 'umami', 'Phương pháp dự án').length, 0);
  assert.equal(searchArticles(articles, '<img src=x onerror=alert(1)>').length, 0);
});
test('Each article carries provenance and stable identity', () => {
  assert.equal(new Set(articles.map(a => a.id)).size, articles.length);
  assert.equal(new Set(articles.map(a => a.ref)).size, articles.length);
  for (const a of articles) {
    for (const key of ['source', 'year', 'url', 'access', 'limitation', 'body']) assert.ok(a[key], `${a.id}: ${key}`);
    assert.ok(a.url.startsWith('https://') || a.url.startsWith('index.html#'));
  }
});
test('Mass balance: example and limiting cases', () => {
  const result = calculate(defaults);
  assert.ok(Math.abs(result.powder - 11.152173913043478) < 1e-10);
  assert.equal(result.accepted, 90);
  assert.equal(calculate({ ...defaults, reject: 100 }).powder, 0);
  assert.equal(calculate({ ...defaults, loss: 100 }).powder, 0);
  assert.equal(calculate({ mass: 100, reject: 0, initial: 8, final: 8, loss: 0 }).powder, 100);
  for (const value of [NaN, Infinity, -1, 0, 1000001]) assert.ok(calculate({ ...defaults, mass: value }).errors.mass);
  assert.ok(calculate({ ...defaults, final: 100 }).errors.final);
  assert.ok(calculate({ ...defaults, final: 90 }).errors.final);
  assert.ok(calculate({ ...defaults, reject: 101 }).errors.reject);
});
test('CSV preserves raw numbers, units and scope in UTF-8', () => {
  const csv = makeCsv(defaults, calculate(defaults));
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"100","kg"'));
  assert.ok(csv.includes('chưa gồm phối trộn'));
  assert.throws(() => makeCsv(defaults, { errors: { mass: 'invalid' } }));
});
test('HTTP: assets, HEAD, malformed URL, restricted paths and method', async t => {
  const server = createApp({ config: loadConfig({ DATABASE_PATH: ':memory:' }) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const port = server.address().port;
  const get = (path, method = 'GET') => new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, method }, res => { let body = ''; res.on('data', x => body += x); res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers })); }); req.on('error', reject); req.end();
  });
  assert.equal((await get('/')).status, 200);
  assert.equal((await get('/tri-thuc.html?q=umami')).status, 200);
  assert.match((await get('/assets/mushroom-seasoning.webp')).headers['content-type'], /image\/webp/);
  assert.equal((await get('/', 'HEAD')).body, '');
  assert.equal((await get('/%E0%A4%A')).status, 400);
  assert.equal((await get('/%2e%2e%5cserver.mjs')).status, 403);
  assert.equal((await get('/.env')).status, 403);
  assert.equal((await get('/missing')).status, 404);
  assert.equal((await get('/', 'POST')).status, 405);
  assert.equal(JSON.parse((await get('/healthz')).body).app, 'musuroom');
});
