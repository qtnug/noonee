'use client';

import React, { useEffect, useState } from 'react';
import {
  CiSearch as Search,
  CiTrash as Trash2,
  CiCircleRemove as X,
  CiCircleCheck as CheckCircle2,
} from 'react-icons/ci';
import VietQRCode from '@/components/VietQRCode';
import { useAdminBranch } from '@/context/AdminBranchContext';
import { formatVND } from '@/lib/utils';
import type { Category, Product, ProductTopping, RestaurantTable } from '@/types';

interface PosLine {
  key: string;
  product: Product;
  quantity: number;
  selectedToppings: ProductTopping[];
  note: string;
}

export default function AdminPosPage() {
  const { adminBranch } = useAdminBranch();
  const effectiveBranch = adminBranch === 'all' ? 1 : Number(adminBranch);

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [activeCat, setActiveCat] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  const [lines, setLines] = useState<PosLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Sepay'>('COD');
  const [submitting, setSubmitting] = useState(false);

  // Topping modal for customizable dish
  const [pickingProduct, setPickingProduct] = useState<Product | null>(null);
  const [pickedTops, setPickedTops] = useState<ProductTopping[]>([]);
  const [pickedNote, setPickedNote] = useState('');

  // Active VietQR / Success modal
  const [qrOrder, setQrOrder] = useState<{ orderCode: string; totalAmount: number; tableName: string; paid: boolean } | null>(null);
  const [payCfg, setPayCfg] = useState({ bankName: '', accountNo: '', accountName: '', simulationEnabled: false });

  useEffect(() => {
    fetch('/api/payment-config')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setPayCfg(d.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      const [tRes, cRes, pRes] = await Promise.all([
        fetch(`/api/admin/tables?branchId=${adminBranch}`),
        fetch('/api/categories'),
        fetch(`/api/products?branch=${effectiveBranch}&limit=200`),
      ]);
      const [tData, cData, pData] = await Promise.all([tRes.json(), cRes.json(), pRes.json()]);
      if (tData.success) {
        const active: RestaurantTable[] = (tData.data || []).filter((t: RestaurantTable) => t.isActive);
        setTables(active);
        setSelectedTableId((prev) => (active.some((t) => t.id === prev) ? prev : active[0]?.id ?? null));
      }
      if (cData.success) setCategories(cData.data || []);
      if (pData.success) setProducts((pData.data || []).filter((p: Product) => p.isAvailable));
    };
    load();
  }, [adminBranch, effectiveBranch]);

  // Poll payment status when QR modal is open
  useEffect(() => {
    if (!qrOrder || qrOrder.paid) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/dine-in/orders?code=${qrOrder.orderCode}`);
        const d = await res.json();
        if (d.success && d.data?.paymentStatus === 'Paid') {
          setQrOrder((prev) => (prev ? { ...prev, paid: true } : null));
        }
      } catch {}
    }, 2500);
    return () => clearInterval(id);
  }, [qrOrder]);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null;

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

  const handleDishClick = (p: Product) => {
    if (p.toppings && p.toppings.length > 0) {
      setPickingProduct(p);
      setPickedTops([]);
      setPickedNote('');
    } else {
      addLine(p);
    }
  };

  const unitPrice = (l: PosLine) =>
    l.product.price + l.selectedToppings.reduce((s, t) => s + (Number(t.price) || 0), 0);

  const total = lines.reduce((s, l) => s + unitPrice(l) * l.quantity, 0);

  const handleSubmit = async () => {
    if (!selectedTable || lines.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/dine-in/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedTable.branchId,
          tableNumber: selectedTable.tableNumber,
          token: selectedTable.qrToken,
          customerName: customerName.trim() || `Khách · ${selectedTable.tableName}`,
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
      if (data.success) {
        const ord = data.data;
        setLines([]);
        setNotes('');
        setCustomerName('');
        if (paymentMethod === 'Sepay') {
          setQrOrder({
            orderCode: ord.orderCode,
            totalAmount: ord.totalAmount,
            tableName: selectedTable.tableName,
            paid: false,
          });
        } else {
          setQrOrder({
            orderCode: ord.orderCode,
            totalAmount: ord.totalAmount,
            tableName: selectedTable.tableName,
            paid: true,
          });
        }
      } else {
        alert(data.message || 'Không thể tạo đơn');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const visibleProducts = products.filter((p) => {
    if (selectedTable && p.branchId !== null && p.branchId !== undefined && Number(p.branchId) !== selectedTable.branchId) {
      return false;
    }
    if (activeCat !== 'all' && p.categoryId !== activeCat) return false;
    if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left: Table & Menu Picker */}
      <div className="lg:col-span-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-normal text-[#181d26]">Nhân viên Order tại bàn (POS)</h1>
            <p className="text-[13px] text-[#41454d] mt-0.5">Chọn bàn đang phục vụ, thêm món/topping và chuyển thẳng xuống KDS.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#9297a0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhanh tên món..."
              className="w-full h-9 pl-9 pr-3 bg-white border border-[#dddddd] rounded-[6px] text-[13px]"
            />
          </div>
        </div>

        {/* Active Tables Strip */}
        <div className="bg-white p-3 rounded-[10px] border border-[#dddddd] space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9297a0]">Chọn bàn phục vụ</div>
          {tables.length === 0 ? (
            <p className="text-[13px] text-[#A30029]">Chưa có bàn nào đang mở. Hãy tạo hoặc mở khóa bàn ở mục Quản lý bàn &amp; QR.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTableId(t.id)}
                  className={`h-9 px-3 rounded-[6px] text-[12px] font-semibold border transition cursor-pointer ${
                    selectedTableId === t.id
                      ? 'bg-[#A30029] text-white border-[#A30029]'
                      : 'bg-[#f8fafc] text-[#333840] border-[#dddddd] hover:bg-white'
                  }`}
                >
                  CS{t.branchId} · {t.tableNumber} ({t.capacity} ghế)
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveCat('all')}
            className={`h-8 px-3 rounded-[6px] text-[12px] font-semibold border shrink-0 cursor-pointer ${
              activeCat === 'all' ? 'bg-[#181d26] text-white border-[#181d26]' : 'bg-white text-[#41454d] border-[#dddddd]'
            }`}
          >
            Tất cả món
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCat(c.id)}
              className={`h-8 px-3 rounded-[6px] text-[12px] font-semibold border shrink-0 cursor-pointer ${
                activeCat === c.id ? 'bg-[#A30029] text-white border-[#A30029]' : 'bg-white text-[#41454d] border-[#dddddd]'
              }`}
            >
              {c.slug === 'combo-gia-uu-dai' ? '🎁 ' : ''}{c.name}
            </button>
          ))}
        </div>

        {/* Dish Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {visibleProducts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleDishClick(p)}
              className="bg-white border border-[#dddddd] hover:border-[#A30029] rounded-[10px] p-2.5 text-left flex flex-col justify-between transition shadow-xs cursor-pointer group"
            >
              <div>
                <div className="aspect-[4/3] rounded-[6px] overflow-hidden bg-[#f8fafc] mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="text-[13px] font-semibold text-[#181d26] line-clamp-2 leading-snug">{p.name}</div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#A30029]">{formatVND(p.price)}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#fff1f2] text-[#A30029] font-semibold">+ Thêm</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Order Ticket */}
      <div className="lg:col-span-4 bg-white border border-[#dddddd] rounded-[10px] p-4 space-y-4 sticky top-6">
        <div className="border-b border-[#dddddd] pb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#9297a0] uppercase font-semibold">Phiếu order tại bàn</div>
            <h2 className="text-[16px] font-bold text-[#181d26]">
              {selectedTable ? `${selectedTable.tableNumber} · ${selectedTable.tableName}` : 'Chưa chọn bàn'}
            </h2>
          </div>
          {lines.length > 0 && (
            <button
              type="button"
              onClick={() => setLines([])}
              className="text-[12px] text-[#A30029] hover:underline cursor-pointer"
            >
              Xóa hết
            </button>
          )}
        </div>

        <div className="divide-y divide-[#f1f5f9] max-h-72 overflow-y-auto">
          {lines.length === 0 ? (
            <p className="text-[13px] text-[#9297a0] py-10 text-center">Bấm vào món bên trái để thêm vào phiếu</p>
          ) : (
            lines.map((l) => (
              <div key={l.key} className="py-2.5 flex items-start justify-between gap-2 text-[13px]">
                <div className="min-w-0">
                  <div className="font-semibold text-[#181d26] truncate">{l.product.name}</div>
                  {l.selectedToppings.length > 0 && (
                    <div className="text-[11px] text-[#64748b]">+ {l.selectedToppings.map((t) => t.name).join(', ')}</div>
                  )}
                  {l.note && <div className="text-[11px] text-[#A30029] italic">{l.note}</div>}
                  <div className="text-[12px] font-semibold text-[#A30029] mt-0.5">{formatVND(unitPrice(l) * l.quantity)}</div>
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
                    className="w-6 h-6 rounded border border-[#dddddd] text-[#181d26] font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-semibold text-[12px]">{l.quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setLines((prev) => prev.map((x) => (x.key === l.key ? { ...x, quantity: x.quantity + 1 } : x)))
                    }
                    className="w-6 h-6 rounded bg-[#181d26] text-white font-bold cursor-pointer"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                    className="p-1 text-[#9297a0] hover:text-[#A30029] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2.5 pt-2 border-t border-[#dddddd]">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Tên khách / số khách (tùy chọn)"
            className="w-full h-9 px-3 border border-[#dddddd] rounded-[6px] text-[12px]"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú chung cho bếp (ít cay, ra món cùng lúc...)"
            className="w-full h-9 px-3 border border-[#dddddd] rounded-[6px] text-[12px]"
          />
          <div className="grid grid-cols-2 gap-2 text-[12px] font-semibold">
            <button
              type="button"
              onClick={() => setPaymentMethod('COD')}
              className={`h-9 rounded-[6px] border cursor-pointer ${
                paymentMethod === 'COD' ? 'bg-[#181d26] text-white border-[#181d26]' : 'bg-white text-[#41454d] border-[#dddddd]'
              }`}
            >
              Tiền mặt (COD)
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('Sepay')}
              className={`h-9 rounded-[6px] border cursor-pointer ${
                paymentMethod === 'Sepay' ? 'bg-[#A30029] text-white border-[#A30029]' : 'bg-white text-[#41454d] border-[#dddddd]'
              }`}
            >
              Quét mã VietQR
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-[#dddddd] flex items-center justify-between">
          <span className="text-[14px] font-semibold text-[#41454d]">Tổng thanh toán</span>
          <span className="text-[18px] font-bold text-[#A30029]">{formatVND(total)}</span>
        </div>

        <button
          type="button"
          disabled={submitting || !selectedTable || lines.length === 0}
          onClick={handleSubmit}
          className="w-full h-11 bg-[#A30029] hover:bg-[#850021] text-white font-bold rounded-[8px] text-[14px] disabled:opacity-50 cursor-pointer"
        >
          {submitting ? 'Đang gửi xuống bếp...' : 'Xác nhận lên đơn'}
        </button>
      </div>

      {/* Topping Modal */}
      {pickingProduct && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] border border-[#dddddd] max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#dddddd] pb-3">
              <h3 className="font-bold text-[15px] text-[#181d26]">{pickingProduct.name}</h3>
              <button type="button" onClick={() => setPickingProduct(null)} className="p-1 text-[#9297a0] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="text-[12px] font-semibold text-[#41454d]">Chọn món thêm (tùy chọn)</div>
              {(pickingProduct.toppings || []).map((top) => {
                const checked = pickedTops.some((t) => t.id === top.id);
                return (
                  <label key={top.id} className="flex items-center justify-between p-2.5 border border-[#dddddd] rounded-[6px] text-[13px] cursor-pointer">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setPickedTops((prev) =>
                            checked ? prev.filter((x) => x.id !== top.id) : [...prev, top]
                          )
                        }
                      />
                      <span>{top.name}</span>
                    </span>
                    <span className="font-semibold text-[#A30029]">+{formatVND(top.price)}</span>
                  </label>
                );
              })}
            </div>
            <input
              value={pickedNote}
              onChange={(e) => setPickedNote(e.target.value)}
              placeholder="Ghi chú riêng cho món này..."
              className="w-full h-9 px-3 border border-[#dddddd] rounded-[6px] text-[12px]"
            />
            <button
              type="button"
              onClick={() => {
                addLine(pickingProduct, pickedTops, pickedNote);
                setPickingProduct(null);
              }}
              className="w-full h-10 bg-[#A30029] text-white font-semibold rounded-[6px] text-[13px] cursor-pointer"
            >
              Thêm vào phiếu
            </button>
          </div>
        </div>
      )}

      {/* VietQR / Order Created Modal */}
      {qrOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[12px] border border-[#dddddd] max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#dddddd] pb-3">
              <div>
                <div className="text-[11px] font-semibold text-[#16a34a] uppercase">Đã chuyển xuống KDS</div>
                <h3 className="text-[16px] font-bold text-[#181d26]">Đơn #{qrOrder.orderCode} · {qrOrder.tableName}</h3>
              </div>
              <button type="button" onClick={() => setQrOrder(null)} className="p-1 text-[#9297a0] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrOrder.paid ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#16a34a] mx-auto" />
                <div className="text-[15px] font-bold text-[#181d26]">Đơn đã sẵn sàng phục vụ!</div>
                <p className="text-[13px] text-[#41454d]">Tổng tiền: <strong>{formatVND(qrOrder.totalAmount)}</strong></p>
              </div>
            ) : (
              <VietQRCode
                orderCode={qrOrder.orderCode}
                amount={qrOrder.totalAmount}
                bankName={payCfg.bankName}
                accountNo={payCfg.accountNo}
                accountName={payCfg.accountName}
                simulationEnabled={payCfg.simulationEnabled}
                onPaymentSuccess={() => setQrOrder((prev) => (prev ? { ...prev, paid: true } : null))}
              />
            )}

            <button
              type="button"
              onClick={() => setQrOrder(null)}
              className="w-full h-10 bg-[#181d26] text-white font-semibold rounded-[6px] text-[13px] cursor-pointer"
            >
              Đóng &amp; Tiếp tục order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
