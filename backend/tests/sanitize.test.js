import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeFilename, isPathSafe, isAllowedMime } from '../src/utils/sanitize.js';

test('sanitizeFilename strips path separators', () => {
  assert.equal(sanitizeFilename('../etc/passwd'), '_etc_passwd');
  assert.equal(sanitizeFilename('hello.txt'), 'hello.txt');
});

test('isPathSafe rejects traversal', () => {
  assert.equal(isPathSafe('file.txt'), true);
  assert.equal(isPathSafe('../secret'), false);
});

test('isAllowedMime blocks executables', () => {
  assert.equal(isAllowedMime('image/png'), true);
  assert.equal(isAllowedMime('application/x-msdownload'), false);
});
