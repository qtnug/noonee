'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: number[];
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  clearFavorites: () => void;
  favoriteCount: number;
  isLoaded: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Storage key is user-specific if user is logged in, or shared guest key
  const storageKey = user?.id ? `noonee_favorites_${user.id}` : 'noonee_favorites_guest';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setFavorites(JSON.parse(saved));
      } else {
        // If logged in and user-specific key is empty, check if guest has favorites to migrate
        const guestSaved = localStorage.getItem('noonee_favorites_guest');
        if (user?.id && guestSaved) {
          const parsed = JSON.parse(guestSaved);
          setFavorites(parsed);
          localStorage.setItem(storageKey, guestSaved);
        } else {
          setFavorites([]);
        }
      }
    } catch (e) {
      setFavorites([]);
    }
    setIsLoaded(true);
  }, [storageKey, user?.id]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(favorites));
      } catch (e) {}
    }
  }, [favorites, isLoaded, storageKey]);

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const isFavorite = (productId: number) => {
    return favorites.includes(productId);
  };

  const clearFavorites = () => {
    setFavorites([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {}
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        clearFavorites,
        favoriteCount: favorites.length,
        isLoaded,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
