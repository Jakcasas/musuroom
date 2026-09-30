import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, sep } from 'node:path';
import { loadEnvFile } from 'node:process';
import { loadConfig, projectRoot } from '../backend/config.mjs';
import { openConfiguredDatabase } from '../backend/db/configured.mjs';
import { loadProjectEnv } from './env.mjs';
import { createAccount } from '../backend/security/auth.mjs';
loadProjectEnv();
const args = process.argv.slice(2); const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name)+1] : fallback;
const role = option('--role','JUDGE'); const name = option('--name','Ban Giám Khảo FID 2026');
const output = resolve(projectRoot,option('--out',`data/${role.toLowerCase()}-access.json`));
const dataRoot=resolve(projectRoot,'data');
if (!output.startsWith(dataRoot+sep) || !output.endsWith('.json')) throw new Error('Credential file must be a JSON file inside data/');
if (existsSync(output)) throw new Error('Credential file already exists. Choose a new --out; existing account is preserved.');
const db=await openConfiguredDatabase(loadConfig());
await db.exec('BEGIN IMMEDIATE');
try {
  const account=await createAccount(db,{name,role,days:Number(option('--days','7'))});
  mkdirSync(dirname(output),{recursive:true});
  writeFileSync(output,JSON.stringify(account,null,2),{flag:'wx',mode:0o600});
  await db.exec('COMMIT'); console.log('Access account created. Private credential file:',output);
} catch(error) {await db.exec('ROLLBACK');throw error;} finally {await db.close();}
