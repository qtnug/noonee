import React from 'react';
import AdminGuard from '@/components/AdminGuard';
import AdminLayoutShell from '@/components/AdminLayoutShell';

export const metadata = {
  title: 'Quản trị hệ thống NooNee - Workspace',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminGuard>
  );
}
