import pg from 'pg';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { articles } from '../../dist/knowledge-data.js';
pg.types.setTypeParser(20,value=>{const number=Number(value);if(!Number.isSafeInteger(number))throw new Error('Integer outside supported range');return number;});
// Parameters are used only with fixed application SQL, never supplied SQL fragments.
export function postgresAdapter(client){
 const sql=text=>{let index=0;return text.replace(/\?/g,()=>`$${++index}`);};
 return {
  dialect:'postgres',
  prepare(text){return{
   async all(...values){return (await client.query(sql(text),values)).rows;},
   async get(...values){return (await client.query(sql(text),values)).rows[0];},
   async run(...values){const r=await client.query(sql(text),values);return{changes:r.rowCount??r.affectedRows};}
  };},
  exec:text=>client.query(text==='BEGIN IMMEDIATE'?'BEGIN':text),
  close:()=>client.end?.()
 };
}
export async function initializePostgres(db){
 await db.exec('CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text)');
 const migrations=[
  ['pg-001-musuroom-1','001_musuroom.sql'],
  ['pg-002-access-hardening','20260930101047_musuroom_access_hardening.sql'],
  ['pg-003-sensory-distribution','20260930152855_sensory_distribution.sql'],
 ];
 for(const [name,file] of migrations){
 if(!await db.prepare('SELECT version FROM schema_migrations WHERE version=?').get(name)){
  await db.exec('BEGIN');
  try{await db.exec(readFileSync(resolve(import.meta.dirname,'../../supabase/migrations',file),'utf8'));await db.prepare('INSERT INTO schema_migrations(version) VALUES(?)').run(name);await db.exec('COMMIT');}
  catch(error){await db.exec('ROLLBACK');throw error;}
 }
 }
 for(const a of articles){
  await db.prepare('INSERT INTO sources(id,citation,url,publication_year,evidence_type,access_scope,reviewed_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').run(a.ref,a.source,a.url,Number(a.year),a.type,a.access,'2026-09-30');
  await db.prepare('INSERT INTO knowledge_articles(id,source_id,title,category,summary,body,application,limitation,tags_json) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').run(a.id,a.ref,a.title,a.category,a.summary,a.body,a.application,a.limitation,JSON.stringify(a.tags));
 }
}
export async function openPostgres(config){
 const connection=new URL(config.databaseUrl);
 // Do not allow URL SSL parameters to override strict certificate verification.
 for(const name of ['sslmode','sslrootcert','sslcert','sslkey'])connection.searchParams.delete(name);
 const client=new pg.Client({connectionString:connection.href,ssl:{rejectUnauthorized:true,...(config.databaseCa?{ca:config.databaseCa.replaceAll('\\n','\n')}: {})},connectionTimeoutMillis:10000,query_timeout:15000});
 client.on('error',()=>{console.error('Postgres connection interrupted. Restarting is required.');process.exit(1);});
 try{
  await client.connect();const db=postgresAdapter(client);
  // Session pooler (5432) or direct connection required: migrations hold a session lock.
  await db.prepare('SELECT pg_advisory_lock(?)').get(876601);
  try{await initializePostgres(db);}finally{await db.prepare('SELECT pg_advisory_unlock(?)').get(876601);}
  return db;
 }catch(error){await client.end().catch(()=>{});const code=typeof error.code==='string' && /^[A-Z0-9_]{3,60}$/.test(error.code)?error.code:'unknown';throw new Error('Postgres connection or migration failed ('+code+'). Check server-side configuration.');}
}
