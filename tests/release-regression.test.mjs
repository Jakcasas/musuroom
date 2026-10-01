import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../backend/app.mjs';
import { loadConfig } from '../backend/config.mjs';
import { openDatabase } from '../backend/db/database.mjs';
import { validateSample,isMeasurementEvidence } from '../backend/routes/project.mjs';
import { validateRegistration } from '../backend/services/sample-registration.mjs';
import { leadsRepository } from '../backend/repositories/leads.mjs';
import { createJevClassifier } from '../backend/services/jev.mjs';
import { releaseInfo } from '../backend/version.mjs';
const evidence = '33333333-3333-4333-8333-333333333333';
const sample = { sample_code:'FINAL-01',label:'Measured fixture',origin:'Test supplier',measured_at:'2026-09-30',evidence_document_id:evidence,metrics:{water_activity:0.4},nutrition:{} };
const doc = db => db.prepare('INSERT INTO quality_documents(id,title,doc_type,file_name,mime,size_bytes,sha256,evidence_status) VALUES(?,?,?,?,?,?,?,?)').run(evidence,'Fixture report','COA',evidence+'.txt','text/plain',1,'test','FINAL');
const insert = db => db.prepare('INSERT INTO product_samples(id,sample_code,label,origin,metrics_json,nutrition_json,measured_at,evidence_document_id,publication_status) VALUES(?,?,?,?,?,?,?,?,?)');

test('Measured sample validation rejects inherited property names, empty measurements and non-object input', () => {
  for (const key of ['constructor','toString','__proto__','hasOwnProperty']) {
    const body = { ...sample,metrics:JSON.parse(`{"${key}":1}`) };
    assert.ok(validateSample(body).errors.metrics);
  }
  assert.ok(validateSample({ ...sample,metrics:{},nutrition:{} }).errors.measurements);
  assert.ok(validateSample({ ...sample,metrics:[1,2] }).errors.metrics);
  assert.deepEqual(validateSample(sample).errors, {});
  assert.deepEqual(validateSample({ ...sample,metrics:{},nutrition:{protein_g:12} }).errors, {});
  for (const doc_type of ['BRIEF','SOP','COGS','MEDIA']) assert.equal(isMeasurementEvidence({doc_type,evidence_status:'FINAL'}),false);
  for (const doc_type of ['COA','REPORT']) assert.equal(isMeasurementEvidence({doc_type,evidence_status:'FINAL'}),true);
  assert.equal(isMeasurementEvidence({doc_type:'COA',evidence_status:'DRAFT'}),false);
});

test('Phone formats deduplicate against both new and legacy registrations without changing existing records', async () => {
  const db = openDatabase(':memory:');
  try {
    const repository = leadsRepository(db);
    const payload = phone_or_email => ({ full_name:'Test user',phone_or_email,consent:true });
    for (const invalid of ['1.....','1234567','+1234567890123456']) assert.ok(validateRegistration(payload(invalid)).errors.phone_or_email);
    const first = validateRegistration(payload('090 123 4567')).input;
    const second = validateRegistration(payload('+84 90 123 4567')).input;
    assert.equal(first.contact_normalized, second.contact_normalized);
    const registered = await repository.register(first);
    assert.equal((await repository.register(second)).id, registered.id);
    const legacy = validateRegistration(payload('0912345678')).input;
    legacy.contact_normalized = '0912345678';
    const old = await repository.register(legacy);
    const matched = await repository.register(validateRegistration(payload('+84912345678')).input);
    assert.equal(matched.id, old.id);
    assert.equal(matched.repeated, true);
    assert.equal(db.prepare('SELECT count(*) n FROM sample_requests').get().n, 2);
    assert.equal(db.prepare('SELECT contact_normalized FROM sample_requests WHERE id=?').get(old.id).contact_normalized, '0912345678');
  } finally { db.close(); }
});

test('SQLite guards reject malformed measurement inserts and updates while preserving legitimate records', () => {
  const db = openDatabase(':memory:');
  try {
    doc(db);
    const statement = insert(db);
    for (const [metrics, nutrition] of [['[]','{}'],['{}','{}'],['{"constructor":1}','{}'],['{"water_activity":0.4}','{"unsupported":1}']]) {
      assert.throws(() => statement.run('bad','BAD-01','Fixture','Supplier',metrics,nutrition,'2026-09-30',evidence,'PRIVATE'));
    }
    statement.run('good','GOOD-01','Fixture','Supplier','{"water_activity":0.4}','{}','2026-09-30',evidence,'PRIVATE');
    assert.throws(() => db.prepare('UPDATE product_samples SET nutrition_json=? WHERE id=?').run('[]','good'));
    assert.equal(db.prepare('SELECT nutrition_json FROM product_samples WHERE id=?').get('good').nutrition_json, '{}');
  } finally { db.close(); }
});

test('Public measurements follow evidence status; runtime version and security headers are consistent', async t => {
  const db = openDatabase(':memory:'); doc(db);
  insert(db).run('public','PUB-01','Fixture','Supplier','{"water_activity":0.4}','{}','2026-09-30',evidence,'PUBLIC');
  const server = createApp({ database:db,config:loadConfig({ DATABASE_PATH:':memory:' }) });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await server.databaseClosed; });
  const url = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await (await fetch(url+'/api/v1/product/batches')).json()).count,1);
  db.prepare('UPDATE quality_documents SET evidence_status=? WHERE id=?').run('DRAFT',evidence);
  assert.equal((await (await fetch(url+'/api/v1/product/batches')).json()).count,0);
  db.prepare('UPDATE quality_documents SET evidence_status=?,doc_type=? WHERE id=?').run('FINAL','BRIEF',evidence);
  assert.equal((await (await fetch(url+'/api/v1/product/batches')).json()).count,0);
  db.prepare('UPDATE quality_documents SET doc_type=? WHERE id=?').run('REPORT',evidence);
  assert.equal((await (await fetch(url+'/api/v1/product/batches')).json()).count,1);
  const response = await fetch(url+'/healthz');
  assert.equal((await response.json()).version,releaseInfo.version);
  assert.equal((await (await fetch(url+'/api/status')).json()).version,releaseInfo.version);
  assert.ok(!response.headers.get('content-security-policy').includes('google'));
  assert.match(response.headers.get('permissions-policy'),/camera=\(\)/);
});

test('Jev bounds response size and total deadline including stalled fetch/body, and rejects redirects', async () => {
  const config = { ...loadConfig({ JEV_ENABLED:'true',JEV_API_KEY:'mock-key' }),timeout:20 };
  for (const fetchImpl of [async () => new Response('x'.repeat(70000)),async () => new Promise(() => {}),async () => new Response(new ReadableStream()),async (_, options) => { assert.equal(options.redirect,'error');throw new Error('redirect'); }]) {
    const result = await createJevClassifier(config,fetchImpl)('Mùi thơm',true);
    assert.equal(result.mode,'manual');
    assert.equal(result.reason,'provider_unavailable');
    assert.ok(!JSON.stringify(result).includes('mock-key'));
  }
});
