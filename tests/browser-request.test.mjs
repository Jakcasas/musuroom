import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from '../dist/portal-ui.js';

test('Browser writes report uncertain network outcomes without retrying or exposing transport details', async t=>{
 let attempts=0;
 t.mock.method(globalThis,'fetch',async()=>{attempts++;throw new TypeError('Failed to fetch: private diagnostic');});
 await assert.rejects(request('/api/v1/sensory/submit',{method:'POST',body:{}}),error=>{
  assert.equal(error.kind,'network');assert.match(error.message,/Chưa xác nhận thao tác/);assert.doesNotMatch(error.message,/private diagnostic/);return true;
 });
 assert.equal(attempts,1);
});

test('Browser handles a timeout while reading a body and rejects malformed successful replies',async t=>{
 const mocked=t.mock.method(globalThis,'fetch',async()=>({ok:true,status:200,headers:new Headers(),json:async()=>{throw new DOMException('private timeout','TimeoutError');}}));
 await assert.rejects(request('/api/v1/auth/session'),e=>e.kind==='timeout'&&/tải lại/.test(e.message)&&!e.message.includes('private timeout'));
 mocked.mock.mockImplementation(async()=>new Response('<html>private proxy detail</html>',{headers:{'Content-Type':'text/html'}}));
 await assert.rejects(request('/api/v1/judge/verify',{method:'POST',body:{}}),e=>e.kind==='invalid_response'&&!e.message.includes('private proxy'));
});

test('Browser retains validation errors, retry guidance and authentication status for UI recovery',async t=>{
 const mocked=t.mock.method(globalThis,'fetch',async()=>Response.json({errors:{phone_or_email:'Liên hệ chưa hợp lệ'}},{status:400}));
 await assert.rejects(request('/api/v1/leads/register',{method:'POST',body:{}}),e=>e.status===400&&e.fields.phone_or_email==='Liên hệ chưa hợp lệ');
 mocked.mock.mockImplementation(async()=>Response.json({error:'login_rate_limit'},{status:429,headers:{'Retry-After':'7'}}));
 await assert.rejects(request('/api/v1/judge/verify',{method:'POST',body:{}}),e=>e.status===429&&e.message.includes('7 giây'));
 mocked.mock.mockImplementation(async()=>Response.json({error:'authentication_required'},{status:401}));
 await assert.rejects(request('/api/v1/auth/session'),e=>e.status===401);
});

test('Browser preserves JSON, CSV and empty logout responses',async t=>{
 const mocked=t.mock.method(globalThis,'fetch',async()=>Response.json({count:3}));
 assert.deepEqual(await request('/api/example'),{count:3});
 mocked.mock.mockImplementation(async()=>new Response('score\n7',{headers:{'Content-Type':'text/csv'}}));
 assert.equal(await (await request('/api/export')).text(),'score\n7');
 mocked.mock.mockImplementation(async()=>new Response(null,{status:204}));
 assert.equal(await request('/api/v1/auth/logout',{method:'POST',body:{}}),null);
});
