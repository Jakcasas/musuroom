import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
for (const name of ['core.js', 'knowledge-data.js']) {
  const source = readFileSync(resolve(root, 'shared', name));
  const target = resolve(root, 'dist', name);
  let current;
  try {
    current = readFileSync(target);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (!current?.equals(source)) writeFileSync(target, source);
}
