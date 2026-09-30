import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { projectRoot } from '../backend/config.mjs';
const path = resolve(projectRoot, '.env');
if (!existsSync(path)) {
  const template = readFileSync(resolve(projectRoot, '.env.example'), 'utf8');
  writeFileSync(path, template.replace('API_WRITE_TOKEN=', `API_WRITE_TOKEN=${randomBytes(32).toString('hex')}`), { flag: 'wx', mode: 0o600 });
  console.log('Created local .env with generated write token (not printed).');
} else {
  const existing = readFileSync(path,'utf8');
  const keys = new Set(existing.split(/\r?\n/).filter(line=>/^[A-Z_]+=/.test(line)).map(line=>line.split('=')[0]));
  const missing = readFileSync(resolve(projectRoot,'.env.example'),'utf8').split(/\r?\n/).filter(line=>/^[A-Z_]+=/.test(line)&&!keys.has(line.split('=')[0]));
  if(missing.length)writeFileSync(path,existing.trimEnd()+'\n\n'+missing.map(line=>line==='API_WRITE_TOKEN='?`API_WRITE_TOKEN=${randomBytes(32).toString('hex')}`:line).join('\n')+'\n',{mode:0o600});
  console.log('Existing .env values preserved; missing settings added.');
}
