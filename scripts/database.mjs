import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot, loadConfig } from '../backend/config.mjs';
import { openConfiguredDatabase } from '../backend/db/configured.mjs';
import { loadProjectEnv } from './env.mjs';
import { operation } from '../backend/db/operation.mjs';
loadProjectEnv();
const db = await openConfiguredDatabase(loadConfig());
try{console.log('Database ready:', (await operation(db,'knowledge.count',()=>db.prepare('SELECT count(*) AS n FROM knowledge_articles')).get()).n, 'articles');}finally{await db.close();}
