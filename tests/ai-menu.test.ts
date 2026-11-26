import test from 'node:test';
import assert from 'node:assert/strict';
import type { Branch, Coupon, Product } from '../src/types/index.ts';
import {
  buildFoodMenuPromptContext,
  extractMentionedProductIds,
  filterActiveCoupons,
  filterMenuProducts,
  getOtherBranchExclusiveProducts,
  pickRecommendedProductsForBranch,
  scoreAndSearchProducts,
} from '../src/lib/aiMenuUtils.ts';

const BRANCH_1: Branch = {
  id: 1,
  code: 'cs1-yenlang',
  name: 'NooNee - Cơ sở 120 Yên Lãng',
  shortName: '120 Yên Lãng',
  address: '120 Yên Lãng, Đống Đa, Hà Nội',
  district: 'Đống Đa',
  city: 'Hà Nội',
  lat: 21.011467,
  lng: 105.816642,
  phone: '0943 190 609',
  openHours: '08:00 - 22:30',
};

const BRANCH_2: Branch = {
  id: 2,
  code: 'cs2-caugiay',
  name: 'NooNee - Cơ sở 269 Cầu Giấy',
  shortName: '269 Cầu Giấy',
  address: '269 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội',
  district: 'Cầu Giấy',
  city: 'Hà Nội',
  lat: 21.03452,
  lng: 105.79785,
  phone: '0943 190 609',
  openHours: '08:00 - 22:30',
};

const ALL_PRODUCTS: Product[] = [
  {
    id: 1,
    categoryId: 1,
    categoryName: 'Cơm',
    name: 'Cơm rang dương châu',
    slug: 'com-rang-duong-chau',
    description: 'Cơm rang thơm ngon',
    price: 35000,
    image: '/a.jpg',
    isAvailable: true,
    isFeatured: true,
    soldCount: 45,
    rating: 4.9,
    branchId: 1,
  },
  {
    id: 4,
    categoryId: 1,
    categoryName: 'Cơm',
    name: 'Cơm tấm Sài Gòn',
    slug: 'com-tam-sai-gon',
    description: 'Cơm tấm sườn bì chả',
    price: 38000,
    image: '/b.jpg',
    isAvailable: true,
    isFeatured: true,
    soldCount: 60,
    rating: 4.8,
    branchId: null,
  },
  {
    id: 10,
    categoryId: 5,
    categoryName: 'Phở',
    name: 'Phở bò tái chín',
    slug: 'pho-bo-tai-chin',
    description: 'Phở bò gia truyền',
    price: 40000,
    image: '/c.jpg',
    isAvailable: true,
    isFeatured: false,
    soldCount: 20,
    rating: 4.7,
    branchId: 1,
  },
  {
    id: 76,
    categoryId: 4,
    categoryName: 'Bún mì',
    name: 'Bún chả Cầu Giấy đặc biệt',
    slug: 'bun-cha-cau-giay-dac-biet',
    description: 'Bún chả đặc trưng cơ sở Cầu Giấy',
    price: 45000,
    image: '/d.jpg',
    isAvailable: true,
    isFeatured: true,
    soldCount: 52,
    rating: 5.0,
    branchId: 2,
  },
  {
    id: 99,
    categoryId: 1,
    categoryName: 'Cơm',
    name: 'Cơm sườn tạm hết',
    slug: 'com-suon-tam-het',
    description: 'Món đã tắt bán trong SQL Server',
    price: 42000,
    image: '/e.jpg',
    isAvailable: false,
    isFeatured: false,
    soldCount: 10,
    rating: 4.5,
    branchId: null,
  },
];

const SAMPLE_COUPONS: Coupon[] = [
  {
    code: 'GIAM10K',
    name: 'Giảm 10k',
    description: 'Đơn từ 50k',
    discountType: 'fixed',
    discountValue: 10000,
    minOrderAmount: 50000,
    expiryDate: '2026-12-31',
    isActive: true,
    couponType: 'food_discount',
  },
  {
    code: 'EXPIRED99',
    name: 'Hết hạn',
    description: 'Đã hết hạn',
    discountType: 'fixed',
    discountValue: 99000,
    minOrderAmount: 0,
    expiryDate: '2020-01-01',
    isActive: true,
    couponType: 'food_discount',
  },
  {
    code: 'FREESHIP',
    name: 'Freeship',
    description: 'Đơn từ 120k',
    discountType: 'fixed',
    discountValue: 0,
    minOrderAmount: 120000,
    expiryDate: '2026-12-31',
    isActive: true,
    couponType: 'freeship',
  },
];

