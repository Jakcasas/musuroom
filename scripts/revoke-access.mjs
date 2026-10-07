import { operation } from '../backend/db/operation.mjs';
import { transaction } from '../backend/db/transaction.mjs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { loadConfig, projectRoot } from '../backend/config.mjs';
import { openConfiguredDatabase } from '../backend/db/configured.mjs';
import { loadProjectEnv } from './env.mjs';
loadProjectEnv();
const id=process.argv[2]; if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Usage: node scripts/revoke-access.mjs ACCOUNT_ID');
const db=await openConfiguredDatabase(loadConfig());
try {await transaction(db,async()=>{
  const changed=(await operation(db,'accounts.revoke',()=>db.prepare('UPDATE judge_accounts SET enabled=0 WHERE id=?')).run(id)).changes;
  await operation(db,'sessions.deleteAccount',()=>db.prepare('DELETE FROM auth_sessions WHERE account_id=?')).run(id);
  if(changed)await operation(db,'audit.revoke',()=>db.prepare("INSERT INTO access_audit(account_id,action) VALUES(?,'ACCESS_REVOKED')")).run(id);
  console.log(changed ? 'Account revoked; sessions ended.' : 'Account not found.');
});} finally {await db.close();}
