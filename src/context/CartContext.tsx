'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, ProductTopping } from '@/types';

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
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function generateCartItemId(productId: number, toppings: ProductTopping[] = [], note = ''): string {
  const topKey = (toppings || []).map((t) => t.id).sort().join('-');
  const noteKey = (note || '').trim().toLowerCase().replace(/\s+/g, '_');
  return `item_${productId}_${topKey || 'base'}_${noteKey || 'none'}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('food_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Normalize cart items with new schema
        const normalized: CartItem[] = parsed.map((item: any) => {
          const toppings = item.selectedToppings || [];
          const note = item.note || '';
          const toppingsPrice = toppings.reduce((s: number, t: any) => s + (t.price || 0), 0);
          const itemPrice = item.itemPrice || item.product.price + toppingsPrice;
          const cartItemId = item.cartItemId || generateCartItemId(item.product.id, toppings, note);
          return {
            cartItemId,
            product: item.product,
            quantity: item.quantity,
            selectedToppings: toppings,
            note,
            itemPrice,
          };
        });
        setCart(normalized);
      }
    } catch (e) {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('food_cart', JSON.stringify(cart));
      } catch (e) {
        // ignore
      }
    }
  }, [cart, isLoaded]);

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedToppings: ProductTopping[] = [],
    note = ''
  ) => {
    const toppingsPrice = selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0);
    const itemPrice = product.price + toppingsPrice;
    const cartItemId = generateCartItemId(product.id, selectedToppings, note);

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [
        ...prev,
        {
          cartItemId,
          product,
          quantity,
          selectedToppings,
          note: note.trim(),
          itemPrice,
        },
      ];
    });
    setIsCartOpen(true);
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
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const updateItemNote = (cartItemId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, note: note.trim() } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
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
