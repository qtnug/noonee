'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  CiUser as Users,
  CiReceipt as Copy,
  CiCircleCheck as Check,
  CiBarcode as QrIcon,
  CiCirclePlus as Plus,
  CiTrash as Trash2,
  CiLock as Lock,
  CiUnlock as Unlock,
  CiCreditCard2 as CreditCard,
  CiForkAndKnife as UtensilsCrossed,
  CiStar as Sparkles,
  CiCircleAlert as AlertCircle,
  CiClock2 as Clock,
  CiShare2 as Share2,
  CiCircleChevRight as ChevronRight,
  CiCircleCheck as ShieldCheck,
  CiCircleRemove as X,
  CiSearch as Search,
  CiExport as ExternalLink,
  CiMedal as Crown,
  CiRedo as RefreshCw,
  CiUser as UserMinus,
} from 'react-icons/ci';
import { GroupOrder, GroupMember, GroupMemberItem, Product, ProductTopping } from '@/types';
import { formatVND } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import { calculateGroupDiscount, MIN_GROUP_MEMBERS, MAX_GROUP_MEMBERS } from '@/lib/groupOrder';

export default function GroupOrderRoomPage({
  params,
}: {
  params?: { code?: string };
}) {
  const router = useRouter();
  const routeParams = useParams();
  const rawCode = (routeParams?.code as string) || params?.code || '';
  const code = rawCode.toUpperCase();
  const { user, getAuthHeader } = useAuth();
  const { currentBranch } = useBranch();

  const [group, setGroup] = useState<GroupOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [myMemberId, setMyMemberId] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Join Modal (if member not joined yet)
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinNameInput, setJoinNameInput] = useState(user?.fullName || '');
  const [isJoining, setIsJoining] = useState(false);

  // Food Picker Modal
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<ProductTopping[]>([]);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Leader Action Loading
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch Group Data
  const fetchGroupData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetch(`/api/group/${code}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Không tìm thấy nhóm');
      }
      setGroup(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tải thông tin nhóm');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [code]);

  // Load member ID from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem(`noonee_group_member_${code}`);
      if (storedId) {
        setMyMemberId(storedId);
      }
    }
  }, [code]);

  // Initial load and polling every 2.5s
  useEffect(() => {
    fetchGroupData(true);
    const interval = setInterval(() => {
      fetchGroupData(false);
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchGroupData]);

  // Check if current user is in group members
  useEffect(() => {
    if (group && !loading) {
      // Test Case 4.2: Do not show join modal if group order is already completed
      if (group.status === 'completed') {
        setShowJoinModal(false);
        return;
      }

      // Check if user is logged in and already in group members by userId
      if (user) {
        const myMem = group.members?.find(
          (m) => (m.userId && m.userId === user.id) || (m.isHost && group.hostUserId === user.id)
        );
        if (myMem) {
          setMyMemberId(myMem.id);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`noonee_group_member_${code}`, myMem.id);
          }
          setShowJoinModal(false);
          return;
        }
      }

      if (myMemberId) {
        const exists = group.members?.some((m) => m.id === myMemberId);
        if (exists) {
          setShowJoinModal(false);
          return;
        }
      }

      // If not in members or not logged in, prompt to join/login
      setShowJoinModal(true);
    }
  }, [group, loading, myMemberId, user, code]);

  // Fetch products for dish picker according to selected branch
  useEffect(() => {
    fetch(`/api/products?branch=${currentBranch.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data.filter((p: Product) => p.isAvailable));
        }
      })
      .catch(() => {});
  }, [currentBranch.id]);

  // Generate QR Code
  useEffect(() => {
    if (showQrModal && typeof window !== 'undefined') {
      const joinUrl = `${window.location.origin}/group/${code}`;
      QRCode.toDataURL(joinUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#181d26',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [showQrModal, code]);

  // Copy code handler
  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Copy link handler
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/group/${code}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Join Room Handler (Requires authenticated user)
  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      router.push(`/login?returnUrl=/group/${code}`);
      return;
    }

    const name = user.fullName || user.username || joinNameInput.trim();
    if (!name) return;

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

      setGroup(data.data);
      if (data.member?.id) {
        setMyMemberId(data.member.id);
        localStorage.setItem(`noonee_group_member_${code}`, data.member.id);
        localStorage.setItem(`noonee_group_name_${code}`, name);
      }
      setShowJoinModal(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tham gia');
    } finally {
      setIsJoining(false);
    }
  };

  // Check if current user is host
  const isHost = Boolean(
    group &&
      group.members &&
      group.members.some((m) => m.id === myMemberId && m.isHost)
  );

  // Add Item to my portion
  const handleAddItemToPortion = async () => {
    if (!selectedProduct || !myMemberId) return;

    setIsAddingItem(true);
    try {
      const res = await fetch(`/api/group/${code}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: myMemberId,
          requesterMemberId: myMemberId,
          action: 'add',
          item: {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            price: selectedProduct.price,
            quantity: itemQuantity,
            toppings: selectedToppings,
            note: '',
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Lỗi khi thêm món');
      }

      setGroup(data.data);
      setShowFoodPicker(false);
      setSelectedProduct(null);
      setSelectedToppings([]);
      setItemQuantity(1);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm món');
    } finally {
      setIsAddingItem(false);
    }
  };

  // Update item qty or remove (supports host removing items for any member - Test Case 5.1)
  const handleUpdateItem = async (
    action: 'update_qty' | 'remove',
    itemId: string,
    quantity?: number,
    targetMemberId?: string
  ) => {
    const memId = targetMemberId || myMemberId;
    if (!memId) return;
    try {
      const res = await fetch(`/api/group/${code}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: memId,
          requesterMemberId: myMemberId,
          action,
          item: {
            itemId,
            quantity,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGroup(data.data);
      } else {
        alert(data.message || 'Lỗi khi cập nhật món');
      }
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  // Remove member from group (Host action - Test Case 5.1 Abandoned cart prevention)
  const handleRemoveMember = async (memberIdToRemove: string, memberName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa "${memberName}" và các món của thành viên này khỏi nhóm?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/group/${code}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberIdToRemove,
          requesterMemberId: myMemberId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGroup(data.data);
      } else {
        alert(data.message || 'Không thể xóa thành viên');
      }
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  // Lock or Unlock Group
  const handleToggleLock = async (action: 'lock' | 'unlock') => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/group/${code}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          action,
          requesterMemberId: myMemberId,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Thao tác thất bại');
      }
      setGroup(data.data);
    } catch (err: any) {
      alert(err.message || 'Lỗi');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Proceed to Checkout (Host only)
  const handleProceedToCheckout = () => {
    if (!group) return;
    if (group.members.length < MIN_GROUP_MEMBERS) {
      alert(`Cần tối thiểu ${MIN_GROUP_MEMBERS} người để đặt đơn nhóm! Hãy chia sẻ mã nhóm cho bạn bè cùng đặt.`);
      return;
    }
    if ((group.totalQuantity || 0) === 0) {
      alert('Nhóm chưa chọn món ăn nào! Hãy thêm món trước khi thanh toán.');
      return;
    }

    // Redirect to checkout with groupCode
    router.push(`/checkout?groupCode=${group.code}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex flex-col items-center justify-center space-y-4 px-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#A30029] border-t-transparent animate-spin" />
        <p className="text-[15px] font-medium text-[#41454d]">Đang kết nối vào phòng nhóm...</p>
      </div>
    );
  }

  if (errorMsg || !group) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex flex-col items-center justify-center space-y-5 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[#fff1f2] text-[#A30029] flex items-center justify-center mx-auto border border-[#fecdd3]">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#181d26]">Không tìm thấy phòng nhóm</h1>
        <p className="text-[14px] text-[#555a64] max-w-md">
          {errorMsg || 'Mã phòng đặt nhóm không tồn tại hoặc đã bị hủy.'}
        </p>
        <Link
          href="/group"
          className="px-6 py-3 bg-[#A30029] text-white font-medium rounded-[6px] hover:bg-[#850021] transition"
        >
          Quay lại trang Đơn nhóm
        </Link>
      </div>
    );
  }

  // Calculate discount and next tier
  const discountInfo = calculateGroupDiscount(group.members?.length || 0);

  return (
    <div className="bg-[#fcfbf9] min-h-screen pb-24">
      {/* Top Banner: Order Status Alerts */}
      {group.status === 'completed' && (
        <div className="bg-[#059669] text-white py-3.5 px-4 text-center shadow-md">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3 text-[14px] font-medium">
            <Sparkles className="w-5 h-5 animate-bounce" />
            <span>
              Đơn nhóm đã được trưởng nhóm đặt thành công! Mã đơn: <strong>#{group.orderCode}</strong>
            </span>
            {group.orderCode && (
              <Link
                href={`/orders/${group.orderCode}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white text-[#059669] rounded-lg font-semibold hover:bg-emerald-50 transition"
              >
                Xem chi tiết đơn hàng <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {group.status === 'locked' && (
        <div className="bg-[#b45309] text-white py-2.5 px-4 text-center text-[13px] font-medium flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          Phòng đang được chốt. Trưởng nhóm đang chuẩn bị tiến hành thanh toán...
        </div>
      )}

      {/* Main Room Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Room Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e7eb] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#f3f4f6]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fee2e2] text-[#A30029] text-xs font-bold uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5" /> Đặt Đơn Nhóm
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#181d26]">
                Nhóm của {group.hostName}
              </h1>
              <p className="text-[13px] text-[#555a64] mt-1">
                Tạo lúc {new Date(group.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {group.members?.length || 0}/10 thành viên
              </p>
            </div>

            {/* Group Code & Share Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[#f8fafc] border border-[#e5e7eb] rounded-2xl px-3 py-1.5">
                <span className="text-[11px] font-semibold text-[#717680] mr-2">MÃ PHÒNG:</span>
                <span className="font-mono font-bold text-base text-[#181d26] tracking-wider">{group.code}</span>
                <button
                  onClick={handleCopyCode}
                  title="Sao chép mã nhóm"
                  className="ml-2 p-1.5 hover:bg-white rounded-lg text-[#555a64] hover:text-[#A30029] transition"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-[#059669]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e5e7eb] rounded-2xl text-[13px] font-medium text-[#41454d] hover:text-[#A30029] hover:border-[#fecdd3] transition"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#059669]" /> : <Share2 className="w-4 h-4" />}
                {copiedLink ? 'Đã sao chép link' : 'Chia sẻ link'}
              </button>

              <button
                onClick={() => setShowQrModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e5e7eb] rounded-2xl text-[13px] font-medium text-[#41454d] hover:text-[#A30029] hover:border-[#fecdd3] transition"
              >
                <QrIcon className="w-4 h-4 text-[#A30029]" />
                Mã QR
              </button>

              <button
                onClick={() => fetchGroupData()}
                title="Làm mới dữ liệu giỏ nhóm ngay lập tức"
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e5e7eb] rounded-2xl text-[13px] font-medium text-[#41454d] hover:text-[#A30029] hover:border-[#fecdd3] transition"
              >
                <RefreshCw className="w-4 h-4 text-[#717680]" />
                Làm mới
              </button>
            </div>
          </div>

          {/* Compact Group Discount Status Bar (Requirement 3) */}
          <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-[13px]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#A30029] shrink-0" />
              <span className="font-bold text-[#181d26]">
                Ưu đãi nhóm: <span className="text-[#A30029]">Giảm {group.discountPercentage || 0}%</span>
              </span>
              <span className="text-[12px] text-[#555a64]">
                ({group.members?.length || 0}/10 người)
              </span>
              {discountInfo.nextTier && (
                <span className="text-[12px] text-[#A30029] font-semibold hidden md:inline">
                  • Thêm {discountInfo.nextTier.peopleNeeded} người nữa để -{discountInfo.nextTier.percentage}%!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#555a64]">
              <span className={group.members?.length >= 3 ? 'text-[#059669] font-bold' : ''}>3 người: -2%</span>
              <span>•</span>
              <span className={group.members?.length >= 5 ? 'text-[#059669] font-bold' : ''}>5 người: -5%</span>
              <span>•</span>
              <span className={group.members?.length >= 10 ? 'text-[#059669] font-bold' : ''}>10 người: -10%</span>
            </div>
          </div>
        </div>

        {/* Members & Items Live List */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#181d26] flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-[#A30029]" />
              Danh sách món từng thành viên ({group.members?.length || 0})
            </h2>

            {/* Prominent Add Food Button for Current User */}
            {group.status === 'active' && myMemberId && (
              <button
                type="button"
                onClick={() => setShowFoodPicker(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#A30029] hover:bg-[#850021] text-white font-bold text-[13px] sm:text-[14px] rounded-lg shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Thêm món cho tôi</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {group.members?.map((member) => {
              const isMe = member.id === myMemberId;
              const memberTotal = member.items?.reduce((sum, it) => sum + it.price * it.quantity, 0) || 0;

              return (
                <div
                  key={member.id}
                  className={`bg-white rounded-xl p-3.5 sm:p-4 border transition ${
                    isMe
                      ? 'border-[#A30029] ring-1 ring-[#A30029]/20 shadow-xs'
                      : 'border-[#e5e7eb] shadow-2xs'
                  }`}
                >
                  {/* Member Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#f3f4f6]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#f3f4f6] text-[#181d26] font-bold text-xs flex items-center justify-center">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[13px] sm:text-[14px] text-[#181d26]">{member.name}</span>
                          {member.isHost && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-[#fef3c7] text-[#b45309] text-[10px] font-bold">
                              <Crown className="w-2.5 h-2.5 text-[#d97706]" /> Trưởng nhóm
                            </span>
                          )}
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#fee2e2] text-[#A30029] text-[10px] font-bold">
                              Bạn
                            </span>
                          )}
                          {isHost && !member.isHost && group.status !== 'completed' && (
                            <button
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              title="Xóa thành viên khỏi nhóm"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-[#fee2e2] hover:bg-[#fca5a5] text-[#7a001e] text-[10px] font-medium transition cursor-pointer"
                            >
                              <UserMinus className="w-2.5 h-2.5" /> Mời ra
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] text-[#717680]">
                          Đã chọn {member.items?.length || 0} món
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#717680] block">Tiền phần này</span>
                      <span className="font-bold text-[13px] sm:text-[14px] text-[#181d26]">
                        {formatVND(memberTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Member Items */}
                  {member.items && member.items.length > 0 && (
                    <div className="pt-2">
                      <div className="space-y-1.5">
                        {member.items.map((it) => (
                          <div
                            key={it.id}
                            className="flex items-center justify-between gap-2 text-[12px] bg-[#fcfbf9] px-2.5 py-2 rounded-lg border border-[#f3f4f6]"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[#181d26] truncate flex items-center gap-1.5">
                                <span>{it.productName}</span>
                                <span className="text-[11px] text-[#717680] font-normal">x{it.quantity}</span>
                              </div>

                              {it.toppings && (
                                <p className="text-[11px] text-[#555a64] truncate">
                                  Topping: {typeof it.toppings === 'string' && it.toppings.startsWith('[')
                                    ? JSON.parse(it.toppings).map((t: any) => t.name).join(', ')
                                    : it.toppings}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-bold text-[12px] text-[#181d26]">
                                {formatVND(it.price * it.quantity)}
                              </span>

                              {/* Controls for current member or Host */}
                              {group.status === 'active' && (
                                <div className="flex items-center gap-1 ml-1">
                                  {isMe ? (
                                    <>
                                      <button
                                        onClick={() => handleUpdateItem('update_qty', it.id, it.quantity - 1)}
                                        className="w-5 h-5 rounded bg-white border border-[#dddddd] flex items-center justify-center text-[10px] font-bold hover:bg-[#fee2e2] hover:text-[#A30029] transition cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <span className="text-[11px] font-bold w-3 text-center">{it.quantity}</span>
                                      <button
                                        onClick={() => handleUpdateItem('update_qty', it.id, it.quantity + 1)}
                                        className="w-5 h-5 rounded bg-white border border-[#dddddd] flex items-center justify-center text-[10px] font-bold hover:bg-[#fee2e2] hover:text-[#A30029] transition cursor-pointer"
                                      >
                                        +
                                      </button>
                                      <button
                                        onClick={() => handleUpdateItem('remove', it.id)}
                                        className="p-0.5 text-[#717680] hover:text-[#A30029] transition ml-0.5 cursor-pointer"
                                        title="Xóa món"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  ) : isHost ? (
                                    <button
                                      onClick={() => handleUpdateItem('remove', it.id, undefined, member.id)}
                                      className="p-0.5 text-[#717680] hover:text-[#A30029] transition ml-0.5 cursor-pointer"
                                      title="Trưởng nhóm xóa món của thành viên này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bill Summary & Host Checkout Floating Bar */}
        <div className="bg-white rounded-3xl p-6 border border-[#e5e7eb] shadow-xl space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[14px] text-[#555a64]">
              <span>Tạm tính ({group.totalQuantity || 0} món):</span>
              <span className="font-medium text-[#181d26]">{formatVND(group.subtotal || 0)}</span>
            </div>

            {(group.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-[14px] text-[#059669] font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> Giảm giá nhóm ({group.discountPercentage}%):
                </span>
                <span>-{formatVND(group.discountAmount || 0)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#f3f4f6] flex justify-between items-baseline">
              <div>
                <span className="text-base font-bold text-[#181d26]">Tổng tiền cả nhóm:</span>
                <span className="block text-[12px] text-[#717680]">
                  (Trưởng nhóm sẽ đứng ra thanh toán toàn bộ)
                </span>
              </div>
              <span className="text-2xl font-black text-[#A30029]">
                {formatVND(group.finalTotal || 0)}
              </span>
            </div>
          </div>

          {/* Action Buttons (Requirement 8: Khóa phòng mới hiện nút thanh toán) */}
          <div className="pt-3 flex flex-col sm:flex-row gap-3">
            {isHost ? (
              <>
                {group.status === 'active' ? (
                  <button
                    onClick={() => handleToggleLock('lock')}
                    disabled={isActionLoading}
                    className="w-full py-3.5 bg-[#181d26] hover:bg-black text-white font-bold text-[14px] rounded-[6px] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    <Lock className="w-4 h-4" />
                    Chốt món & Khóa phòng để thanh toán
                  </button>
                ) : group.status === 'locked' ? (
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      onClick={() => handleToggleLock('unlock')}
                      disabled={isActionLoading}
                      className="py-3.5 px-5 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#181d26] font-semibold text-[14px] rounded-[6px] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Unlock className="w-4 h-4" />
                      Mở lại phòng
                    </button>
                    <button
                      onClick={handleProceedToCheckout}
                      className="flex-1 py-3.5 bg-[#A30029] hover:bg-[#850021] text-white font-bold text-[15px] rounded-[6px] shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-5 h-5" />
                      Thanh toán đơn nhóm ({formatVND(group.finalTotal || 0)})
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="w-full py-3 bg-[#f8fafc] rounded-xl border border-[#e5e7eb] text-center text-[13px] text-[#555a64]">
                {group.status === 'completed'
                  ? 'Đơn hàng đã được trưởng nhóm thanh toán thành công.'
                  : group.status === 'locked'
                  ? 'Trưởng nhóm đã chốt món, khóa phòng và đang tiến hành thanh toán.'
                  : 'Vui lòng chọn món ăn của bạn. Khi mọi người chọn xong, trưởng nhóm sẽ chốt món và thanh toán.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 text-center relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 text-[#717680] hover:text-[#181d26] rounded-full hover:bg-[#f3f4f6] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-[#181d26]">Quét mã QR vào nhóm</h3>
              <p className="text-[13px] text-[#555a64] mt-1">
                Bạn bè có thể mở camera điện thoại quét để vào phòng chọn món ngay.
              </p>
            </div>

            <div className="p-4 bg-[#f8fafc] rounded-2xl border border-[#e5e7eb] flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Mã QR tham gia nhóm"
                  className="w-64 h-64 rounded-xl shadow-xs"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-sm text-[#717680]">
                  Đang tạo mã QR...
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="text-[13px] text-[#717680]">Mã nhóm:</span>
              <span className="font-mono font-bold text-lg text-[#A30029] tracking-wider">{group.code}</span>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-3 bg-[#181d26] text-white font-semibold text-[14px] rounded-xl hover:bg-black transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Join Room Modal (Requirement 2: Bắt buộc có tài khoản) */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            {!user ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#fee2e2] text-[#A30029] flex items-center justify-center mx-auto shadow-xs">
                  <Users className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-[#181d26]">
                    Đăng nhập để vào nhóm
                  </h3>
                  <p className="text-[13px] text-[#555a64] leading-relaxed">
                    Bạn cần đăng nhập tài khoản NooNee để tham gia nhóm của <strong>{group.hostName}</strong>.
                    <br />
                    Món ăn bạn đặt sẽ được <strong className="text-[#A30029]">tích lũy thăng hạng thành viên</strong> và ghi nhận là <strong>1 đơn của bản thân</strong>!
                  </p>
                </div>

                <div className="pt-2 space-y-2.5">
                  <Link
                    href={`/login?returnUrl=/group/${code}`}
                    className="w-full py-3.5 bg-[#A30029] hover:bg-[#850021] text-white font-bold text-[14px] rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Đăng nhập tài khoản NooNee
                  </Link>
                  <Link
                    href={`/register?returnUrl=/group/${code}`}
                    className="w-full py-3 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#181d26] font-semibold text-[14px] rounded-xl transition flex items-center justify-center cursor-pointer"
                  >
                    Chưa có tài khoản? Đăng ký ngay
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#fee2e2] text-[#A30029] flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-[#181d26]">
                    Vào nhóm của {group.hostName}
                  </h3>
                  <p className="text-[13px] text-[#555a64]">
                    Bạn đang tham gia với tài khoản:
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f8fafc] border border-[#e5e7eb] rounded-xl text-[14px] font-bold text-[#181d26]">
                    {user.fullName || user.username}
                  </div>
                </div>

                <button
                  onClick={() => handleJoin()}
                  disabled={isJoining}
                  className="w-full py-3.5 bg-[#A30029] hover:bg-[#850021] text-white font-bold text-[14px] rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isJoining ? 'Đang vào nhóm...' : 'Vào nhóm chọn món ngay'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dish Picker Modal */}
      {showFoodPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#f3f4f6] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#181d26]">
                  {selectedProduct ? 'Tùy chỉnh món ăn' : 'Chọn món vào phần của bạn'}
                </h3>
                <p className="text-[12px] text-[#717680]">
                  {selectedProduct ? selectedProduct.name : 'Thực đơn NooNee nóng hổi chuẩn vị'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (selectedProduct) setSelectedProduct(null);
                  else setShowFoodPicker(false);
                }}
                className="p-2 text-[#717680] hover:text-[#181d26] rounded-full hover:bg-[#f3f4f6] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {!selectedProduct ? (
                <>
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#717680] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Tìm món ăn, đồ uống..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#dddddd] text-[14px] focus:outline-none focus:border-[#A30029] transition"
                    />
                  </div>

                  {/* Product List */}
                  <div className="space-y-3">
                    {products
                      .filter((p) => {
                        if (p.branchId !== null && p.branchId !== undefined && p.branchId !== currentBranch.id) {
                          return false;
                        }
                        return p.name.toLowerCase().includes(productSearch.toLowerCase());
                      })
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProduct(p);
                            setSelectedToppings([]);
                            setItemQuantity(1);
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-[#e5e7eb] hover:border-[#A30029] hover:bg-[#fff1f2]/20 transition cursor-pointer"
                        >
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[14px] text-[#181d26] truncate">{p.name}</h4>
                            <p className="text-[12px] text-[#717680] line-clamp-1">{p.description}</p>
                            <span className="font-bold text-[14px] text-[#A30029] mt-1 block">
                              {formatVND(p.price)}
                            </span>
                          </div>
                          <button className="px-3 py-1.5 bg-[#A30029] text-white text-[12px] font-semibold rounded-lg">
                            Chọn
                          </button>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                /* Customize Selected Product */
                <div className="space-y-5">
                  <div className="flex gap-4 items-center">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-20 h-20 rounded-2xl object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-lg text-[#181d26]">{selectedProduct.name}</h4>
                      <span className="text-base font-bold text-[#A30029]">
                        {formatVND(selectedProduct.price)}
                      </span>
                    </div>
                  </div>

                  {/* Toppings Selection */}
                  {selectedProduct.toppings && selectedProduct.toppings.length > 0 && (
                    <div className="space-y-2.5">
                      <label className="block text-[13px] font-bold text-[#181d26]">
                        Chọn thêm Topping:
                      </label>
                      <div className="space-y-2">
                        {selectedProduct.toppings.map((top) => {
                          const isChecked = selectedToppings.some((t) => t.id === top.id);
                          return (
                            <label
                              key={top.id}
                              className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                                isChecked
                                  ? 'border-[#A30029] bg-[#fff1f2]/30'
                                  : 'border-[#e5e7eb] hover:border-[#dddddd]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 text-[13px]">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedToppings([...selectedToppings, top]);
                                    } else {
                                      setSelectedToppings(selectedToppings.filter((t) => t.id !== top.id));
                                    }
                                  }}
                                  className="accent-[#A30029] w-4 h-4 rounded"
                                />
                                <span className="font-medium text-[#181d26]">{top.name}</span>
                              </div>
                              <span className="text-[13px] font-semibold text-[#555a64]">
                                +{formatVND(top.price)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[14px] font-bold text-[#181d26]">Số lượng:</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                        className="w-8 h-8 rounded-lg bg-[#f3f4f6] text-[#181d26] font-bold flex items-center justify-center hover:bg-[#fee2e2] transition"
                      >
                        -
                      </button>
                      <span className="font-bold text-base w-6 text-center">{itemQuantity}</span>
                      <button
                        onClick={() => setItemQuantity(itemQuantity + 1)}
                        className="w-8 h-8 rounded-lg bg-[#f3f4f6] text-[#181d26] font-bold flex items-center justify-center hover:bg-[#fee2e2] transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedProduct && (
              <div className="p-4 border-t border-[#f3f4f6] flex gap-3">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-5 py-3 rounded-xl border border-[#dddddd] text-[13px] font-semibold text-[#555a64] hover:bg-[#f8fafc] transition"
                >
                  Chọn món khác
                </button>
                <button
                  onClick={handleAddItemToPortion}
                  disabled={isAddingItem}
                  className="flex-1 py-3 bg-[#A30029] hover:bg-[#850021] text-white font-bold text-[14px] rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isAddingItem ? 'Đang thêm...' : 'Thêm vào phần của tôi'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
