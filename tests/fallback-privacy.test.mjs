import test from 'node:test';
import assert from 'node:assert/strict';
import { localAnswer } from '../dist/browser-retrieval.js';

test('Local retrieval distinguishes offline questions from requests already attempted', () => {
  const local = localAnswer('umami');
  const attempted = localAnswer('umami', { requestAttempted: true });
  assert.match(local.note, /không gửi lên máy chủ/);
  assert.match(attempted.note, /Yêu cầu đã được gửi tới máy chủ/);
  assert.doesNotMatch(attempted.note, /không gửi lên máy chủ/);
  assert.equal(local.answer, attempted.answer);
  assert.ok(attempted.sources.length > 0);
});
