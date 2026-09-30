import test from 'node:test';
import assert from 'node:assert/strict';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { publicLinks,qrAssets } from '../scripts/generate-qr.mjs';
import { createJevClassifier } from '../backend/services/jev.mjs';
import { loadConfig } from '../backend/config.mjs';
test('Print QR decodes exactly to public survey/judge links with no access code',async()=>{
 for(const base of ['http://localhost:8766','https://user:secret@example.com','https://example.com?access_code=secret','https://example.com/subpath'])assert.throws(()=>publicLinks(base));
 const links=publicLinks('https://musuroom.example');for(const url of Object.values(links)){const{png,svg}=await qrAssets(url);const image=PNG.sync.read(png);assert.equal(jsQR(new Uint8ClampedArray(image.data),image.width,image.height).data,url);assert.match(svg,/viewBox=/);assert.ok(!url.includes('access_code'));}
});
test('Jev only retries transient errors with one total deadline; auth errors do not retry',async()=>{
 const config=loadConfig({JEV_ENABLED:'true',TYPESAFE_API_KEY:'mock-key'});let calls=0;let signal;
 const answer={model:'jev-test',answers:{topic:{type:'choice',choice:'aroma',confidence:0.8,probabilities:{color:0.04,aroma:0.8,umami:0.04,aftertaste:0.04,overall:0.04,other:0.04}}}};
 const classify=createJevClassifier(config,async(url,options)=>{calls++;if(!signal)signal=options.signal;else assert.equal(signal,options.signal);return calls===1?new Response('',{status:429,headers:{'Retry-After':'0'}}):Response.json(answer);});
 assert.equal((await classify('Mùi thơm dễ chịu',true)).model,'jev-test');assert.equal(calls,2);
 calls=0;assert.equal((await createJevClassifier(config,async()=>{calls++;return new Response('',{status:401});})('Mùi thơm',true)).reason,'provider_unavailable');assert.equal(calls,1);
});
