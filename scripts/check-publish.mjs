import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { parseEnv } from 'node:util';
import {containsPrivateMaterial} from './secret-scan.mjs';

// Check the Git history without ever printing private values or matched content.
const secrets = [];
for (const path of ['.env', 'data/cloud.env']) {
  if (!existsSync(path)) continue;
  const values = parseEnv(readFileSync(path, 'utf8'));
  for (const key of ['DATABASE_URL', 'MONGODB_URI', 'SUPABASE_SERVICE_ROLE_KEY', 'TYPESAFE_API_KEY', 'JEV_API_KEY', 'OPENROUTER_API_KEY', 'API_WRITE_TOKEN']) {
    if (values[key]?.length > 12) secrets.push(values[key]);
  }
  if (values.DATABASE_URL) secrets.push(decodeURIComponent(new URL(values.DATABASE_URL).password));
  if (values.MONGODB_URI) secrets.push(decodeURIComponent(new URL(values.MONGODB_URI).password));
}
for (const path of ['data/judge-access.json', 'data/admin-access.json', 'data/cloud-judge-access.json', 'data/cloud-admin-access.json']) {
  if (!existsSync(path)) continue;
  for (const [key, value] of Object.entries(JSON.parse(readFileSync(path, 'utf8')))) {
    if (/code|secret|password/i.test(key) && typeof value === 'string' && value.length > 12) secrets.push(value);
  }
}
const git = args => execFileSync('git', args, { encoding: 'utf8', windowsHide: true });
const objects = git(['rev-list', '--objects', '--all']).trim().split('\n').map(line => {
  const split = line.indexOf(' ');
  return { id: split < 0 ? line : line.slice(0, split), path: split < 0 ? '' : line.slice(split + 1) };
});
const bytes = execFileSync('git', ['cat-file', '--batch'], {
  input: objects.map(object => object.id).join('\n') + '\n', maxBuffer: 100_000_000, windowsHide: true,
});
const hits = [];
let offset = 0;
for (const object of objects) {
  const end = bytes.indexOf(10, offset);
  const [, type, sizeText] = bytes.subarray(offset, end).toString().split(' ');
  const size = Number(sizeText);
  const content = bytes.subarray(end + 1, end + 1 + size);
  offset = end + size + 2;
  if (type !== 'blob') continue;
  if (containsPrivateMaterial(content,secrets)) hits.push(object.path);
  if (/^(data\/|node_modules\/|\.env$|cloud\.env$)/.test(object.path)) hits.push(object.path);
}
const tracked=git(['ls-files','-z']).split('\0').filter(Boolean);
for(const path of tracked){if(existsSync(path)&&containsPrivateMaterial(readFileSync(path),secrets))hits.push(path);}
console.log(JSON.stringify({ historyObjects: objects.length,trackedFiles:tracked.length,blockedPaths: [...new Set(hits)] }));
if (hits.length) process.exitCode = 1;
