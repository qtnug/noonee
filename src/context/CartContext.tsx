'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, CartItem, ProductTopping } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import {
  generateCartItemId,
  normalizeCartItem,
  isProductAvailableAtBranch,
  normalizeBranchId,
} from '@/lib/cartUtils';

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

const LEGACY_GUEST_CART_KEY = 'food_cart';
function guestCartKey(branchId: number): string {
  return `food_cart_branch_${normalizeBranchId(branchId)}`;
}

function readGuestCart(branchId: number): CartItem[] {
  const safeBranch = normalizeBranchId(branchId);
  try {
    const key = guestCartKey(safeBranch);
    let saved = localStorage.getItem(key);

    // Di chuyển dữ liệu key cũ (nếu có) về đúng cơ sở hợp lệ rồi xóa key cũ
    if (!saved) {
      const legacy = localStorage.getItem(LEGACY_GUEST_CART_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy)) {
          const validForB1 = (parsedLegacy.map(normalizeCartItem).filter(Boolean) as CartItem[]).filter(
            (i) => isProductAvailableAtBranch(i.product, 1)
          );
          const validForB2 = (parsedLegacy.map(normalizeCartItem).filter(Boolean) as CartItem[]).filter(
            (i) => i.product.branchId === 2
          );
          if (validForB1.length > 0) localStorage.setItem(guestCartKey(1), JSON.stringify(validForB1));
          if (validForB2.length > 0) localStorage.setItem(guestCartKey(2), JSON.stringify(validForB2));
        }
        localStorage.removeItem(LEGACY_GUEST_CART_KEY);
        saved = localStorage.getItem(key);
      }
    }

    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return (parsed.map(normalizeCartItem).filter(Boolean) as CartItem[]).filter((item) =>
      isProductAvailableAtBranch(item.product, safeBranch)
    );
  } catch {
    return [];
  }
}

function clearGuestCartForBranch(branchId: number) {
  try {
    localStorage.removeItem(guestCartKey(branchId));
    localStorage.removeItem(LEGACY_GUEST_CART_KEY);
  } catch {
    // ignore
  }
}

function clearAllGuestCarts() {
  try {
    localStorage.removeItem(guestCartKey(1));
    localStorage.removeItem(guestCartKey(2));
    localStorage.removeItem(LEGACY_GUEST_CART_KEY);
  } catch {
    // ignore
  }
}

/** Payload gửi lên server kèm branchId */
function toServerPayload(items: CartItem[], branchId: number): string {
  return JSON.stringify({
    branchId: normalizeBranchId(branchId),
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

function parseServerItems(data: unknown, branchId: number): CartItem[] {
  if (!Array.isArray(data)) return [];
  return (data.map(normalizeCartItem).filter(Boolean) as CartItem[]).filter((item) =>
    isProductAvailableAtBranch(item.product, branchId)
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { currentBranch, isBranchReady } = useBranch();
  const userId = user?.id ?? null;
  const branchId = normalizeBranchId(currentBranch?.id);
  const scopeKey = `${userId ?? 'guest'}_${branchId}`;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [serverSyncReady, setServerSyncReady] = useState(false);

  const loadedScopeRef = useRef<string | undefined>(undefined);
  const prevUserIdRef = useRef<number | null | undefined>(undefined);
  const lastSyncedPayloadRef = useRef<string>('');
  const inFlightSyncRef = useRef<boolean>(false);
  const queuedSyncRef = useRef<{ payload: string; scopeKey: string } | null>(null);

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
      if (data?.success && loadedScopeRef.current === next.scopeKey) {
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

  function scheduleServerSync(payload: string, targetScopeKey: string) {
    queuedSyncRef.current = { payload, scopeKey: targetScopeKey };
    void flushSyncQueue();
  }

  // 1. Nạp giỏ hàng riêng mỗi khi đổi tài khoản HOẶC đổi cơ sở (branchId)
  useEffect(() => {
    if (authLoading || !isBranchReady) return;
    if (loadedScopeRef.current === scopeKey) return;

    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = userId;
    loadedScopeRef.current = scopeKey;
    lastSyncedPayloadRef.current = '';
    queuedSyncRef.current = null;
    setServerSyncReady(false);

    // Khách vãng lai: nạp giỏ hàng riêng của cơ sở đang chọn
    if (userId === null) {
      if (typeof prevUserId === 'number') {
        setCart([]);
        clearAllGuestCarts();
      } else {
        setCart(readGuestCart(branchId));
      }
      setIsLoaded(true);
      return;
    }

    // Đã đăng nhập: nạp giỏ hàng riêng của (userId, branchId)
    setIsLoaded(false);
    const guestItems = readGuestCart(branchId);

    (async () => {
      try {
        const res =
          guestItems.length > 0
            ? await fetch('/api/cart/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: toServerPayload(guestItems, branchId),
              })
            : await fetch(`/api/cart?branchId=${branchId}`, { cache: 'no-store' });
        const data = await res.json();

        if (loadedScopeRef.current !== scopeKey) return;

        if (data?.success) {
          const items = parseServerItems(data.data, branchId);
          lastSyncedPayloadRef.current = toServerPayload(items, branchId);
          setCart(items);
          clearGuestCartForBranch(branchId);
          setServerSyncReady(true);
        } else {
          setCart(guestItems);
        }
      } catch (err) {
        console.error('Không thể tải giỏ hàng của tài khoản:', err);
        if (loadedScopeRef.current === scopeKey) setCart(guestItems);
      } finally {
        if (loadedScopeRef.current === scopeKey) setIsLoaded(true);
      }
    })();
  }, [authLoading, isBranchReady, scopeKey, userId, branchId]);

  // 2. Lưu giỏ hàng theo đúng cơ sở đang chọn
  useEffect(() => {
    if (!isLoaded || !isBranchReady) return;
    if (loadedScopeRef.current !== scopeKey) return;

    if (userId === null) {
      try {
        localStorage.setItem(guestCartKey(branchId), JSON.stringify(cart));
      } catch {
        // ignore
      }
      return;
    }

    if (!serverSyncReady) return;
    const payload = toServerPayload(cart, branchId);
    if (payload === lastSyncedPayloadRef.current) return;

    scheduleServerSync(payload, scopeKey);
  }, [cart, userId, branchId, scopeKey, isLoaded, isBranchReady, serverSyncReady]);

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedToppings: ProductTopping[] = [],
    note = ''
  ) => {
    if (!isProductAvailableAtBranch(product, branchId)) {
      return;
    }
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
      const emptyPayload = toServerPayload([], branchId);
      lastSyncedPayloadRef.current = emptyPayload;
      queuedSyncRef.current = null;
      fetch(`/api/cart?branchId=${branchId}`, { method: 'DELETE', keepalive: true }).catch((err) =>
        console.error('Không thể xóa giỏ hàng trên tài khoản:', err)
      );
    }
  };

  const restoreCart = (items: CartItem[]) => {
    const valid = (items.map(normalizeCartItem).filter(Boolean) as CartItem[]).filter((item) =>
      isProductAvailableAtBranch(item.product, branchId)
    );
    setCart(valid);
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
