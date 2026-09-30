import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot, loadConfig } from '../backend/config.mjs';
import { openConfiguredDatabase } from '../backend/db/configured.mjs';
import { loadProjectEnv } from './env.mjs';
loadProjectEnv();
const db = await openConfiguredDatabase(loadConfig());
try{console.log('Database ready:', (await db.prepare('SELECT count(*) AS total FROM knowledge_articles').get()).total, 'articles');}finally{await db.close();}
