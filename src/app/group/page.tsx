'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  PlusCircle,
  LogIn,
  Sparkles,
  Percent,
  QrCode,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  UtensilsCrossed,
  Clock,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function GroupOrderLandingPage() {
  const router = useRouter();
  const { user, getAuthHeader } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [hostName, setHostName] = useState(user?.fullName || '');
  const [groupCode, setGroupCode] = useState('');
  const [joinName, setJoinName] = useState(user?.fullName || '');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const name = hostName.trim() || user?.fullName || 'Trưởng nhóm';

    setIsCreating(true);
    try {
      const res = await fetch('/api/group/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ hostName: name }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Không thể tạo nhóm');
      }

      // Save member id in localStorage for this group
      if (typeof window !== 'undefined' && data.memberId) {
        localStorage.setItem(`noonee_group_member_${data.data.code}`, data.memberId);
        localStorage.setItem(`noonee_group_name_${data.data.code}`, name);
      }

      router.push(`/group/${data.data.code}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const code = groupCode.trim().toUpperCase();
    const name = joinName.trim() || user?.fullName;

    if (!code) {
      setErrorMsg('Vui lòng nhập mã nhóm');
      return;
    }
    if (!name) {
      setErrorMsg('Vui lòng nhập tên của bạn để tham gia nhóm');
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`/api/group/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Không thể tham gia nhóm');
      }

      // Save member id in localStorage
      if (typeof window !== 'undefined' && data.member?.id) {
        localStorage.setItem(`noonee_group_member_${code}`, data.member.id);
        localStorage.setItem(`noonee_group_name_${code}`, name);
      }

      router.push(`/group/${code}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="bg-[#fcfbf9] min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] text-[13px] font-semibold tracking-wide">
            <Sparkles className="w-4 h-4" />
            TÍNH NĂNG MỚI: ĐẶT ĐƠN NHÓM TIỆN LỢI
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#181d26] tracking-tight">
            Cùng Nhau Chọn Món, <span className="text-[#e31837]">Giảm Đến 10%</span>
          </h1>
          <p className="text-[15px] sm:text-[16px] text-[#41454d] max-w-2xl mx-auto">
            Không còn phải chuyền tay nhau điện thoại hay chụp màn hình hỏi từng người. Mọi người vào nhóm cùng chọn món, trưởng nhóm thanh toán 1 lần duy nhất với ưu đãi giảm trực tiếp!
          </p>
        </div>

        {/* Discount Tiers Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#e5e7eb] shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#41454d] bg-[#f3f4f6] px-2.5 py-1 rounded-full">
                <Users className="w-3.5 h-3.5 text-[#e31837]" />
                Từ 3 - 4 người
              </div>
              <div className="text-3xl font-extrabold text-[#181d26]">
                Giảm 2%
              </div>
              <p className="text-[13px] text-[#555a64]">
                Giảm trực tiếp vào tổng hóa đơn, không cần nhập mã khuyến mại.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-[#e5e7eb] text-[12px] text-[#059669] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Thích hợp nhóm bạn thân
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#fff1f2] to-white rounded-2xl p-5 border-2 border-[#e31837]/30 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-[#e31837] text-white text-[11px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
              Phổ biến nhất
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#e31837] bg-[#fee2e2] px-2.5 py-1 rounded-full">
                <Users className="w-3.5 h-3.5 text-[#e31837]" />
                Từ 5 - 9 người
              </div>
              <div className="text-3xl font-extrabold text-[#e31837]">
                Giảm 5%
              </div>
              <p className="text-[13px] text-[#555a64]">
                Ưu đãi hoàn hảo cho phòng ban, team công sở đặt cơm trưa.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-[#fecdd3] text-[12px] text-[#e31837] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Tiết kiệm đáng kể cho cả nhóm
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#fef3c7] to-white rounded-2xl p-5 border border-[#fde68a] shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#b45309] bg-[#fef3c7] px-2.5 py-1 rounded-full">
                <Users className="w-3.5 h-3.5 text-[#d97706]" />
                Đủ 10 người (Tối đa)
              </div>
              <div className="text-3xl font-extrabold text-[#b45309]">
                Giảm 10%
              </div>
              <p className="text-[13px] text-[#555a64]">
                Mức giảm cao nhất cho bữa tiệc công ty hoặc họp mặt đông vui.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-[#fde68a] text-[12px] text-[#b45309] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Giảm kịch khung 10% bill
            </div>
          </div>
        </div>

        {/* Action Center: Tabs for Create or Join */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e5e7eb] shadow-xl max-w-xl mx-auto">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-[#f3f4f6] rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('create');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold transition ${
                activeTab === 'create'
                  ? 'bg-white text-[#181d26] shadow-sm'
                  : 'text-[#555a64] hover:text-[#181d26]'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-[#e31837]" />
              Tạo phòng nhóm mới
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('join');
                setErrorMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold transition ${
                activeTab === 'join'
                  ? 'bg-white text-[#181d26] shadow-sm'
                  : 'text-[#555a64] hover:text-[#181d26]'
              }`}
            >
              <LogIn className="w-4 h-4 text-[#e31837]" />
              Tham gia bằng mã
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] text-[13px] font-medium">
              {errorMsg}
            </div>
          )}

          {/* Create Group Form */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#41454d] mb-1.5">
                  Tên của bạn (Trưởng nhóm)
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="Ví dụ: Hoàng Anh (Trưởng phòng), Lan Hương..."
                  className="w-full px-4 py-3 rounded-xl border border-[#dddddd] text-[14px] focus:outline-none focus:border-[#e31837] transition"
                  required
                />
                <p className="text-[12px] text-[#717680] mt-1.5">
                  Tên này sẽ hiển thị để mọi người nhận biết trưởng nhóm và người đứng ra thanh toán.
                </p>
              </div>

              <div className="bg-[#f8fafc] rounded-xl p-4 text-[13px] text-[#41454d] space-y-2 border border-[#e5e7eb]">
                <div className="font-semibold text-[#181d26] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  Quy định đặt đơn nhóm NooNee:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[#555a64] text-[12px]">
                  <li>Số lượng thành viên: <strong>Tối thiểu 2 người, tối đa 10 người</strong>.</li>
                  <li>Mọi người trong phòng có thể thấy món ăn mà các thành viên khác đang chọn.</li>
                  <li>Trưởng nhóm là người chốt đơn và tiến hành thanh toán cho cả nhóm.</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3.5 bg-[#e31837] hover:bg-[#be0e27] text-white font-semibold text-[15px] rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tạo phòng nhóm...
                  </>
                ) : (
                  <>
                    Tạo phòng & Lấy link mời bạn bè
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Join Group Form */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#41454d] mb-1.5">
                  Mã nhóm (Group Code)
                </label>
                <input
                  type="text"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: NN-8392"
                  className="w-full px-4 py-3 rounded-xl border border-[#dddddd] text-[15px] font-mono uppercase tracking-wider focus:outline-none focus:border-[#e31837] transition"
                  required
                />
                <p className="text-[12px] text-[#717680] mt-1.5">
                  Nhập mã nhóm 6-8 ký tự do bạn bè hoặc trưởng nhóm chia sẻ.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#41454d] mb-1.5">
                  Tên hiển thị của bạn
                </label>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Ví dụ: Tuấn Anh, Mai Chi..."
                  className="w-full px-4 py-3 rounded-xl border border-[#dddddd] text-[14px] focus:outline-none focus:border-[#e31837] transition"
                  required
                />
                <p className="text-[12px] text-[#717680] mt-1.5">
                  Để các bạn trong nhóm biết bạn đang chọn món gì.
                </p>
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full py-3.5 bg-[#e31837] hover:bg-[#be0e27] text-white font-semibold text-[15px] rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tham gia nhóm...
                  </>
                ) : (
                  <>
                    Vào phòng chọn món ngay
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* How It Works Section */}
        <div className="pt-8 border-t border-[#e5e7eb]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#181d26] text-center mb-8">
            Cách thức hoạt động cực kỳ đơn giản
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-[#e5e7eb] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#fee2e2] text-[#e31837] font-bold flex items-center justify-center text-base">
                1
              </div>
              <h3 className="font-bold text-[#181d26] text-[15px]">Tạo phòng & Mời bạn</h3>
              <p className="text-[13px] text-[#555a64]">
                Tạo nhóm và chia sẻ link, mã code hoặc quét mã QR cho bạn bè, đồng nghiệp.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#e5e7eb] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#fee2e2] text-[#e31837] font-bold flex items-center justify-center text-base">
                2
              </div>
              <h3 className="font-bold text-[#181d26] text-[15px]">Tự do chọn món</h3>
              <p className="text-[13px] text-[#555a64]">
                Mỗi người chọn món ăn, thêm topping và ghi chú riêng trên điện thoại của mình.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#e5e7eb] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#fee2e2] text-[#e31837] font-bold flex items-center justify-center text-base">
                3
              </div>
              <h3 className="font-bold text-[#181d26] text-[15px]">Xem thực đơn trực tiếp</h3>
              <p className="text-[13px] text-[#555a64]">
                Mọi người nhìn thấy nhau đang đặt món gì theo thời gian thực, không lo trùng món.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#e5e7eb] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#fee2e2] text-[#e31837] font-bold flex items-center justify-center text-base">
                4
              </div>
              <h3 className="font-bold text-[#181d26] text-[15px]">Chốt đơn & Giảm giá</h3>
              <p className="text-[13px] text-[#555a64]">
                Trưởng nhóm thanh toán 1 lần duy nhất, nhận ngay ưu đãi giảm trực tiếp đến 10%!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
