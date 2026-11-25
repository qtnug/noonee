'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, CartItem, ProductTopping } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { generateCartItemId, normalizeCartItem } from '@/lib/cartUtils';

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedToppings?: ProductTopping[],
    note?: string
  ) => void;
  removeFromCart: (cartItemId: string | number) => void;
  updateQuantity: (cartItemId: string | number, quantity: number) => void;
  updateItemNote: (cartItemId: string, note: string) => void;
  clearCart: () => void;
  restoreCart: (items: CartItem[]) => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Giỏ hàng khách vãng lai (chưa đăng nhập) chỉ lưu ở localStorage
const GUEST_CART_KEY = 'food_cart';

function readGuestCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(GUEST_CART_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCartItem).filter(Boolean) as CartItem[];
  } catch {
    return [];
  }
}

function clearGuestCart() {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // ignore
  }
}

/** Payload gửi lên server: chỉ gửi mã món, số lượng, topping, ghi chú (giá do server tự tính) */
function toServerPayload(items: CartItem[]): string {
  return JSON.stringify({
    items: items.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
      selectedToppings: (i.selectedToppings || []).map((t) => ({
        id: t.id,
        name: t.name,
        price: t.price,
      })),
      note: i.note || '',
    })),
  });
}

function parseServerItems(data: unknown): CartItem[] {
  if (!Array.isArray(data)) return [];
  return data.map(normalizeCartItem).filter(Boolean) as CartItem[];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  // true khi state giỏ hàng đã khớp với giỏ hàng của tài khoản trên server → bắt đầu đồng bộ
  const [serverSyncReady, setServerSyncReady] = useState(false);

  // undefined = chưa khởi tạo; null = khách vãng lai; number = id tài khoản đã nạp giỏ hàng
  const loadedForUserRef = useRef<number | null | undefined>(undefined);
  // payload lần cuối đã lưu thành công lên server (tránh gửi lặp)
  const lastSyncedPayloadRef = useRef<string>('');
  // Hàng đợi single-flight: gửi ngay lập tức thay đổi đầu tiên, gộp các thay đổi liên tiếp kế tiếp
  const inFlightSyncRef = useRef<boolean>(false);
  const queuedSyncRef = useRef<{ payload: string; userId: number } | null>(null);

  async function flushSyncQueue() {
    if (inFlightSyncRef.current) return;
    const next = queuedSyncRef.current;
    if (!next) return;

    queuedSyncRef.current = null;
    inFlightSyncRef.current = true;
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: next.payload,
        keepalive: true,
      });
      const data = await res.json().catch(() => null);
      if (data?.success && loadedForUserRef.current === next.userId) {
        lastSyncedPayloadRef.current = next.payload;
      }
    } catch (err) {
      console.error('Không thể lưu giỏ hàng lên tài khoản:', err);
    } finally {
      inFlightSyncRef.current = false;
      if (queuedSyncRef.current) {
        void flushSyncQueue();
      }
    }
  }

  function scheduleServerSync(payload: string, targetUserId: number) {
    queuedSyncRef.current = { payload, userId: targetUserId };
    void flushSyncQueue();
  }

  // 1. Nạp giỏ hàng mỗi khi trạng thái đăng nhập thay đổi
  useEffect(() => {
    if (authLoading) return;

    const previousUser = loadedForUserRef.current;
    if (previousUser === userId) return;
    loadedForUserRef.current = userId;
    lastSyncedPayloadRef.current = '';
    queuedSyncRef.current = null;
    setServerSyncReady(false);

    // Khách vãng lai
    if (userId === null) {
      if (typeof previousUser === 'number') {
        // Vừa đăng xuất: không giữ lại giỏ hàng của tài khoản trước trên thiết bị này
        setCart([]);
        clearGuestCart();
      } else {
        setCart(readGuestCart());
      }
      setIsLoaded(true);
      return;
    }

    // Đã đăng nhập: nạp giỏ hàng của tài khoản (gộp giỏ khách vãng lai nếu có)
    setIsLoaded(false);
    const guestItems = readGuestCart();

    (async () => {
      try {
        const res =
          guestItems.length > 0
            ? await fetch('/api/cart/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: toServerPayload(guestItems),
              })
            : await fetch('/api/cart', { cache: 'no-store' });
        const data = await res.json();

        // Bỏ qua kết quả nếu người dùng đã đổi tài khoản trong lúc chờ
        if (loadedForUserRef.current !== userId) return;

        if (data?.success) {
          const items = parseServerItems(data.data);
          lastSyncedPayloadRef.current = toServerPayload(items);
          setCart(items);
          clearGuestCart();
          setServerSyncReady(true);
        } else {
          // Không tải được giỏ hàng tài khoản: giữ giỏ tạm, không ghi đè dữ liệu trên server
          setCart(guestItems);
        }
      } catch (err) {
        console.error('Không thể tải giỏ hàng của tài khoản:', err);
        if (loadedForUserRef.current === userId) setCart(guestItems);
      } finally {
        if (loadedForUserRef.current === userId) setIsLoaded(true);
      }
    })();
  }, [authLoading, userId]);

  // 2. Lưu giỏ hàng ngay lập tức: khách → localStorage, tài khoản → server (single-flight)
  useEffect(() => {
    if (!isLoaded) return;

    if (userId === null) {
      try {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
      } catch {
        // ignore
      }
      return;
    }

    if (!serverSyncReady) return;
    const payload = toServerPayload(cart);
    if (payload === lastSyncedPayloadRef.current) return;

    scheduleServerSync(payload, userId);
  }, [cart, userId, isLoaded, serverSyncReady]);

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedToppings: ProductTopping[] = [],
    note = ''
  ) => {
    const toppingsPrice = selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0);
    const itemPrice = product.price + toppingsPrice;
    const cleanNote = note.trim();
    const cartItemId = generateCartItemId(product.id, selectedToppings, cleanNote);

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
            : item
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          product,
          quantity: Math.min(99, quantity),
          selectedToppings,
          note: cleanNote,
          itemPrice,
        },
      ];
    });
  };

  const removeFromCart = (cartItemId: string | number) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          item.cartItemId !== String(cartItemId) &&
          item.product.id !== Number(cartItemId)
      )
    );
  };

  const updateQuantity = (cartItemId: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (
          item.cartItemId === String(cartItemId) ||
          item.product.id === Number(cartItemId)
        ) {
          return { ...item, quantity: Math.min(99, quantity) };
        }
        return item;
      })
    );
  };

  const updateItemNote = (cartItemId: string, note: string) => {
    const cleanNote = note.trim();
    setCart((prev) => {
      const targetIndex = prev.findIndex((item) => item.cartItemId === cartItemId);
      if (targetIndex === -1) return prev;
      const target = prev[targetIndex];
      const nextCartItemId = generateCartItemId(
        target.product.id,
        target.selectedToppings || [],
        cleanNote
      );
      if (nextCartItemId === target.cartItemId) {
        return prev.map((item, idx) =>
          idx === targetIndex ? { ...item, note: cleanNote } : item
        );
      }
      // Nếu ghi chú mới trùng với 1 dòng đã có sẵn trong giỏ thì gộp số lượng
      const duplicateIndex = prev.findIndex(
        (item, idx) => idx !== targetIndex && item.cartItemId === nextCartItemId
      );
      if (duplicateIndex > -1) {
        return prev
          .map((item, idx) =>
            idx === duplicateIndex
              ? { ...item, quantity: Math.min(99, item.quantity + target.quantity) }
              : item
          )
          .filter((_, idx) => idx !== targetIndex);
      }
      return prev.map((item, idx) =>
        idx === targetIndex
          ? { ...item, cartItemId: nextCartItemId, note: cleanNote }
          : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
    if (typeof userId === 'number' && serverSyncReady) {
      const emptyPayload = toServerPayload([]);
      lastSyncedPayloadRef.current = emptyPayload;
      queuedSyncRef.current = null;
      fetch('/api/cart', { method: 'DELETE', keepalive: true }).catch((err) =>
        console.error('Không thể xóa giỏ hàng trên tài khoản:', err)
      );
    }
  };

  const restoreCart = (items: CartItem[]) => {
    setCart(items.map(normalizeCartItem).filter(Boolean) as CartItem[]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + (item.itemPrice || item.product.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemNote,
        clearCart,
        restoreCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