test('AI-01: filterMenuProducts lọc đúng cơ sở và loại bỏ món đã tắt bán (isAvailable=false)', () => {
  const b1 = filterMenuProducts(ALL_PRODUCTS, { branchId: 1, availableOnly: true });
  assert.deepEqual(
    b1.map((p) => p.id),
    [1, 4, 10]
  );

  const b2 = filterMenuProducts(ALL_PRODUCTS, { branchId: 2, availableOnly: true });
  assert.deepEqual(
    b2.map((p) => p.id),
    [4, 76]
  );
});

test('AI-02: buildFoodMenuPromptContext đồng bộ đúng cơ sở, gắn dấu * (bán chạy) / ★ (riêng CS), tách món cơ sở khác và lọc voucher còn hạn', () => {
  const b1Available = filterMenuProducts(ALL_PRODUCTS, { branchId: 1, availableOnly: true });
  const other = getOtherBranchExclusiveProducts(ALL_PRODUCTS, BRANCH_2);
  const prompt = buildFoodMenuPromptContext({
    branch: BRANCH_1,
    availableProducts: b1Available,
    otherBranchExclusive: other,
    activeCoupons: SAMPLE_COUPONS,
    now: new Date('2026-11-26T12:00:00Z'),
  });

  assert.match(prompt, /CƠ SỞ ĐANG PHỤC VỤ: NooNee - Cơ sở 120 Yên Lãng/);
  assert.match(prompt, /1:Cơm rang dương châu\*★-35k/);
  assert.match(prompt, /4:Cơm tấm Sài Gòn\*-38k/);
  assert.doesNotMatch(prompt, /76:Bún chả Cầu Giấy đặc biệt/);
  assert.doesNotMatch(prompt, /Cơm sườn tạm hết/);
  assert.match(prompt, /CHỈ PHỤC VỤ TẠI 269 Cầu Giấy.*Bún chả Cầu Giấy đặc biệt/);
  assert.match(prompt, /GIAM10K\(giảm 10k,đơn≥50k\)/);
  assert.match(prompt, /FREESHIP\(freeship,đơn≥120k\)/);
  assert.doesNotMatch(prompt, /EXPIRED99/);
});

test('AI-03: pickRecommendedProductsForBranch chặn triệt để ID món cơ sở khác hoặc món tạm hết', () => {
  const b1Available = filterMenuProducts(ALL_PRODUCTS, { branchId: 1, availableOnly: true });
  const picked = pickRecommendedProductsForBranch([76, 99, 10, 4, 10], b1Available, 4);
  assert.deepEqual(
    picked.map((p) => p.id),
    [10, 4]
  );
});

test('AI-04: scoreAndSearchProducts hỗ trợ tìm kiếm tiếng Việt không dấu, hỏi món đặc trưng và lọc theo cơ sở', () => {
  const b2Available = filterMenuProducts(ALL_PRODUCTS, { branchId: 2, availableOnly: true });
  const unaccented = scoreAndSearchProducts(b2Available, 'bun cha cau giay', 2);
  assert.equal(unaccented[0]?.id, 76);

  const exclusive = scoreAndSearchProducts(b2Available, 'món đặc trưng cơ sở này', 2);
  assert.equal(exclusive[0]?.id, 76);

  const b1Available = filterMenuProducts(ALL_PRODUCTS, { branchId: 1, availableOnly: true });
  const mentioned = extractMentionedProductIds(
    'Bạn nên thử Phở bò tái chín nóng hổi và Cơm tấm Sài Gòn nhé!',
    b1Available
  );
  assert.deepEqual(mentioned, [10, 4]);
});

test('AI-05: filterActiveCoupons loại bỏ voucher hết hạn hoặc hết lượt sử dụng', () => {
  const coupons: Coupon[] = [
    ...SAMPLE_COUPONS,
    {
      code: 'FULLUSE',
      name: 'Hết lượt',
      description: '',
      discountType: 'fixed',
      discountValue: 15000,
      minOrderAmount: 50000,
      usageLimit: 10,
      usedCount: 10,
      isActive: true,
    },
  ];
  const active = filterActiveCoupons(coupons, new Date('2026-11-26T12:00:00Z'));
  assert.deepEqual(
    active.map((c) => c.code),
    ['GIAM10K', 'FREESHIP']
  );
});
