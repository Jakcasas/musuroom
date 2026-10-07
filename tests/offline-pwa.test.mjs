import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';

test('Public home works offline after installation while private routes stay outside cache', async () => {
  assert.match(readFileSync(resolve(import.meta.dirname, '../dist/index.html'), 'utf8'), /src="pwa\.js"/);
  const listeners = new Map();
  let precached = [];
  const offlineHome = { offline: true };
  const cache = {
    addAll: async (files) => { precached = files; },
    put: async () => {},
  };
  const context = {
    URL,
    self: {
      location: { origin: 'https://musuroom.example' },
      addEventListener: (name, handler) => listeners.set(name, handler),
      skipWaiting: async () => {},
    },
    caches: {
      open: async () => cache,
      match: async (path) => path === '/' ? offlineHome : undefined,
    },
    fetch: async () => { throw new Error('offline'); },
    Response: { error: () => ({ offline: false }) },
  };
  runInNewContext(readFileSync(resolve(import.meta.dirname, '../dist/sw.js'), 'utf8'), context);
  let install;
  listeners.get('install')({ waitUntil: (promise) => { install = promise; } });
  await install;
  for (const path of ['/', '/index.html', '/assets/mushroom-seasoning.webp']) {
    assert.ok(precached.includes(path), `${path} must be available offline`);
  }
  assert.ok(!precached.some((path) => path.startsWith('/api/') || path.includes('giam-khao')));
  let reply;
  listeners.get('fetch')({ request: { method: 'GET', url: 'https://musuroom.example/' }, respondWith: (promise) => { reply = promise; } });
  assert.equal(await reply, offlineHome);
  let privateReply;
  listeners.get('fetch')({ request: { method: 'GET', url: 'https://musuroom.example/giam-khao.html' }, respondWith: (promise) => { privateReply = promise; } });
  assert.equal(privateReply, undefined);
});
