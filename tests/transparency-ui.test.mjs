import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('Public records recover after a failed request and allow only one retry at a time', async () => {
  const nodes = new Map();
  const document = { activeElement: null, getElementById: id => nodes.get(id) };
  let retry;
  const element = (tag, text = '') => ({
    tag, textContent: text, hidden: false, disabled: false, children: [], attributes: {}, events: {},
    classList: { add() {}, remove() {} },
    append(...items) { this.children.push(...items); },
    replaceChildren(...items) { this.children = items; },
    after(node) { retry = node; },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, handler) { this.events[name] = handler; },
    focus() { document.activeElement = this; },
  });
  const status = element('p'); const list = element('div');
  nodes.set('sample-status', status); nodes.set('sample-list', list);
  let calls = 0; let resolveRetry;
  const fetch = () => {
    calls++;
    if (calls === 1) return Promise.reject(new Error('offline'));
    return new Promise(resolve => { resolveRetry = resolve; });
  };
  const source = readFileSync(new URL('../dist/transparency.js', import.meta.url), 'utf8').replace(/^import[^\n]+\n/, '');
  runInNewContext(source, { document, element, number: String, fetch, AbortSignal });
  await new Promise(setImmediate);
  assert.match(status.textContent, /Chưa thể tải hồ sơ/);
  assert.equal(retry.hidden, false);
  document.activeElement = retry;
  const pending = retry.events.click();
  await retry.events.click();
  assert.equal(calls, 2);
  assert.equal(retry.disabled, true);
  assert.equal(list.attributes['aria-busy'], 'true');
  resolveRetry({ ok: true, json: async () => ({ items: [] }) });
  await pending;
  assert.equal(retry.hidden, true);
  assert.equal(retry.disabled, false);
  assert.equal(list.attributes['aria-busy'], 'false');
  assert.match(status.textContent, /Chưa có số liệu đo/);
  assert.equal(document.activeElement, status);
});
