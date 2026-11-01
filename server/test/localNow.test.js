import test from 'node:test';
import assert from 'node:assert/strict';
import { localDateString, localMonthString } from '../src/services/localNow.js';

test('Pakistan local date rolls over at 19:00 UTC', () => {
  assert.equal(localDateString(new Date('2026-01-01T18:59:59.000Z')), '2026-01-01');
  assert.equal(localDateString(new Date('2026-01-01T19:00:00.000Z')), '2026-01-02');
});

test('Pakistan local month handles year boundaries', () => {
  assert.equal(localMonthString(new Date('2025-12-31T18:59:59.000Z')), '2025-12');
  assert.equal(localMonthString(new Date('2025-12-31T19:00:00.000Z')), '2026-01');
});
