'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type AdminBranch = 'all' | '1' | '2';

interface AdminBranchContextType {
  adminBranch: AdminBranch;
  setAdminBranch: (branch: AdminBranch) => void;
}

const AdminBranchContext = createContext<AdminBranchContextType>({
  adminBranch: 'all',
  setAdminBranch: () => {},
});

export function AdminBranchProvider({ children }: { children: React.ReactNode }) {
  const [adminBranch, setAdminBranchState] = useState<AdminBranch>('all');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('noonee_admin_branch') as AdminBranch;
      if (saved && (saved === 'all' || saved === '1' || saved === '2')) {
        setAdminBranchState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setAdminBranch = (branch: AdminBranch) => {
    setAdminBranchState(branch);
    try {
      localStorage.setItem('noonee_admin_branch', branch);
    } catch {
      // ignore
    }
  };

  return (
    <AdminBranchContext.Provider value={{ adminBranch, setAdminBranch }}>
      {children}
    </AdminBranchContext.Provider>
  );
}

export function useAdminBranch() {
  return useContext(AdminBranchContext);
}
