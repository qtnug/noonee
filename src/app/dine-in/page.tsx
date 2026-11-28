'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CiSearch as Search,
  CiShoppingBasket as ShoppingBag,
  CiCircleRemove as X,
  CiCircleCheck as CheckCircle2,
  CiTrash as Trash2,
} from 'react-icons/ci';
import VietQRCode from '@/components/VietQRCode';
import { formatVND } from '@/lib/utils';
import type { Category, Product, ProductTopping, RestaurantTable, OrderStatus } from '@/types';

interface DineCartLine {
  key: string;
  product: Product;
  quantity: number;
  selectedToppings: ProductTopping[];
  note: string;
}

interface ActiveDineOrder {
  orderCode: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  tableName?: string;
  items?: { productName: string; quantity: number; price: number; toppings?: string | null; note?: string | null }[];
}

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'Pending', label: 'Chờ xác nhận' },
  { key: 'Processing', label: 'Bếp đang làm' },
  { key: 'Delivering', label: 'Sẵn sàng ra bàn' },
  { key: 'Completed', label: 'Hoàn tất' },
];

function DineInContent() {
  const sp = useSearchParams();
  const branch = Number(sp.get('branch') || 1) === 2 ? 2 : 1;
  const tableParam = (sp.get('table') || '').trim();
  const token = (sp.get('token') || '').trim();
  const storageKey = `noonee_dinein_order_${branch}_${tableParam}`;

  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [tableErr, setTableErr] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCat, setActiveCat] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  const [lines, setLines] = useState<DineCartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Sepay'>('COD');
  const [submitting, setSubmitting] = useState(false);

  // Dish options drawer
  const [pickingDish, setPickingDish] = useState<Product | null>(null);
  const [pickedTops, setPickedTops] = useState<ProductTopping[]>([]);
  const [pickedNote, setPickedNote] = useState('');

  // Live tracked order + VietQR config
  const [activeOrder, setActiveOrder] = useState<ActiveDineOrder | null>(null);
  const [payCfg, setPayCfg] = useState({ bankName: '', accountNo: '', accountName: '', simulationEnabled: false });

  useEffect(() => {
    const init = async () => {
      try {
        const [tRes, cRes, pRes, payRes] = await Promise.all([
          fetch(`/api/tables/public?branch=${branch}&table=${encodeURIComponent(tableParam)}&token=${encodeURIComponent(token)}`),
          fetch('/api/categories'),
          fetch(`/api/products?branch=${branch}&limit=200`),
          fetch('/api/payment-config'),
        ]);
        const [tData, cData, pData, payData] = await Promise.all([
          tRes.json(),
          cRes.json(),
          pRes.json(),
          payRes.json(),
        ]);

        if (!tData.success) {
          setTableErr(tData.message || 'Mã QR bàn không hợp lệ');
          return;
        }
        setTable(tData.data);
        if (cData.success) setCategories(cData.data || []);
        if (pData.success) setProducts((pData.data || []).filter((p: Product) => p.isAvailable));
        if (payData.success && payData.data) setPayCfg(payData.data);

        // Restore active order from sessionStorage if still active
        const savedCode = sessionStorage.getItem(storageKey);
        if (savedCode) {
          const oRes = await fetch(`/api/dine-in/orders?code=${encodeURIComponent(savedCode)}`);
          const oData = await oRes.json();
          if (oData.success && oData.data && oData.data.status !== 'Cancelled') {
            setActiveOrder(oData.data);
          } else {
            sessionStorage.removeItem(storageKey);
          }
        }
      } catch {
        setTableErr('Không thể kết nối máy chủ. Vui lòng thử quét lại mã QR.');
      }
    };
    init();
  }, [branch, tableParam, token, storageKey]);

  const refreshOrder = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/dine-in/orders?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.success && data.data) setActiveOrder(data.data);
    } catch {}
  }, []);

  useEffect(() => {
    if (!activeOrder?.orderCode || activeOrder.status === 'Completed' || activeOrder.status === 'Cancelled') return;
    const id = setInterval(() => refreshOrder(activeOrder.orderCode), 2500);
    return () => clearInterval(id);
  }, [activeOrder?.orderCode, activeOrder?.status, refreshOrder]);

  const addLine = (product: Product, toppings: ProductTopping[] = [], note = '') => {
    const topIds = toppings.map((t) => t.id).sort().join(',');
    const key = `${product.id}|${topIds}|${note.trim().toLowerCase()}`;
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.key === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { key, product, quantity: 1, selectedToppings: toppings, note: note.trim() }];
    });
  };

  const unitPrice = (l: DineCartLine) =>
    l.product.price + l.selectedToppings.reduce((s, t) => s + (Number(t.price) || 0), 0);

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const totalPrice = lines.reduce((s, l) => s + unitPrice(l) * l.quantity, 0);

  const handleSubmit = async () => {
    if (!table || lines.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/dine-in/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: table.branchId,
          tableNumber: table.tableNumber,
          token: table.qrToken,
          customerName: guestName.trim() || `Khách · ${table.tableName}`,
          notes,
          paymentMethod,
          items: lines.map((l) => ({
            productId: l.product.id,
            productName: l.product.name,
            quantity: l.quantity,
            selectedToppings: l.selectedToppings,
            note: l.note,
          })),
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        sessionStorage.setItem(storageKey, data.data.orderCode);
        setActiveOrder(data.data);
        setLines([]);
        setCartOpen(false);
        setNotes('');
      } else {
        alert(data.message || 'Không thể gửi đơn');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (tableErr) {
    return (
      <div className="min-h-screen bg-[#FFFAF0] flex items-center justify-center p-5">
        <div className="bg-white rounded-[16px] border border-[#fecdd3] p-6 max-w-sm w-full text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#fff1f2] text-[#A30029] flex items-center justify-center mx-auto font-bold text-xl">!</div>
          <h1 className="text-[17px] font-bold text-[#181d26]">Không nhận diện được mã QR bàn</h1>
          <p className="text-[13px] text-[#41454d] leading-relaxed">{tableErr}</p>
        </div>
      </div>
    );
  }

  // Live Order Tracking + VietQR View
  if (activeOrder) {
    const stepIdx = STATUS_STEPS.findIndex((s) => s.key === activeOrder.status);
    const needsQr = activeOrder.paymentMethod === 'Sepay' && activeOrder.paymentStatus !== 'Paid' && activeOrder.status !== 'Cancelled';

    return (
      <div className="min-h-screen bg-[#FFFAF0] p-4 pb-12 max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-[16px] border border-[#dddddd] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-[#A30029]">NooNee · Tại bàn</span>
              <h1 className="text-[18px] font-extrabold text-[#181d26]">Đơn #{activeOrder.orderCode}</h1>
              <p className="text-[12px] text-[#64748b]">{activeOrder.tableName || table?.tableName}</p>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                activeOrder.paymentStatus === 'Paid'
                  ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]'
                  : 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3]'
              }`}
            >
              {activeOrder.paymentStatus === 'Paid' ? 'Đã thanh toán' : activeOrder.paymentMethod === 'Sepay' ? 'Chờ quét QR' : 'Thanh toán tại bàn'}
            </span>
          </div>

          {/* 4-Step Live Progress */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {STATUS_STEPS.map((st, idx) => {
              const active = idx <= (stepIdx === -1 ? 0 : stepIdx);
              return (
                <div key={st.key} className="space-y-1.5 text-center">
                  <div className={`h-1.5 rounded-full ${active ? 'bg-[#A30029]' : 'bg-gray-200'}`} />
                  <div className={`text-[10px] font-semibold leading-tight ${active ? 'text-[#181d26]' : 'text-[#9297a0]'}`}>
                    {st.label}
                  </div>
                </div>
              );
            })}
          </div>

          {activeOrder.status === 'Completed' && (
            <div className="p-3 rounded-[10px] bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] text-[12px] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Chúc quý khách ngon miệng! Đơn hàng đã hoàn tất.</span>
            </div>
          )}

          {/* Ordered Items */}
          {activeOrder.items && activeOrder.items.length > 0 && (
            <div className="border-t border-[#f1f5f9] pt-3 space-y-2 text-[13px]">
              {activeOrder.items.map((it, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <div>
                    <span className="font-bold text-[#A30029] mr-1.5">{it.quantity}×</span>
                    <span className="font-medium text-[#181d26]">{it.productName}</span>
                    {it.toppings && <div className="text-[11px] text-[#64748b] pl-5">+ {it.toppings}</div>}
                  </div>
                  <span className="font-semibold text-[#181d26] shrink-0">{formatVND(it.price * it.quantity)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#dddddd] flex justify-between font-bold text-[15px]">
                <span>Tổng cộng</span>
                <span className="text-[#A30029]">{formatVND(activeOrder.totalAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {needsQr && (
          <div className="bg-white rounded-[16px] border border-[#dddddd] p-4 shadow-xs">
            <VietQRCode
              orderCode={activeOrder.orderCode}
              amount={activeOrder.totalAmount}
              bankName={payCfg.bankName}
              accountNo={payCfg.accountNo}
              accountName={payCfg.accountName}
              simulationEnabled={payCfg.simulationEnabled}
              onPaymentSuccess={() => refreshOrder(activeOrder.orderCode)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem(storageKey);
            setActiveOrder(null);
          }}
          className="w-full h-12 bg-[#181d26] text-white font-bold rounded-[12px] text-[14px] cursor-pointer"
        >
          + Gọi thêm lượt món mới
        </button>
      </div>
    );
  }

  // Sort categories so Combo giá ưu đãi appears right after "Tất cả"
  const sortedCategories = [...categories].sort((a, b) => {
    const aCombo = a.slug === 'combo-gia-uu-dai' ? 0 : 1;
    const bCombo = b.slug === 'combo-gia-uu-dai' ? 0 : 1;
    return aCombo - bCombo;
  });

  const visibleProducts = products.filter((p) => {
    if (activeCat !== 'all' && p.categoryId !== activeCat) return false;
    if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FFFAF0] pb-28 max-w-md mx-auto">
      {/* Compact Sticky Table Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#dddddd] px-4 pt-3 pb-2.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#A30029]">
              NooNee · {branch === 2 ? '269 Cầu Giấy' : '120 Yên Lãng'}
            </div>
            <h1 className="text-[17px] font-extrabold text-[#181d26]">
              {table ? `${table.tableNumber} · ${table.tableName}` : 'Đang tải bàn...'}
            </h1>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#fff1f2] text-[#A30029] border border-[#fecdd3]">
            Phục vụ tại bàn
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#9297a0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm món ăn, đồ uống, combo..."
            className="w-full h-9 pl-9 pr-3 bg-[#f8fafc] border border-[#dddddd] rounded-[8px] text-[13px] focus:outline-none focus:border-[#A30029]"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            type="button"
            onClick={() => setActiveCat('all')}
            className={`h-8 px-3 rounded-full text-[12px] font-bold whitespace-nowrap cursor-pointer ${
              activeCat === 'all' ? 'bg-[#181d26] text-white' : 'bg-[#f8fafc] text-[#41454d] border border-[#dddddd]'
            }`}
          >
            Tất cả
          </button>
          {sortedCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCat(c.id)}
              className={`h-8 px-3 rounded-full text-[12px] font-bold whitespace-nowrap cursor-pointer ${
                activeCat === c.id ? 'bg-[#A30029] text-white' : 'bg-[#f8fafc] text-[#41454d] border border-[#dddddd]'
              }`}
            >
              {c.slug === 'combo-gia-uu-dai' ? '🎁 ' : ''}{c.name}
            </button>
          ))}
        </div>
      </header>

      {/* Mobile Compact Menu List */}
      <div className="p-3.5 space-y-2.5">
        {visibleProducts.map((p) => {
          const itemQty = lines.filter((l) => l.product.id === p.id).reduce((s, l) => s + l.quantity, 0);
          const isCombo = p.categoryName?.toLowerCase().includes('combo') || p.slug.includes('combo');
          return (
            <div
              key={p.id}
              className="bg-white rounded-[12px] p-3 border border-[#dddddd] flex items-center gap-3 shadow-xs"
            >
              <div className="w-20 h-20 rounded-[8px] overflow-hidden bg-[#f8fafc] shrink-0 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                {isCombo && (
                  <span className="absolute top-1 left-1 bg-[#A30029] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    ƯU ĐÃI
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[14px] text-[#181d26] leading-snug line-clamp-1">{p.name}</h3>
                <p className="text-[11px] text-[#64748b] line-clamp-2 mt-0.5">{p.description}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[14px] font-extrabold text-[#A30029]">{formatVND(p.price)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (p.toppings && p.toppings.length > 0) {
                        setPickingDish(p);
                        setPickedTops([]);
                        setPickedNote('');
                      } else {
                        addLine(p);
                      }
                    }}
                    className="h-8 px-3 rounded-[8px] bg-[#A30029] text-white text-[12px] font-bold cursor-pointer"
                  >
                    {itemQty > 0 ? `+ Thêm (${itemQty})` : '+ Chọn'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dish Topping / Note Sheet */}
      {pickingDish && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-end justify-center">
          <div className="bg-white rounded-t-[20px] w-full max-w-md p-4 space-y-3.5 max-h-[82vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#dddddd] pb-2.5">
              <div>
                <h3 className="font-bold text-[15px] text-[#181d26]">{pickingDish.name}</h3>
                <span className="text-[13px] font-bold text-[#A30029]">{formatVND(pickingDish.price)}</span>
              </div>
              <button type="button" onClick={() => setPickingDish(null)} className="p-1 text-[#64748b]">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="text-[12px] font-semibold text-[#41454d]">Chọn món thêm (tùy chọn)</div>
              {(pickingDish.toppings || []).map((t) => {
                const checked = pickedTops.some((x) => x.id === t.id);
                return (
                  <label key={t.id} className="flex items-center justify-between p-2.5 border border-[#dddddd] rounded-[8px] text-[13px]">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setPickedTops((prev) => (checked ? prev.filter((x) => x.id !== t.id) : [...prev, t]))
                        }
                      />
                      <span>{t.name}</span>
                    </span>
                    <span className="font-semibold text-[#A30029]">+{formatVND(t.price)}</span>
                  </label>
                );
              })}
            </div>
            <input
              value={pickedNote}
              onChange={(e) => setPickedNote(e.target.value)}
              placeholder="Ghi chú riêng cho món này (không hành, ít đá...)"
              className="w-full h-10 px-3 border border-[#dddddd] rounded-[8px] text-[13px]"
            />
            <button
              type="button"
              onClick={() => {
                addLine(pickingDish, pickedTops, pickedNote);
                setPickingDish(null);
              }}
              className="w-full h-11 bg-[#A30029] text-white font-bold rounded-[10px] text-[14px]"
            >
              Thêm vào giỏ tại bàn
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {totalQty > 0 && !cartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto p-3 bg-gradient-to-t from-[#FFFAF0] via-[#FFFAF0] to-transparent">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="w-full h-13 px-4 py-3.5 bg-[#A30029] text-white rounded-[12px] shadow-lg flex items-center justify-between font-bold text-[14px] cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>Xem món đã chọn ({totalQty})</span>
            </span>
            <span>{formatVND(totalPrice)}</span>
          </button>
        </div>
      )}

      {/* Checkout Sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-[20px] w-full max-w-md p-4 space-y-3.5 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#dddddd] pb-2.5">
              <h2 className="text-[16px] font-bold text-[#181d26]">
                Xác nhận gọi món · {table?.tableNumber}
              </h2>
              <button type="button" onClick={() => setCartOpen(false)} className="p-1 text-[#64748b]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="divide-y divide-[#f1f5f9] max-h-60 overflow-y-auto">
              {lines.map((l) => (
                <div key={l.key} className="py-2.5 flex items-start justify-between gap-2 text-[13px]">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#181d26]">{l.product.name}</div>
                    {l.selectedToppings.length > 0 && (
                      <div className="text-[11px] text-[#64748b]">+ {l.selectedToppings.map((t) => t.name).join(', ')}</div>
                    )}
                    {l.note && <div className="text-[11px] text-[#A30029] italic">{l.note}</div>}
                    <div className="font-bold text-[#A30029] mt-0.5">{formatVND(unitPrice(l) * l.quantity)}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setLines((prev) =>
                          prev
                            .map((x) => (x.key === l.key ? { ...x, quantity: x.quantity - 1 } : x))
                            .filter((x) => x.quantity > 0)
                        )
                      }
                      className="w-7 h-7 rounded border border-[#dddddd] font-bold"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold">{l.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setLines((prev) => prev.map((x) => (x.key === l.key ? { ...x, quantity: x.quantity + 1 } : x)))
                      }
                      className="w-7 h-7 rounded bg-[#181d26] text-white font-bold"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                      className="p-1 text-[#9297a0]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#dddddd]">
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Tên của bạn (tùy chọn để nhân viên tiện xưng hô)"
                className="w-full h-10 px-3 border border-[#dddddd] rounded-[8px] text-[13px]"
              />
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú thêm cho bếp (ít cay, mang khăn giấy...)"
                className="w-full h-10 px-3 border border-[#dddddd] rounded-[8px] text-[13px]"
              />

              <div className="text-[12px] font-semibold text-[#41454d] pt-1">Hình thức thanh toán</div>
              <div className="grid grid-cols-2 gap-2 text-[12px] font-bold">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`h-10 rounded-[8px] border ${
                    paymentMethod === 'COD' ? 'bg-[#181d26] text-white border-[#181d26]' : 'bg-white text-[#41454d] border-[#dddddd]'
                  }`}
                >
                  Tiền mặt tại bàn
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Sepay')}
                  className={`h-10 rounded-[8px] border ${
                    paymentMethod === 'Sepay' ? 'bg-[#A30029] text-white border-[#A30029]' : 'bg-white text-[#41454d] border-[#dddddd]'
                  }`}
                >
                  Chuyển khoản VietQR
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#dddddd]">
              <span className="text-[14px] font-semibold text-[#41454d]">Tổng thanh toán</span>
              <span className="text-[18px] font-extrabold text-[#A30029]">{formatVND(totalPrice)}</span>
            </div>

            <button
              type="button"
              disabled={submitting || lines.length === 0}
              onClick={handleSubmit}
              className="w-full h-12 bg-[#A30029] text-white font-bold rounded-[12px] text-[15px] disabled:opacity-50"
            >
              {submitting ? 'Đang gửi xuống bếp...' : 'Gửi đơn gọi món ngay'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DineInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFAF0] p-8 text-center text-[13px] text-[#41454d]">Đang mở thực đơn tại bàn...</div>}>
      <DineInContent />
    </Suspense>
  );
}
