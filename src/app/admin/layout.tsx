import React from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminGuard from '@/components/AdminGuard';
import AdminHeaderUser from '@/components/AdminHeaderUser';

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
      <div className="flex min-h-screen bg-[#f8fafc]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header (Airtable 64px top-bar) */}
          <header className="h-16 bg-white border-b border-[#dddddd] px-6 sm:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#006400]" />
              <span className="text-[13px] font-medium text-[#181d26]">Hệ thống trực tuyến</span>
              <span className="text-[12px] text-[#9297a0] hidden md:inline">• Kết nối CSDL Cloud & Cổng thanh toán ổn định</span>
            </div>
            <AdminHeaderUser />
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-6 sm:p-8 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
