import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { loadConfig, projectRoot } from '../backend/config.mjs';
import { openConfiguredDatabase } from '../backend/db/configured.mjs';
import { loadProjectEnv } from './env.mjs';
loadProjectEnv();
const id=process.argv[2]; if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Usage: node scripts/revoke-access.mjs ACCOUNT_ID');
const db=await openConfiguredDatabase(loadConfig());
await db.exec('BEGIN IMMEDIATE');
try {
  const changed=(await db.prepare('UPDATE judge_accounts SET enabled=0 WHERE id=?').run(id)).changes;
  await db.prepare('DELETE FROM auth_sessions WHERE account_id=?').run(id);
  if(changed)await db.prepare("INSERT INTO access_audit(account_id,action) VALUES(?,'ACCESS_REVOKED')").run(id);
  await db.exec('COMMIT'); console.log(changed ? 'Account revoked; sessions ended.' : 'Account not found.');
} catch(error) {await db.exec('ROLLBACK');throw error;} finally {await db.close();}
