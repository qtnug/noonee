import test from 'node:test';
import assert from 'node:assert/strict';
import { getMembershipTier } from '../src/lib/membership.ts';

test('MEM-01: getMembershipTier tính đúng 4 hạng, tiến độ và danh sách voucher kế thừa', () => {
  const bronze = getMembershipTier(250000);
  assert.equal(bronze.tier, 'Bronze');
  assert.equal(bronze.progress, 50);
  assert.equal(bronze.amountNeeded, 250000);
  assert.equal(bronze.shippingDiscount, 0);
  assert.deepEqual(bronze.vouchers.map((v) => v.code), ['VIETQR20']);

  const silver = getMembershipTier(500000);
  assert.equal(silver.tier, 'Silver');
  assert.equal(silver.progress, 0);
  assert.equal(silver.amountNeeded, 1000000);
  assert.equal(silver.shippingDiscount, 5000);

  const gold = getMembershipTier(2500000);
  assert.equal(gold.tier, 'Gold');
  assert.equal(gold.progress, 50);
  assert.equal(gold.shippingDiscount, 10000);
  assert.deepEqual(gold.vouchers.map((v) => v.code), ['SILVER10', 'GOLD25', 'GOLDVIP']);

  const diamond = getMembershipTier(5000000);
  assert.equal(diamond.tier, 'Diamond');
  assert.equal(diamond.nextTier, null);
  assert.equal(diamond.progress, 100);
  assert.equal(diamond.amountNeeded, 0);
  assert.equal(diamond.shippingDiscount, 25000);
  assert.equal(diamond.vouchers.length, 5);
});
