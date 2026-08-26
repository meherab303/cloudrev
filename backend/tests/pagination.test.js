import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePagination, paginated } from '../src/utils/pagination.js';

test('parsePagination clamps values', () => {
  assert.deepEqual(parsePagination({ page: '2', limit: '10' }), { page: 2, limit: 10, skip: 10 });
  assert.equal(parsePagination({ limit: '999' }).limit, 100);
  assert.equal(parsePagination({ page: '-1' }).page, 1);
});

test('paginated shape', () => {
  const r = paginated([1, 2], 20, 1, 10);
  assert.equal(r.pagination.totalPages, 2);
  assert.equal(r.data.length, 2);
});
