'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CiUser as User,
  CiLock as Lock,
  CiCircleChevRight as ArrowRight,
  CiCircleCheck as Check,
  CiCircleAlert as AlertCircle,
  CiRead as Eye,
  CiImageOff as EyeOff,
  CiRedo as Loader2,
} from 'react-icons/ci';
import { useAuth } from '@/context/AuthContext';
import AddressAutocompleteInput from '@/components/AddressAutocompleteInput';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();

  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hpBotTrap, setHpBotTrap] = useState('');

  // Prevent logged in users from visiting login/register page
  useEffect(() => {
    if (user) {
      if (user.role === 'staff') {
        router.replace('/admin/orders');
      } else if (user.role === 'admin' || user.role === 'manager') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    }
  }, [user, router]);

  // Password strength calculation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthScore = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, hp_bot_trap: hpBotTrap }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Đăng nhập không thành công');
      }

      login(data.user);
      if (data.user.role === 'staff') {
        router.push('/admin/orders');
      } else if (data.user.role === 'admin' || data.user.role === 'manager') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi đăng nhập');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Pre-validations
    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      setErrorMsg('Mật khẩu chưa đủ độ mạnh yêu cầu (cần tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt)');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          confirmPassword,
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          hp_bot_trap: hpBotTrap,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Đăng ký không thành công');
      }

      login(data.user);
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi đăng ký');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#A30029]" />
        <p className="text-[14px] text-gray-600 font-medium">Bạn đã đăng nhập. Đang chuyển hướng...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-[#ffffff]">
      <div className="w-full max-w-md bg-white rounded-[12px] p-8 border border-[#dddddd] shadow-sm space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="font-friem text-3xl tracking-wide text-[#181d26]">
              NooNee<span className="text-[#A30029]">.</span>
            </span>
          </Link>
          <h1 className="text-2xl font-normal text-[#181d26]">
            {mode === 'login' ? 'Đăng nhập tài khoản' : 'Đăng ký khách hàng mới'}
          </h1>
          <p className="text-[13px] text-[#41454d]">
            {mode === 'login'
              ? 'Đăng nhập để đặt món và theo dõi đơn hàng của riêng bạn'
              : 'Tạo tài khoản để nhận ưu đãi và trải nghiệm đặt món nhanh chóng'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#f8fafc] p-1 rounded-[6px] border border-[#dddddd] text-[13px] font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-[4px] transition cursor-pointer ${
              mode === 'login' ? 'bg-[#A30029] text-white shadow-xs font-semibold' : 'text-[#41454d] hover:text-[#181d26]'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-[4px] transition cursor-pointer ${
              mode === 'register' ? 'bg-[#A30029] text-white shadow-xs font-semibold' : 'text-[#41454d] hover:text-[#181d26]'
            }`}
          >
            Đăng ký mới
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#fff1f2] border border-[#fecdd3] text-[#A30029] text-[13px] rounded-[6px] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4 text-[13px]">
            {/* Honeypot Bot Trap */}
            <input
              type="text"
              name="hp_bot_trap"
              value={hpBotTrap}
              onChange={(e) => setHpBotTrap(e.target.value)}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="space-y-1.5">
              <label className="font-medium text-[#181d26]">Tên đăng nhập</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9297a0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Nhập tên đăng nhập của bạn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-white border border-[#dddddd] rounded-[6px] text-[14px] text-[#181d26] focus:outline-none focus:border-[#A30029] transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#181d26]">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9297a0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-white border border-[#dddddd] rounded-[6px] text-[14px] text-[#181d26] focus:outline-none focus:border-[#A30029] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9297a0] hover:text-[#181d26]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[#A30029] hover:bg-[#850021] active:bg-[#a60b20] text-white font-medium rounded-[6px] transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3.5 text-[13px]">
            {/* Honeypot Bot Trap */}
            <input
              type="text"
              name="hp_bot_trap"
              value={hpBotTrap}
              onChange={(e) => setHpBotTrap(e.target.value)}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="space-y-1">
              <label className="font-medium text-[#181d26]">Họ và tên *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Trần Văn Nam"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[14px] text-[#181d26] focus:outline-none focus:border-[#A30029] transition"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-medium text-[#181d26]">Tên đăng nhập *</label>
                <span className="text-[11px] text-[#9297a0]">4-20 ký tự chữ & số</span>
              </div>
              <input
                type="text"
                required
                pattern="^[a-zA-Z0-9_]{4,20}$"
                title="4-20 ký tự, chỉ gồm chữ cái, số và dấu gạch dưới (_)"
                placeholder="Ví dụ: namtran_99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[14px] text-[#181d26] focus:outline-none focus:border-[#A30029] transition font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#181d26]">Mật khẩu *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Tối thiểu 8 ký tự, có hoa, thường, số, ký tự đặc biệt"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-3.5 pr-10 bg-white border border-[#dddddd] rounded-[6px] text-[14px] text-[#181d26] focus:outline-none focus:border-[#A30029] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9297a0] hover:text-[#181d26]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="pt-1.5 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden flex gap-1">
                      <div className={`flex-1 h-full rounded-full transition-colors ${strengthScore >= 1 ? (strengthScore <= 2 ? 'bg-[#f87171]' : strengthScore <= 4 ? 'bg-[#facc15]' : 'bg-[#22c55e]') : 'bg-transparent'}`} />
                      <div className={`flex-1 h-full rounded-full transition-colors ${strengthScore >= 3 ? (strengthScore <= 4 ? 'bg-[#facc15]' : 'bg-[#22c55e]') : 'bg-transparent'}`} />
                      <div className={`flex-1 h-full rounded-full transition-colors ${strengthScore === 5 ? 'bg-[#22c55e]' : 'bg-transparent'}`} />
                    </div>
                    <span className="text-[11px] font-semibold text-[#41454d]">
                      {strengthScore <= 2 ? 'Yếu' : strengthScore <= 4 ? 'Trung bình' : 'Mạnh'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                    <div className={`flex items-center gap-1 ${hasMinLength ? 'text-[#006400]' : 'text-[#9297a0]'}`}>
                      <Check className="w-3 h-3" /> 8+ ký tự
                    </div>
                    <div className={`flex items-center gap-1 ${hasUpperCase && hasLowerCase ? 'text-[#006400]' : 'text-[#9297a0]'}`}>
                      <Check className="w-3 h-3" /> Chữ hoa & thường
                    </div>
                    <div className={`flex items-center gap-1 ${hasNumber ? 'text-[#006400]' : 'text-[#9297a0]'}`}>
                      <Check className="w-3 h-3" /> Chữ số (0-9)
                    </div>
                    <div className={`flex items-center gap-1 ${hasSpecial ? 'text-[#006400]' : 'text-[#9297a0]'}`}>
                      <Check className="w-3 h-3" /> Ký tự đặc biệt (!@#$)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-medium text-[#181d26]">Nhập lại mật khẩu *</label>
                {confirmPassword && (
                  <span className={`text-[11px] font-medium ${passwordsMatch ? 'text-[#006400]' : 'text-[#A30029]'}`}>
                    {passwordsMatch ? '✓ Khớp mật khẩu' : '✗ Chưa khớp'}
                  </span>
                )}
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Nhập lại chính xác mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full h-10 px-3.5 bg-white border rounded-[6px] text-[14px] text-[#181d26] focus:outline-none transition ${
                  confirmPassword && !passwordsMatch ? 'border-[#A30029] focus:border-[#A30029]' : 'border-[#dddddd] focus:border-[#A30029]'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#181d26]">Số điện thoại</label>
              <input
                type="tel"
                placeholder="0912345678 (10 số di động VN)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[14px] text-[#181d26] focus:outline-none focus:border-[#A30029] transition"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-[#181d26]">Địa chỉ giao hàng</label>
              <AddressAutocompleteInput
                value={address}
                onChange={(addr) => setAddress(addr)}
                placeholder="VD: 120 Yên Lãng, Đống Đa, Hà Nội..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !passwordsMatch || strengthScore < 5}
              className="w-full h-11 bg-[#A30029] hover:bg-[#850021] active:bg-[#a60b20] text-white font-medium rounded-[6px] transition flex items-center justify-center gap-2 mt-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#A30029]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
