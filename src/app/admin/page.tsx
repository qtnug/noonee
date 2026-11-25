'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CiDollar as DollarSign,
  CiShoppingBasket as ShoppingBag,
  CiClock2 as Clock,
  CiDeliveryTruck as Truck,
  CiCircleChevRight as ArrowRight,
  CiCircleChevUp as TrendingUp,
  CiForkAndKnife as UtensilsCrossed,
  CiWavePulse1 as Activity,
  CiBowlNoodles as CookingPot,
  CiCircleRemove as XCircle,
  CiCircleCheck as CheckCircle2,
  CiRedo as Loader2,
  CiCalendar as Calendar,
  CiMedal as Award,
  CiBowlNoodles as Flame,
  CiCircleCheck as CheckCheck,
  CiUser as Users,
  CiStar as Star,
  CiWarning as AlertTriangle,
  CiChat1 as MessageSquare,
  CiCreditCard1 as CreditCard,
  CiCircleChevDown as TrendingDown,
  CiSaveDown2 as Download,
} from 'react-icons/ci';
import * as XLSX from 'xlsx';
import { formatVND } from '@/lib/utils';
import { getMembershipTier } from '@/lib/membership';
import { Order } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useAdminBranch } from '@/context/AdminBranchContext';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function AdminOverviewPage() {
  const { user, isAdmin, isManager } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodState, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'all'>('week');
  const period = isManager ? 'today' : periodState;
  const { adminBranch: selectedBranch } = useAdminBranch();
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchStats = async (p = period, b = selectedBranch) => {
    try {
      const res = await fetch(`/api/admin/stats?period=${p}&branch=${b}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(period, selectedBranch);
  }, [period, selectedBranch]);

  useEffect(() => {
    const interval = setInterval(() => fetchStats(period, selectedBranch), 8000);
    return () => clearInterval(interval);
  }, [period, selectedBranch]);

  const handleUpdateStatus = async (orderCode: string, newStatus: string, newPaymentStatus?: string) => {
    setUpdatingCode(orderCode);
    // Optimistic UI update
    setStats((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        recentOrders: prev.recentOrders?.map((o: Order) => {
          if (o.orderCode === orderCode) {
            return {
              ...o,
              status: newStatus as any,
              paymentStatus: newPaymentStatus ? (newPaymentStatus as any) : o.paymentStatus,
            };
          }
          return o;
        }),
      };
    });

    try {
      const res = await fetch(`/api/orders/${orderCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, paymentStatus: newPaymentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        const labels: Record<string, string> = {
          Pending: 'Chờ tiếp nhận',
          Processing: 'Đang nấu',
          Delivering: 'Đang giao hàng',
          Completed: 'Đã hoàn thành',
          Cancelled: 'Đã hủy đơn',
        };
        setToastMessage(`Đã cập nhật đơn #${orderCode} sang [${labels[newStatus] || newStatus}]`);
        setTimeout(() => setToastMessage(null), 3000);
      }
      fetchStats(period);
    } catch (e) {
      console.error(e);
      fetchStats(period);
    } finally {
      setUpdatingCode(null);
    }
  };

  const periodLabels: Record<string, string> = {
    today: 'Hôm nay',
    week: 'Tuần này (7 ngày)',
    month: 'Tháng này',
    quarter: 'Quý này (3 tháng)',
    all: 'Toàn thời gian',
  };

  const handleExportExcel = () => {
    if (!stats) return;
    const wb = XLSX.utils.book_new();
    const branchLabel =
      selectedBranch === '1'
        ? 'Cơ sở 1 (120 Yên Lãng)'
        : selectedBranch === '2'
        ? 'Cơ sở 2 (269 Cầu Giấy)'
        : 'Toàn hệ thống';

    const overviewSheet = XLSX.utils.json_to_sheet([
      { 'Chỉ số': 'Kỳ báo cáo', 'Giá trị': periodLabels[period] || period },
      { 'Chỉ số': 'Cơ sở áp dụng', 'Giá trị': branchLabel },
      { 'Chỉ số': 'Tổng doanh thu (VNĐ)', 'Giá trị': stats.totalRevenue || 0 },
      { 'Chỉ số': 'Tổng đơn hàng', 'Giá trị': stats.totalOrders || 0 },
      { 'Chỉ số': 'Đơn hoàn thành', 'Giá trị': stats.completedOrders || 0 },
      { 'Chỉ số': 'Đơn đã hủy', 'Giá trị': stats.cancelledOrders || 0 },
      { 'Chỉ số': 'Giá trị TB / Đơn (AOV)', 'Giá trị': stats.averageOrderValue || 0 },
      { 'Chỉ số': 'Tổng phần ăn đã bán', 'Giá trị': stats.totalItemsSold || 0 },
      { 'Chỉ số': 'Tổng khách hàng thành viên', 'Giá trị': stats.totalCustomers || 0 },
      { 'Chỉ số': 'Điểm đánh giá trung bình', 'Giá trị': stats.reviewSummary?.averageRating || 0 },
      { 'Chỉ số': 'Tổng lượt đánh giá', 'Giá trị': stats.reviewSummary?.totalReviews || 0 },
    ]);
    XLSX.utils.book_append_sheet(wb, overviewSheet, 'TongQuan');

    if (stats.dailyRevenueTrend?.length) {
      const trendSheet = XLSX.utils.json_to_sheet(
        stats.dailyRevenueTrend.map((d: any) => ({
          'Ngày / Khung giờ': d.label,
          'Doanh thu (VNĐ)': d.revenue,
          'Số đơn hợp lệ': d.orders,
        }))
      );
      XLSX.utils.book_append_sheet(wb, trendSheet, 'DoanhThuTheoNgay');
    }

    if (stats.topProducts?.length) {
      const prodSheet = XLSX.utils.json_to_sheet(
        stats.topProducts.map((p: any, i: number) => ({
          'Hạng': i + 1,
          'Tên món': p.name,
          'Số phần đã bán': p.quantity,
          'Số đơn': p.orderCount || 0,
          'Doanh thu (VNĐ)': p.revenue,
        }))
      );
      XLSX.utils.book_append_sheet(wb, prodSheet, 'TopMonBanChay');
    }

    if (stats.topCustomers?.length) {
      const cusSheet = XLSX.utils.json_to_sheet(
        stats.topCustomers.map((c: any, i: number) => ({
          'Hạng': i + 1,
          'Họ tên': c.fullName,
          'Tên đăng nhập': c.username || '',
          'Số điện thoại': c.phone,
          'Hạng thành viên': getMembershipTier(c.totalSpent).name,
          'Số đơn': c.orderCount,
          'Tổng chi tiêu (VNĐ)': c.totalSpent,
        }))
      );
      XLSX.utils.book_append_sheet(wb, cusSheet, 'KhachHangVIP');
    }

    const reviewRows = [
      ...(stats.topRatedProducts || []).map((p: any) => ({
        'Phân loại': 'Đánh giá cao nhất',
        'Tên món': p.name,
        'Điểm TB': p.avgRating,
        'Số đánh giá': p.reviewCount,
        'Ghi chú': '',
      })),
      ...(stats.lowRatedProducts || []).map((p: any) => ({
        'Phân loại': 'Cần cải thiện',
        'Tên món': p.name,
        'Điểm TB': p.avgRating,
        'Số đánh giá': p.reviewCount,
        'Ghi chú': p.sampleComment || '',
      })),
    ];
    if (reviewRows.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reviewRows), 'DanhGiaMonAn');
    }

    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `NooNee_BaoCao_${period}_CS${selectedBranch}_${dateStamp}.xlsx`);
    setToastMessage('Đã xuất file báo cáo Excel (.xlsx) thành công!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-normal text-[#181d26]">
            Tổng quan hoạt động
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#41454d] mt-0.5 sm:mt-1">
            Theo dõi doanh thu, trạng thái đơn hàng và hiệu suất bán hàng thời gian thực
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={!stats}
            className="h-9 sm:h-10 px-3 sm:px-4 bg-white hover:bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] text-[12px] sm:text-[13px] font-medium rounded-[6px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
          <Link
            href="/admin/products"
            className="h-9 sm:h-10 px-3 sm:px-4 bg-[#A30029] hover:bg-[#850021] active:bg-[#a60b20] text-white text-[12px] sm:text-[13px] font-medium rounded-[6px] flex items-center gap-1.5 transition shadow-xs"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Thêm món mới</span>
          </Link>
          {isAdmin && (
            <Link
              href="/admin/diagnostics"
              className="h-9 sm:h-10 px-3 sm:px-4 bg-white hover:bg-[#f8fafc] text-[#181d26] border border-[#dddddd] text-[12px] sm:text-[13px] font-medium rounded-[6px] flex items-center gap-1.5 transition"
            >
              <Activity className="w-4 h-4 text-[#006400]" />
              <span>CSDL & Chẩn đoán</span>
            </Link>
          )}
        </div>
      </div>

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181d26] text-white px-4 py-3 rounded-[8px] shadow-lg flex items-center gap-2.5 text-[13px] animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#39bf45]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Time Period Filter Bar (Admin: all periods; Manager: Today only) */}
      <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#dddddd] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#181d26]">
          <Calendar className="w-4 h-4 text-[#A30029]" />
          <span>Kỳ báo cáo doanh thu:</span>
          <span className="text-[#A30029] font-bold">({periodLabels[period]})</span>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {(['today', 'week', 'month', 'quarter', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-[12px] rounded-lg transition whitespace-nowrap cursor-pointer ${
                  period === p
                    ? 'bg-[#A30029] text-white shadow-xs font-bold'
                    : 'bg-gray-100 hover:bg-gray-200 text-[#475569] font-medium'
                }`}
              >
                {p === 'today' && 'Hôm nay'}
                {p === 'week' && 'Tuần này'}
                {p === 'month' && 'Tháng này'}
                {p === 'quarter' && 'Quý này'}
                {p === 'all' && 'Toàn thời gian'}
              </button>
            ))}
          </div>
        ) : (
          <span className="px-3 py-1.5 text-[12px] rounded-lg bg-[#A30029] text-white font-bold self-start sm:self-auto">
            Doanh thu ngày hôm nay
          </span>
        )}
      </div>

      {/* Chain Branch Breakdown Comparison (Displayed when All Branches is selected) */}
      {selectedBranch === 'all' && stats?.branchBreakdown && (
        <div className="bg-white p-4 sm:p-6 rounded-[10px] border border-[#dddddd] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dddddd]">
            <h3 className="text-[15px] font-semibold text-[#181d26]">
              Phân bổ doanh thu & đơn hàng ({periodLabels[period]})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch 1 Card */}
            <div className="p-4 bg-[#f8fafc] rounded-[8px] border border-[#dddddd] space-y-2">
              <div className="text-[13px] font-semibold text-[#181d26]">
                Cơ sở 1: 120 Yên Lãng
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-[#9297a0] block">Doanh thu</span>
                  <span className="text-[18px] font-semibold text-[#A30029]">
                    {formatVND(stats.branchBreakdown.branch1?.revenue || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#9297a0] block">Tổng đơn</span>
                  <span className="text-[18px] font-semibold text-[#181d26]">
                    {stats.branchBreakdown.branch1?.orders || 0} đơn
                  </span>
                </div>
              </div>
            </div>

            {/* Branch 2 Card */}
            <div className="p-4 bg-[#f8fafc] rounded-[8px] border border-[#dddddd] space-y-2">
              <div className="text-[13px] font-semibold text-[#181d26]">
                Cơ sở 2: 269 Cầu Giấy
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-[#9297a0] block">Doanh thu</span>
                  <span className="text-[18px] font-semibold text-[#A30029]">
                    {formatVND(stats.branchBreakdown.branch2?.revenue || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#9297a0] block">Tổng đơn</span>
                  <span className="text-[18px] font-semibold text-[#181d26]">
                    {stats.branchBreakdown.branch2?.orders || 0} đơn
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid (2-cols on mobile, 4-cols on lg) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-4 sm:p-6 rounded-[10px] border border-[#dddddd] hover:border-[#fecdd3] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[12px] sm:text-[13px] text-[#9297a0] font-medium">
            <span>Doanh thu ({periodLabels[period]})</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[#181d26] flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-semibold text-[#181d26] truncate">
            {stats ? formatVND(stats.totalRevenue) : '...'}
          </div>
          <span className="text-[11px] sm:text-[12px] text-[#006400] font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Doanh thu thực tế</span>
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-4 sm:p-6 rounded-[10px] border border-[#dddddd] hover:border-[#fecdd3] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[12px] sm:text-[13px] text-[#9297a0] font-medium">
            <span>Tổng đơn ({periodLabels[period]})</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[#181d26] flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-semibold text-[#181d26]">
            {stats ? stats.totalOrders : '...'}
          </div>
          <span className="text-[11px] sm:text-[12px] text-[#9297a0] truncate block">
            {stats?.completedOrders ? `${stats.completedOrders} đơn hoàn tất` : 'Đơn đặt trong kỳ'}
          </span>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-4 sm:p-6 rounded-[10px] border border-[#dddddd] hover:border-[#fecdd3] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[12px] sm:text-[13px] text-[#9297a0] font-medium">
            <span>TB / Đơn (AOV)</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[#181d26] flex items-center justify-center">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-semibold text-[#181d26] truncate">
            {stats ? formatVND(stats.averageOrderValue || 0) : '...'}
          </div>
          <span className="text-[11px] sm:text-[12px] text-amber-600 font-medium truncate block">
            Giá trị trung bình mỗi đơn
          </span>
        </div>

        {/* Live Active Orders */}
        <div className="bg-white p-4 sm:p-6 rounded-[10px] border border-[#dddddd] hover:border-[#fecdd3] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[12px] sm:text-[13px] text-[#9297a0] font-medium">
            <span>Đang xử lý / Giao</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] bg-[#fff1f2] border border-[#fecdd3] text-[#A30029] flex items-center justify-center">
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-semibold text-[#A30029]">
            {stats ? (stats.pendingOrders || 0) + (stats.deliveringOrders || 0) : '...'}
          </div>
          <span className="text-[11px] sm:text-[12px] text-[#A30029] truncate block">
            {stats?.pendingOrders || 0} chờ nấu • {stats?.deliveringOrders || 0} đang giao
          </span>
        </div>

        {/* Total Dishes Sold */}
        <div className="bg-white p-4 sm:p-6 rounded-[10px] border border-[#dddddd] hover:border-[#fecdd3] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[12px] sm:text-[13px] text-[#9297a0] font-medium">
            <span>Số phần ăn đã bán</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-semibold text-[#181d26]">
            {stats ? `${stats.totalItemsSold || 0} phần` : '...'}
          </div>
          <span className="text-[11px] sm:text-[12px] text-[#64748b] truncate block">
            Trong {stats?.totalProducts || 0} món đang kinh doanh
          </span>
        </div>

        {/* Total Registered Customers */}
        <div className="bg-white p-4 sm:p-6 rounded-[10px] border border-[#dddddd] hover:border-[#fecdd3] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[12px] sm:text-[13px] text-[#9297a0] font-medium">
            <span>Khách hàng thành viên</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-semibold text-[#181d26]">
            {stats ? `${stats.totalCustomers || 0} tài khoản` : '...'}
          </div>
          <span className="text-[11px] sm:text-[12px] text-blue-600 font-medium truncate block">
            {stats?.topCustomers?.length || 0} khách đặt nhiều trong kỳ
          </span>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-4 sm:p-6 rounded-[10px] border border-[#dddddd] hover:border-[#fecdd3] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[12px] sm:text-[13px] text-[#9297a0] font-medium">
            <span>Điểm đánh giá TB</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-semibold text-[#181d26] flex items-baseline gap-1.5">
            <span>{stats?.reviewSummary?.averageRating ? `${stats.reviewSummary.averageRating} ★` : '...'}</span>
            <span className="text-[12px] font-normal text-[#9297a0]">/ 5.0</span>
          </div>
          <span className="text-[11px] sm:text-[12px] text-amber-600 font-medium truncate block">
            {stats?.reviewSummary?.totalReviews || 0} lượt đánh giá thực tế
          </span>
        </div>

        {/* Review Health (5 star vs <=3 star) */}
        <div className="bg-white p-4 sm:p-6 rounded-[10px] border border-[#dddddd] hover:border-[#fecdd3] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[12px] sm:text-[13px] text-[#9297a0] font-medium">
            <span>Đánh giá cần chú ý</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] bg-rose-50 border border-rose-200 text-[#A30029] flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-semibold text-[#181d26]">
            {stats?.reviewSummary ? `${stats.reviewSummary.lowStarCount || 0} phản hồi` : '...'}
          </div>
          <span className="text-[11px] sm:text-[12px] text-emerald-600 font-medium truncate block">
            {stats?.reviewSummary?.fiveStarCount || 0} đánh giá 5★ xuất sắc
          </span>
        </div>
      </div>

      {/* ── BIỂU ĐỒ XU HƯỚNG DOANH THU THEO NGÀY / GIỜ ────────────────────── */}
      <div className="bg-white rounded-[10px] border border-[#dddddd] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#dddddd]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#A30029]" />
            <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26]">
              Xu hướng doanh thu {period === 'today' ? 'theo khung giờ' : 'theo ngày'} ({periodLabels[period]})
            </h2>
          </div>
          <span className="text-[12px] text-[#64748b]">
            {stats?.dailyRevenueTrend?.length || 0} mốc ghi nhận giao dịch
          </span>
        </div>

        {stats?.dailyRevenueTrend && stats.dailyRevenueTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={stats.dailyRevenueTrend}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="nooneeRevGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A30029" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#A30029" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(v: number) =>
                  v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                }
              />
              <Tooltip
                formatter={(value: any, name: any) =>
                  name === 'revenue' ? [formatVND(Number(value) || 0), 'Doanh thu'] : [`${value} đơn`, 'Số đơn']
                }
                labelFormatter={(label: any) => (period === 'today' ? `Khung giờ ${label}` : `Ngày ${label}`)}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#A30029"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#nooneeRevGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-10 text-center text-[13px] text-[#9297a0]">
            Chưa có dữ liệu xu hướng doanh thu trong kỳ này
          </div>
        )}
      </div>

      {/* ── BIỂU ĐỒ PHÂN BỔ TRẠNG THÁI ĐƠN HÀNG + TOP SẢN PHẨM ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Pie Chart: Trạng thái đơn hàng */}
        <div className="lg:col-span-5 bg-white rounded-[10px] border border-[#dddddd] p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#dddddd]">
            <Activity className="w-4 h-4 text-[#A30029]" />
            <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26]">
              Phân bổ trạng thái đơn ({periodLabels[period]})
            </h2>
          </div>

          {stats ? (() => {
            const pieData = [
              { name: 'Hoàn thành', value: stats.completedOrders || 0, color: '#16a34a' },
              { name: 'Đang giao', value: stats.deliveringOrders || 0, color: '#2563eb' },
              { name: 'Chờ nấu', value: stats.pendingOrders || 0, color: '#f59e0b' },
              { name: 'Đã hủy', value: stats.cancelledOrders || 0, color: '#A30029' },
            ].filter(d => d.value > 0);

            if (pieData.length === 0) {
              return (
                <div className="py-10 text-center text-[13px] text-[#9297a0]">
                  Chưa có dữ liệu đơn hàng trong kỳ này
                </div>
              );
            }

            return (
              <div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value} đơn`, name]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2 text-[12px]">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[#555a64]">{d.name}</span>
                      <span className="font-bold text-[#181d26] ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })() : (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#A30029]" />
            </div>
          )}
        </div>

        {/* Bar Chart: Top 5 sản phẩm bán chạy */}
        <div className="lg:col-span-7 bg-white rounded-[10px] border border-[#dddddd] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dddddd]">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#A30029]" />
              <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26]">
                Top 5 món bán chạy ({periodLabels[period]})
              </h2>
            </div>
            <Link href="/admin/products" className="text-[12px] sm:text-[13px] font-medium text-[#A30029] hover:underline">
              Quản lý thực đơn
            </Link>
          </div>

          {stats?.topProducts && stats.topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={stats.topProducts.map((p: any) => ({ name: p.name.length > 14 ? p.name.substring(0, 14) + '…' : p.name, 'Số phần': p.quantity, revenue: p.revenue, fullName: p.name }))}
                margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#555a64' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9297a0' }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    `${value} phần`,
                    props?.payload?.fullName || name,
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #ddd', fontSize: '12px' }}
                />
                <Bar dataKey="Số phần" fill="#A30029" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-10 text-center text-[13px] text-[#9297a0]">
              Chưa có dữ liệu món bán chạy trong kỳ này
            </div>
          )}

          {/* Danh sách chi tiết kèm doanh thu */}
          {stats?.topProducts && stats.topProducts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#f0f0f0]">
              {stats.topProducts.slice(0, 5).map((prod: any, idx: number) => (
                <div key={prod.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-slate-100 text-slate-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                    }`}>{idx + 1}</span>
                    <span className="text-[#0f172a] truncate font-medium">{prod.name}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-bold text-[#A30029]">{prod.quantity} phần</span>
                    <span className="text-[10px] text-gray-400 ml-1">• {formatVND(prod.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── KHÁCH HÀNG ĐẶT NHIỀU NHẤT + THANH TOÁN & MÓN BÁN CHẬM ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Customers VIP */}
        <div className="lg:col-span-7 bg-white rounded-[10px] border border-[#dddddd] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dddddd]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#A30029]" />
              <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26]">
                Khách hàng đặt nhiều nhất ({periodLabels[period]})
              </h2>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Top VIP
            </span>
          </div>

          {stats?.topCustomers && stats.topCustomers.length > 0 ? (
            <div className="divide-y divide-[#f1f5f9]">
              {stats.topCustomers.map((cus: any, idx: number) => {
                const tier = getMembershipTier(cus.totalSpent || 0);
                return (
                <div key={`${cus.userId}-${cus.phone}-${idx}`} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : idx === 1
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : idx === 2
                          ? 'bg-orange-100 text-orange-700 border border-orange-300'
                          : 'bg-[#fff1f2] text-[#A30029] border border-[#fecdd3]'
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#181d26] flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{cus.fullName}</span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${tier.bgBadge}`}
                        >
                          {tier.badge}
                        </span>
                        {cus.username && (
                          <span className="text-[11px] font-normal text-[#9297a0]">
                            @{cus.username}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#64748b] truncate">{cus.phone}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[13px] font-bold text-[#A30029] block">
                      {cus.orderCount} đơn
                    </span>
                    <span className="text-[11px] font-medium text-[#475569]">
                      {formatVND(cus.totalSpent)}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-[13px] text-[#9297a0]">
              Chưa có dữ liệu khách đặt hàng trong kỳ này
            </div>
          )}
        </div>

        {/* Payment Method Breakdown + Slow-moving Dishes */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[10px] border border-[#dddddd] p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#dddddd]">
              <CreditCard className="w-4 h-4 text-[#A30029]" />
              <h2 className="text-[15px] font-semibold text-[#181d26]">
                Phương thức thanh toán
              </h2>
            </div>
            {stats?.paymentBreakdown && stats.paymentBreakdown.length > 0 ? (() => {
              const totalPayOrders = stats.paymentBreakdown.reduce((s: number, x: any) => s + x.orderCount, 0) || 1;
              const methodInfo: Record<string, { label: string; color: string }> = {
                Sepay: { label: 'Chuyển khoản VietQR (SePay)', color: '#A30029' },
                COD: { label: 'Tiền mặt (COD)', color: '#f59e0b' },
                Wallet: { label: 'Ví NooNee', color: '#2563eb' },
              };
              return (
                <div className="space-y-3">
                  {stats.paymentBreakdown.map((pm: any) => {
                    const info = methodInfo[pm.method] || { label: pm.method, color: '#64748b' };
                    const pct = Math.round((pm.orderCount / totalPayOrders) * 100);
                    return (
                      <div key={pm.method} className="space-y-1">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="font-medium text-[#181d26]">{info.label}</span>
                          <span className="text-[#475569] font-semibold">
                            {pm.orderCount} đơn ({pct}%) • {formatVND(pm.revenue)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: info.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })() : (
              <p className="text-[12px] text-[#9297a0] text-center py-4">Chưa có dữ liệu</p>
            )}
          </div>

          <div className="bg-white rounded-[10px] border border-[#dddddd] p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#dddddd]">
              <TrendingDown className="w-4 h-4 text-slate-500" />
              <h2 className="text-[15px] font-semibold text-[#181d26]">
                Món ít lượt đặt (Cần đẩy mạnh)
              </h2>
            </div>
            {stats?.lowSellingProducts && stats.lowSellingProducts.length > 0 ? (
              <div className="space-y-2">
                {stats.lowSellingProducts.map((p: any) => (
                  <div key={p.productId} className="flex items-center justify-between text-[12px] py-1">
                    <span className="text-[#333840] font-medium truncate pr-2">{p.name}</span>
                    <span className="shrink-0 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[11px]">
                      {p.soldCount} phần
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#9297a0] text-center py-3">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>

      {/* ── MÓN ĐÁNH GIÁ CAO NHẤT vs MÓN ĐÁNH GIÁ THẤP NHẤT ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highest Rated Products */}
        <div className="bg-white rounded-[10px] border border-[#dddddd] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dddddd]">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26]">
                Món ăn được đánh giá cao nhất
              </h2>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Chất lượng tốt
            </span>
          </div>

          {stats?.topRatedProducts && stats.topRatedProducts.length > 0 ? (
            <div className="divide-y divide-[#f1f5f9]">
              {stats.topRatedProducts.map((item: any, idx: number) => (
                <div key={item.productId} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-[6px] object-cover border border-[#dddddd] shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#181d26] truncate">
                        {idx + 1}. {item.name}
                      </div>
                      <div className="text-[11px] text-[#64748b]">
                        {formatVND(item.price)} • {item.reviewCount} lượt đánh giá
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[12px]">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{Number(item.avgRating).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[13px] text-[#9297a0]">
              Chưa có đánh giá món ăn
            </div>
          )}
        </div>

        {/* Lowest Rated Products */}
        <div className="bg-white rounded-[10px] border border-[#dddddd] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dddddd]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#A30029]" />
              <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26]">
                Món ăn đánh giá thấp (Cần cải thiện)
              </h2>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#fff1f2] text-[#A30029] border border-[#fecdd3]">
              Theo dõi bếp
            </span>
          </div>

          {stats?.lowRatedProducts && stats.lowRatedProducts.length > 0 ? (
            <div className="divide-y divide-[#f1f5f9]">
              {stats.lowRatedProducts.map((item: any) => (
                <div key={item.productId} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-[6px] object-cover border border-[#dddddd] shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#181d26] truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-[#64748b]">
                          {item.reviewCount} lượt đánh giá
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#A30029] font-bold text-[12px]">
                      <Star className="w-3.5 h-3.5 fill-[#A30029] text-[#A30029]" />
                      <span>{Number(item.avgRating).toFixed(1)}</span>
                    </div>
                  </div>
                  {item.sampleComment && (
                    <p className="text-[11px] text-[#64748b] italic bg-[#f8fafc] px-2.5 py-1.5 rounded border border-[#e2e8f0] line-clamp-1">
                      &ldquo;{item.sampleComment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[13px] text-[#9297a0]">
              Chưa có dữ liệu đánh giá thấp
            </div>
          )}
        </div>
      </div>

      {/* ── ĐÁNH GIÁ GẦN ĐÂY TỪ KHÁCH HÀNG ────────────────────────────────── */}
      {stats?.recentReviews && stats.recentReviews.length > 0 && (
        <div className="bg-white rounded-[10px] border border-[#dddddd] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#dddddd]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#A30029]" />
              <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26]">
                Phản hồi &amp; Đánh giá mới nhất từ khách hàng
              </h2>
            </div>
            <span className="text-[12px] text-[#64748b]">
              Tổng {stats?.reviewSummary?.totalReviews || 0} đánh giá
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {stats.recentReviews.map((rev: any) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[#181d26] truncate">
                      {rev.customerName}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        rev.rating >= 4
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#fff1f2] text-[#A30029] border border-[#fecdd3]'
                      }`}
                    >
                      {rev.rating} ★
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-[#A30029] truncate">
                    Món: {rev.productName}
                  </div>
                  <p className="text-[12px] text-[#475569] leading-relaxed line-clamp-2">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hiệu suất vận hành */}
      <div className="bg-white rounded-[10px] border border-[#dddddd] p-4 sm:p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[#dddddd] mb-4">
          <Activity className="w-4 h-4 text-[#006400]" />
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26]">
            Hiệu suất vận hành ({periodLabels[period]})
          </h2>
          <span className="ml-auto inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between text-[13px] mb-1">
              <span className="text-gray-600 flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> Đơn hoàn thành
              </span>
              <span className="font-bold text-emerald-600">
                {stats?.completedOrders || 0} ({stats?.totalOrders ? Math.round(((stats.completedOrders || 0) / stats.totalOrders) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stats?.totalOrders ? Math.min(100, Math.round(((stats.completedOrders || 0) / stats.totalOrders) * 100)) : 0}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[13px] mb-1">
              <span className="text-gray-600 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-red-400" /> Đơn đã hủy
              </span>
              <span className="font-bold text-gray-500">{stats?.cancelledOrders || 0} đơn</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-400 rounded-full transition-all duration-500"
                style={{ width: `${stats?.totalOrders ? Math.min(100, Math.round(((stats.cancelledOrders || 0) / stats.totalOrders) * 100)) : 0}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-gray-600 flex items-center gap-1">
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#9297a0]" /> Tổng sản phẩm
            </span>
            <span className="font-bold text-[#0f172a]">{stats?.totalProducts || 0} món</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-[10px] border border-[#dddddd] p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#dddddd]">
          <h2 className="text-[15px] sm:text-[16px] font-medium text-[#181d26]">Đơn hàng mới nhất</h2>
          <Link
            href="/admin/orders"
            className="text-[12px] sm:text-[13px] font-medium text-[#181d26] hover:text-[#A30029] flex items-center gap-1 transition"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] min-w-[700px]">
            <thead>
              <tr className="border-b border-[#dddddd] text-[#9297a0] uppercase tracking-wider font-medium text-[11px]">
                <th className="pb-3">Mã đơn</th>
                {selectedBranch === 'all' && <th className="pb-3">Cơ sở</th>}
                <th className="pb-3">Khách hàng</th>
                <th className="pb-3">Số tiền</th>
                <th className="pb-3">Phương thức</th>
                <th className="pb-3">Thanh toán</th>
                <th className="pb-3">Trạng thái bếp</th>
                <th className="pb-3 text-right">Cập nhật nhanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dddddd]">
              {stats?.recentOrders?.map((order: Order) => (
                <tr key={order.id} className="hover:bg-[#f8fafc] transition">
                  <td className="py-3.5 font-mono font-medium text-[#181d26]">
                    <Link href={`/orders/${order.orderCode}`} className="hover:underline">
                      #{order.orderCode}
                    </Link>
                  </td>
                  {selectedBranch === 'all' && (
                    <td className="py-3.5">
                      {order.branchId === 2 ? (
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#f8fafc] text-[#333840] border border-[#dddddd] text-[11px] font-medium whitespace-nowrap">
                          269 Cầu Giấy
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#f8fafc] text-[#333840] border border-[#dddddd] text-[11px] font-medium whitespace-nowrap">
                          120 Yên Lãng
                        </span>
                      )}
                    </td>
                  )}
                  <td className="py-3.5">
                    <span className="font-medium text-[#181d26] block">{order.customerName}</span>
                    <span className="text-[#9297a0] text-[12px]">{order.customerPhone}</span>
                  </td>
                  <td className="py-3.5 font-medium text-[#181d26]">
                    {formatVND(order.totalAmount)}
                  </td>
                  <td className="py-3.5">
                    {(() => {
                      const methodLabels: Record<string, string> = {
                        Sepay: 'Chuyển khoản (VietQR)',
                        COD: 'Tiền mặt (COD)',
                        Wallet: 'Ví NooNee',
                      };
                      const label = methodLabels[order.paymentMethod] || order.paymentMethod || 'Chuyển khoản';
                      return (
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#f8fafc] border border-[#dddddd] text-[#333840] text-[11px] font-medium whitespace-nowrap">
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium border whitespace-nowrap ${
                        order.paymentStatus === 'Paid'
                          ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]'
                          : 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3]'
                      }`}
                    >
                      {order.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </td>
                  <td className="py-3.5">
                    {(() => {
                      const badges: Record<string, { label: string; cls: string }> = {
                        Pending: { label: 'Chờ tiếp nhận', cls: 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3]' },
                        Processing: { label: 'Đang nấu', cls: 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]' },
                        Delivering: { label: 'Đang giao', cls: 'bg-[#faf5ff] text-[#7c3aed] border-[#e9d5ff]' },
                        Completed: { label: 'Hoàn thành', cls: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' },
                        Cancelled: { label: 'Đã hủy', cls: 'bg-[#f8fafc] text-[#64748b] border-[#e2e8f0]' },
                      };
                      const b = badges[order.status] || { label: order.status, cls: 'bg-[#f8fafc] text-[#64748b] border-[#dddddd]' };
                      return (
                        <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium border ${b.cls}`}>
                          {b.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {updatingCode === order.orderCode ? (
                        <span className="h-8 px-2.5 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[11px] text-[#9297a0] flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin text-[#A30029]" />
                          Lưu...
                        </span>
                      ) : (
                        <>
                          {order.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(order.orderCode, 'Processing')}
                                className="h-8 px-2.5 bg-[#A30029] hover:bg-[#850021] text-white text-[12px] font-medium rounded-[6px] flex items-center gap-1 transition shadow-xs cursor-pointer"
                                title="Tiếp nhận và bắt đầu nấu"
                              >
                                <CookingPot className="w-3.5 h-3.5" />
                                <span>Vào bếp</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(order.orderCode, 'Cancelled')}
                                className="h-8 px-2 bg-white border border-[#dddddd] text-[#9297a0] hover:text-[#A30029] hover:border-[#fecdd3] text-[12px] rounded-[6px] transition cursor-pointer"
                                title="Hủy đơn này"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {order.status === 'Processing' && (
                            <button
                              onClick={() => handleUpdateStatus(order.orderCode, 'Delivering')}
                              className="h-8 px-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-medium rounded-[6px] flex items-center gap-1 transition shadow-xs cursor-pointer"
                              title="Bếp nấu xong, giao shipper"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Giao Shipper</span>
                            </button>
                          )}
                          {order.status === 'Delivering' && (
                            <button
                              onClick={() => handleUpdateStatus(order.orderCode, 'Completed', 'Paid')}
                              className="h-8 px-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-[12px] font-medium rounded-[6px] flex items-center gap-1 transition shadow-xs cursor-pointer"
                              title="Khách đã nhận và thanh toán"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã giao & Thu tiền</span>
                            </button>
                          )}
                          {order.status === 'Completed' && (
                            <span className="text-[12px] text-[#16a34a] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất
                            </span>
                          )}
                          {order.status === 'Cancelled' && (
                            <span className="text-[12px] text-[#9297a0] flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Đã hủy
                            </span>
                          )}
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.orderCode, e.target.value)}
                            className="h-8 px-1 text-[11px] bg-white border border-[#dddddd] rounded-[6px] text-[#41454d] cursor-pointer hover:border-[#9297a0]"
                            title="Tùy chỉnh trạng thái bất kỳ"
                          >
                            <option value="Pending">Chờ</option>
                            <option value="Processing">Nấu</option>
                            <option value="Delivering">Giao</option>
                            <option value="Completed">Xong</option>
                            <option value="Cancelled">Hủy</option>
                          </select>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
