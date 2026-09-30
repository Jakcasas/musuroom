import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, sep } from 'node:path';
import { loadEnvFile } from 'node:process';
import { loadConfig, projectRoot } from '../backend/config.mjs';
import { openDatabase } from '../backend/db/database.mjs';
import { createAccount } from '../backend/security/auth.mjs';
if (existsSync(resolve(projectRoot,'.env'))) loadEnvFile(resolve(projectRoot,'.env'));
const args = process.argv.slice(2); const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name)+1] : fallback;
const role = option('--role','JUDGE'); const name = option('--name','Ban Giám Khảo FID 2026');
const output = resolve(projectRoot,option('--out',`data/${role.toLowerCase()}-access.json`));
const dataRoot=resolve(projectRoot,'data');
if (!output.startsWith(dataRoot+sep) || !output.endsWith('.json')) throw new Error('Credential file must be a JSON file inside data/');
if (existsSync(output)) throw new Error('Credential file already exists. Choose a new --out; existing account is preserved.');
const db=openDatabase(loadConfig().databasePath);
db.exec('BEGIN IMMEDIATE');
try {
  const account=await createAccount(db,{name,role,days:Number(option('--days','7'))});
  mkdirSync(dirname(output),{recursive:true});
  writeFileSync(output,JSON.stringify(account,null,2),{flag:'wx',mode:0o600});
  db.exec('COMMIT'); console.log('Access account created. Private credential file:',output);
} catch(error) {db.exec('ROLLBACK');throw error;} finally {db.close();}
