import test from 'node:test';
import assert from 'node:assert/strict';
import {containsPrivateMaterial} from '../scripts/secret-scan.mjs';
test('publish scanning blocks newly pasted Jev keys before staging, without requiring a known private key',()=>{
 assert.equal(containsPrivateMaterial('JEV_API_KEY='+'jev_'+'a'.repeat(32)),true);
 assert.equal(containsPrivateMaterial('jev_'+'b'.repeat(32)),true);
 assert.equal(containsPrivateMaterial('JEV_API_KEY=your-jev-api-key'),false);
 assert.equal(containsPrivateMaterial('jev_decide'),false);
 assert.equal(containsPrivateMaterial(Buffer.from('token=fixture-secret-material'),['fixture-secret-material']),true);
});
