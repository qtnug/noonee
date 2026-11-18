'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export type AdminBranch = 'all' | '1' | '2';

interface AdminBranchContextType {
  adminBranch: AdminBranch;
  setAdminBranch: (branch: AdminBranch) => void;
  canSwitchBranch: boolean;
}

const AdminBranchContext = createContext<AdminBranchContextType>({
  adminBranch: 'all',
  setAdminBranch: () => {},
  canSwitchBranch: true,
});

export function AdminBranchProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [adminBranchState, setAdminBranchState] = useState<AdminBranch>('all');

  const isBranchLocked = user?.role === 'manager' || user?.role === 'staff';
  const lockedBranch: AdminBranch = user?.branchId === 2 ? '2' : '1';

  useEffect(() => {
    if (isBranchLocked) return;
    try {
      const saved = localStorage.getItem('noonee_admin_branch') as AdminBranch;
      if (saved && (saved === 'all' || saved === '1' || saved === '2')) {
        setAdminBranchState(saved);
      }
    } catch {
      // ignore
    }
  }, [isBranchLocked]);

  const setAdminBranch = (branch: AdminBranch) => {
    if (isBranchLocked) return;
    setAdminBranchState(branch);
    try {
      localStorage.setItem('noonee_admin_branch', branch);
    } catch {
      // ignore
    }
  };

  const effectiveBranch: AdminBranch = isBranchLocked ? lockedBranch : adminBranchState;

  return (
    <AdminBranchContext.Provider
      value={{
        adminBranch: effectiveBranch,
        setAdminBranch,
        canSwitchBranch: !isBranchLocked,
      }}
    >
      {children}
    </AdminBranchContext.Provider>
  );
}

export function useAdminBranch() {
  return useContext(AdminBranchContext);
}
