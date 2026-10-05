import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer,get} from 'node:http';
import {createShutdownHandler} from '../backend/services/shutdown.mjs';
import {createApp} from '../backend/app.mjs';
import {openDatabase} from '../backend/db/database.mjs';
import {loadConfig} from '../backend/config.mjs';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};

test('Shutdown preserves an in-flight response, stops the worker once and waits for resource cleanup',async t=>{
 const requestStarted=deferred(),responseReleased=deferred(),workerReleased=deferred(),exited=deferred();
 let draining=false,workerStops=0,databaseClosed=false;
 const server=createServer(async(req,res)=>{requestStarted.resolve();await responseReleased.promise;res.end('saved');});
 server.setDraining=()=>{draining=true;};
 server.stopDataWorker=async()=>{workerStops++;await workerReleased.promise;};
 server.databaseClosed=new Promise((resolve,reject)=>server.once('close',()=>Promise.resolve().then(()=>server.stopDataWorker()).then(()=>{databaseClosed=true;resolve();},reject)));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>{responseReleased.resolve();workerReleased.resolve();server.closeAllConnections();server.close();});
 const response=new Promise((resolve,reject)=>get({hostname:'127.0.0.1',port:server.address().port,agent:false},res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve(body));}).on('error',reject));
 await requestStarted.promise;
 const shutdown=createShutdownHandler(server,{exit:code=>exited.resolve(code),log:()=>{},error:()=>{}});
 shutdown();shutdown();await Promise.resolve();
 assert.equal(draining,true);assert.equal(workerStops,1);assert.equal(databaseClosed,false);
 responseReleased.resolve();assert.equal(await response,'saved');assert.equal(databaseClosed,false);
 workerReleased.resolve();assert.equal(await exited.promise,0);assert.equal(databaseClosed,true);assert.equal(workerStops,1);
});

test('Shutdown enforces a deadline and ignores repeated signals without logging private errors',async()=>{
 const exits=[],messages=[];let destroyed=0,closed=0;
 const server={close(){closed++;},closeAllConnections(){destroyed++;},databaseClosed:new Promise(()=>{})};
 const shutdown=createShutdownHandler(server,{timeoutMs:5,exit:code=>exits.push(code),log:message=>messages.push(message),error:message=>messages.push(message)});
 shutdown();shutdown();await new Promise(r=>setTimeout(r,20));shutdown();
 assert.deepEqual(exits,[1]);assert.equal(destroyed,1);assert.equal(closed,1);assert.match(messages.join(' '),/deadline/);
});

test('Readiness reports database failure and draining as 503 without returning database errors',async t=>{
 const db=openDatabase(':memory:'),prepare=db.prepare.bind(db);let fail=false;
 db.prepare=sql=>fail&&sql==='SELECT 1'?{get:()=>{throw Error('private connection password');}}:prepare(sql);
 const server=createApp({database:db,config:loadConfig({DATABASE_PATH:':memory:'})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await new Promise(r=>server.close(r));await server.databaseClosed;});
 const base='http://127.0.0.1:'+server.address().port;
 assert.equal((await fetch(base+'/healthz')).status,200);
 fail=true;const failed=await fetch(base+'/healthz');assert.equal(failed.status,503);assert.equal((await failed.json()).database,'unavailable');
 server.setDraining();const draining=await fetch(base+'/healthz');assert.equal(draining.status,503);assert.equal(draining.headers.get('Retry-After'),'1');assert.deepEqual(await draining.json(),{error:'service_restarting'});
 assert.equal((await fetch(base+'/api/status')).status,503);
});

test('Database still closes when worker cleanup rejects; shutdown returns failure without leaking its error',async()=>{
 const db=openDatabase(':memory:'),close=db.close.bind(db),exited=deferred(),messages=[];let closed=false;
 db.close=()=>{closed=true;close();};
 const server=createApp({database:db,config:loadConfig({DATABASE_PATH:':memory:'})});
 server.stopDataWorker=async()=>{throw Error('secret-worker-uri');};
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 createShutdownHandler(server,{exit:code=>exited.resolve(code),log:message=>messages.push(message),error:message=>messages.push(message)})();
 assert.equal(await exited.promise,1);assert.equal(closed,true);assert.ok(!messages.join(' ').includes('secret-worker-uri'));
});
