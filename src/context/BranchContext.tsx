'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Branch } from '@/types';
import { BRANCHES, getBranchById, findNearestBranch } from '@/lib/branches';

interface BranchContextType {
  currentBranch: Branch;
  allBranches: Branch[];
  userCoords: { lat: number; lng: number } | null;
  isAutoDetected: boolean;
  isLocating: boolean;
  isBranchReady: boolean;
  selectBranch: (branchId: number | string) => void;
  detectAndSelectNearest: () => Promise<Branch>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [currentBranch, setCurrentBranch] = useState<Branch>(BRANCHES[0]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isBranchReady, setIsBranchReady] = useState(false);

  // Manual branch selection
  const selectBranch = useCallback((branchId: number | string) => {
    const branch = getBranchById(branchId);
    setCurrentBranch(branch);
    setIsAutoDetected(false);
    try {
      localStorage.setItem('noonee_selected_branch_id', String(branch.id));
      localStorage.setItem('noonee_branch_manual_choice', 'true');
    } catch (e) {}
  }, []);

  // Detect and select nearest branch using GPS coordinates
  const detectAndSelectNearest = useCallback(async (): Promise<Branch> => {
    setIsLocating(true);
    return new Promise<Branch>((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setIsLocating(false);
        resolve(currentBranch);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);

          const { nearestBranch } = findNearestBranch(coords.lat, coords.lng);
          setCurrentBranch(nearestBranch);
          setIsAutoDetected(true);
          try {
            localStorage.setItem('noonee_selected_branch_id', String(nearestBranch.id));
          } catch (e) {}
          resolve(nearestBranch);
        },
        (err) => {
          console.warn('Geolocation permission denied or unavailable:', err.message);
          setIsLocating(false);
          resolve(currentBranch);
        },
        { timeout: 7000, maximumAge: 300000 }
      );
    });
  }, [currentBranch]);

  // Initial load: check saved branch or quietly auto-detect nearest
  useEffect(() => {
    try {
      const savedBranchId = localStorage.getItem('noonee_selected_branch_id');
      const isManual = localStorage.getItem('noonee_branch_manual_choice') === 'true';

      if (savedBranchId) {
        setCurrentBranch(getBranchById(savedBranchId));
      }

      // If user hasn't made an explicit manual choice, attempt smart auto-detection
      if (!isManual && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserCoords(coords);
            const { nearestBranch } = findNearestBranch(coords.lat, coords.lng);
            setCurrentBranch(nearestBranch);
            setIsAutoDetected(true);
            try {
              localStorage.setItem('noonee_selected_branch_id', String(nearestBranch.id));
            } catch (e) {}
          },
          () => {
            // Geolocation denied/ignored: stay on default branch without interrupting user
          },
          { timeout: 5000, maximumAge: 300000 }
        );
      }
    } catch (e) {}
    setIsBranchReady(true);
  }, []);

  return (
    <BranchContext.Provider
      value={{
        currentBranch,
        allBranches: BRANCHES,
        userCoords,
        isAutoDetected,
        isLocating,
        isBranchReady,
        selectBranch,
        detectAndSelectNearest,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}

