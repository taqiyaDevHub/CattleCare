import test from 'node:test';
import assert from 'node:assert/strict';
import { dateStr, monthStr } from '../src/validators/common.js';
import { createTransactionSchema, transactionQuerySchema, reportQuerySchema } from '../src/validators/money.js';
import { sellSchema } from '../src/validators/animal.js';

const validTransaction = {
  type: 'expense',
  category: 'feed',
  amount: 100,
  date: '2026-11-01',
};

test('dateStr accepts valid calendar dates, including leap day', () => {
  assert.equal(dateStr.safeParse('2024-02-29').success, true);
  assert.equal(dateStr.safeParse('2026-11-01').success, true);
});

test('dateStr rejects impossible calendar dates', () => {
  for (const value of ['2026-02-31', '2025-02-29', '2026-13-01', '2026-04-31']) {
    assert.equal(dateStr.safeParse(value).success, false, `${value} should be rejected`);
  }
});

test('money transaction validation rejects impossible dates', () => {
  assert.equal(createTransactionSchema.safeParse({ ...validTransaction, date: '2026-02-31' }).success, false);
  assert.equal(createTransactionSchema.safeParse(validTransaction).success, true);
});

test('monthStr accepts only real YYYY-MM months', () => {
  assert.equal(monthStr.safeParse('2026-11').success, true);
  for (const value of ['2026-00', '2026-13', '2026-1', '26-11']) {
    assert.equal(monthStr.safeParse(value).success, false, `${value} should be rejected`);
  }
});

test('transaction and report query validators reject invalid months', () => {
  assert.equal(transactionQuerySchema.safeParse({ month: '2026-02' }).success, true);
  assert.equal(reportQuerySchema.safeParse({ month: '2026-13' }).success, false);
  assert.equal(transactionQuerySchema.safeParse({ month: '2026-00' }).success, false);
});

test('animal sale validation rejects zero and negative prices', () => {
  assert.equal(sellSchema.safeParse({ soldDate: '2026-11-01', soldPrice: 0 }).success, false);
  assert.equal(sellSchema.safeParse({ soldDate: '2026-11-01', soldPrice: -1 }).success, false);
  assert.equal(sellSchema.safeParse({ soldDate: '2026-11-01', soldPrice: 0.01 }).success, true);
});
