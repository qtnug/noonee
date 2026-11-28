import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isOrderLocked,
  canUserReviewOrder,
  matchActiveTableByQr,
  computeDineInLinePrice,
} from '../src/lib/orderRules.ts';

test('ORD-01: isOrderLocked khóa chặt đơn đã Completed hoặc Cancelled', () => {
  assert.equal(isOrderLocked('Pending'), false);
  assert.equal(isOrderLocked('Processing'), false);
  assert.equal(isOrderLocked('Delivering'), false);
  assert.equal(isOrderLocked('Completed'), true);
  assert.equal(isOrderLocked('Cancelled'), true);
});

test('REV-01: canUserReviewOrder chỉ mở khi Completed và chống mạo danh orderCode của người khác', () => {
  const baseOrder = {
    orderCode: 'NOONEE123',
    userId: 10,
    status: 'Delivering',
    items: [{ productId: 4 }],
  };
  // Chưa Completed -> chặn
  assert.equal(canUserReviewOrder(baseOrder, 4, 10), false);

  const completedOrder = { ...baseOrder, status: 'Completed' };
  // Đúng chủ đơn + đúng món + Completed -> cho phép
  assert.equal(canUserReviewOrder(completedOrder, 4, 10), true);
  assert.equal(canUserReviewOrder(completedOrder, 4, 10, 'NOONEE123'), true);
  // Món không có trong đơn -> chặn
  assert.equal(canUserReviewOrder(completedOrder, 99, 10), false);
  // User khác truyền mã đơn của user 10 -> chặn tuyệt đối
  assert.equal(canUserReviewOrder(completedOrder, 4, 999, 'NOONEE123'), false);
});

test('QR-01: matchActiveTableByQr bắt buộc khớp token QR, cơ sở và trạng thái mở bàn', () => {
  const tables = [
    { id: 1, branchId: 1, tableNumber: 'B01', qrToken: 'tok-v2', isActive: true },
    { id: 2, branchId: 1, tableNumber: 'B02', qrToken: 'tok-locked', isActive: false },
  ];
  // Thiếu token hoặc sai token (VD mã QR cũ) -> từ chối
  assert.equal(matchActiveTableByQr(tables, 1, 'B01', ''), null);
  assert.equal(matchActiveTableByQr(tables, 1, 'B01', 'tok-old-v1'), null);
  // Sai cơ sở -> từ chối
  assert.equal(matchActiveTableByQr(tables, 2, 'B01', 'tok-v2'), null);
  // Bàn đang tạm khóa -> từ chối
  assert.equal(matchActiveTableByQr(tables, 1, 'B02', 'tok-locked'), null);
  // Đúng cơ sở + mã bàn (không phân biệt hoa thường) + đúng token -> khớp
  assert.equal(matchActiveTableByQr(tables, 1, 'b01', 'tok-v2')?.id, 1);
});

test('DINE-01: computeDineInLinePrice tính lại giá topping từ DB, bỏ qua giá giả mạo và chống trùng ID', () => {
  const dish = {
    price: 38000,
    toppings: [
      { id: 1, name: 'Trứng ốp la', price: 5000 },
      { id: 3, name: 'Sườn nướng thêm', price: 15000 },
    ],
  };
  const res = computeDineInLinePrice(dish, [
    { id: 1, name: 'Fake', price: 0 },
    { id: 1, name: 'Duplicate', price: 0 },
    { id: 3, price: -99999 },
    { id: 999, price: 50000 },
  ]);
  assert.equal(res.unitPrice, 58000);
  assert.deepEqual(res.toppingNames, ['Trứng ốp la', 'Sườn nướng thêm']);
});
