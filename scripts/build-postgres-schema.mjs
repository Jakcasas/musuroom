import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const stamp=`to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
// The initial cloud schema is immutable; later dialect-specific changes have separate migrations.
const initialFiles=['001_initial.sql','002_sensory_samples.sql','003_judge_portal.sql','004_product_samples.sql'];
let sql="CREATE TABLE schema_migrations(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text);\n"+initialFiles.map(name=>readFileSync(resolve(root,'backend/db/migrations',name),'utf8')).join('\n');
sql=sql.replaceAll(') STRICT;',');').replaceAll("strftime('%Y-%m-%dT%H:%M:%fZ','now')",stamp).replace(/json_valid\((\w+)\)/g,"jsonb_typeof($1::jsonb) IS NOT NULL");
sql=sql.replace('id INTEGER PRIMARY KEY, account_id TEXT','id BIGSERIAL PRIMARY KEY, account_id TEXT');
sql=sql.replace(/\b(expires_at|created_at|last_seen) INTEGER/g,'$1 BIGINT');
const tables=[...sql.matchAll(/CREATE TABLE (\w+)/g)].map(x=>x[1]);
sql+='\n-- Server-side Postgres connection only. No browser/anon access policies.\n';
for(const table of [...tables,'schema_migrations'])sql+=`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;\nREVOKE ALL ON TABLE ${table} FROM PUBLIC;\n`;
// Supabase roles may not exist in an isolated PostgreSQL test engine.
const names=[...tables,'schema_migrations'].join(',');
sql+=`DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON TABLE ${names} FROM anon; END IF; IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON TABLE ${names} FROM authenticated; END IF; END $$;\n`;
sql+="INSERT INTO schema_migrations(version) VALUES('pg-001-musuroom-1');\n";
mkdirSync(resolve(root,'data/schema-review'),{recursive:true});writeFileSync(resolve(root,'data/schema-review/musuroom-initial-candidate.sql'),sql);console.log('Review candidate saved outside Git at data/schema-review/musuroom-initial-candidate.sql. Historical Supabase migrations were not modified.');
