import { readdirSync,readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const stamp=`to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
let sql=readdirSync(resolve(root,'backend/db/migrations')).filter(x=>x.endsWith('.sql')).sort().map(name=>readFileSync(resolve(root,'backend/db/migrations',name),'utf8')).join('\n');
sql=sql.replaceAll(') STRICT;',');').replaceAll("strftime('%Y-%m-%dT%H:%M:%fZ','now')",stamp).replace(/json_valid\((\w+)\)/g,"jsonb_typeof($1::jsonb) IS NOT NULL");
sql=sql.replace('id INTEGER PRIMARY KEY, account_id TEXT','id BIGSERIAL PRIMARY KEY, account_id TEXT');
sql=sql.replace(/\b(expires_at|created_at|last_seen) INTEGER/g,'$1 BIGINT');
const tables=[...sql.matchAll(/CREATE TABLE (\w+)/g)].map(x=>x[1]);
sql+='\n-- Server-side Postgres connection only. No browser/anon access policies.\n';
for(const table of [...tables,'schema_migrations'])sql+=`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;\nREVOKE ALL ON TABLE ${table} FROM PUBLIC;\n`;
// Supabase roles may not exist in an isolated PostgreSQL test engine.
const names=[...tables,'schema_migrations'].join(',');
sql+=`DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON TABLE ${names} FROM anon; END IF; IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON TABLE ${names} FROM authenticated; END IF; END $$;\n`;
mkdirSync(resolve(root,'supabase/migrations'),{recursive:true});writeFileSync(resolve(root,'supabase/migrations/001_musuroom.sql'),sql);console.log('Postgres initial schema built. Review before deployment.');
