import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateCartItemId,
  calculateItemPrice,
  normalizeCartItem,
  MAX_CART_ITEM_QUANTITY,
} from '../src/lib/cartUtils.ts';

const sampleProduct = {
  id: 5,
  categoryId: 1,
  categoryName: 'Cơm',
  name: 'Cơm sườn nướng',
  slug: 'com-suon-nuong',
  description: 'Cơm sườn thơm ngon',
  price: 45000,
  image: '/img/com-suon.jpg',
  isAvailable: true,
  isFeatured: true,
  rating: 4.9,
};

test('UT-01: generateCartItemId bất biến với thứ tự topping và chuẩn hóa khoảng trắng/chữ hoa ghi chú', () => {
  const idA = generateCartItemId(
    5,
    [
      { id: 'top_2', name: 'Trứng ốp', price: 7000 },
      { id: 'top_1', name: 'Chả thêm', price: 10000 },
    ],
    '  Ít Cơm Nhiều Hành  '
  );
  const idB = generateCartItemId(
    5,
    [
      { id: 'top_1', name: 'Chả thêm', price: 10000 },
      { id: 'top_2', name: 'Trứng ốp', price: 7000 },
    ],
    'ít cơm nhiều hành'
  );
  assert.equal(idA, idB);
});

test('UT-02: calculateItemPrice cộng chính xác giá gốc và danh sách topping', () => {
  assert.equal(calculateItemPrice(45000, []), 45000);
  assert.equal(
    calculateItemPrice(45000, [
      { id: 1, name: 'Trứng', price: 7000 },
      { id: 2, name: 'Chả', price: 10000 },
    ]),
    62000
  );
});

test('UT-03: normalizeCartItem giới hạn số lượng 1..99 và loại bỏ payload lỗi', () => {
  assert.equal(normalizeCartItem(null), null);
  assert.equal(normalizeCartItem({ quantity: 2 }), null);

  const clampedHigh = normalizeCartItem({
    product: sampleProduct,
    quantity: 500,
    selectedToppings: [{ id: 't1', name: 'Trứng', price: 7000 }],
    note: '  Không ớt ',
  });
  assert.ok(clampedHigh);
  assert.equal(clampedHigh.quantity, MAX_CART_ITEM_QUANTITY);
  assert.equal(clampedHigh.itemPrice, 52000);
  assert.equal(clampedHigh.note, 'Không ớt');

  const clampedLow = normalizeCartItem({
    product: sampleProduct,
    quantity: -3,
  });
  assert.ok(clampedLow);
  assert.equal(clampedLow.quantity, 1);
});
