import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { projectRoot } from '../backend/config.mjs';
const path = resolve(projectRoot, '.env');
if (!existsSync(path)) {
  const template = readFileSync(resolve(projectRoot, '.env.example'), 'utf8');
  writeFileSync(path, template.replace('API_WRITE_TOKEN=', `API_WRITE_TOKEN=${randomBytes(32).toString('hex')}`), { flag: 'wx', mode: 0o600 });
  console.log('Created local .env with generated write token (not printed).');
} else console.log('Existing .env preserved.');
