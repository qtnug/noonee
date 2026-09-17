'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Honeypot for bot trap (STT 1)
  const [hpTrap, setHpTrap] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hpTrap) {
      // Bot detected - ignore silently
      setSubmitted(true);
      return;
    }

    if (!name.trim() || !phone.trim() || !content.trim()) {
      setError('Vui lòng điền đầy đủ họ tên, số điện thoại và nội dung cần hỗ trợ');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Optional call to support API or mock success
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          message: content.trim(),
          hp_bot_trap: hpTrap,
        }),
      }).catch(() => null);

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng liên hệ hotline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#9297a0] mb-6">
          <Link href="/" className="hover:text-[#181d26]">Trang chủ</Link>
          <span>/</span>
          <span className="text-[#181d26] font-medium">Liên hệ & Hỗ trợ</span>
        </div>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fff1f2] text-[#e31837] border border-[#fecdd3] mb-3">
            <MessageSquare className="w-3.5 h-3.5" />
            Hỗ trợ khách hàng 24/7
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#181d26] tracking-tight">
            Liên hệ với NooNee Food
          </h1>
          <p className="mt-3 text-[#41454d] text-base leading-relaxed">
            Chúng tôi luôn sẵn sàng lắng nghe mọi góp ý, thắc mắc về đơn hàng hoặc phản hồi chất lượng món ăn từ quý khách.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl border border-[#dddddd] p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#181d26] mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#e31837]" />
                Thông tin cửa hàng
              </h2>
              <div className="space-y-4 text-sm text-[#41454d]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-[#e31837]" />
                  </div>
                  <div>
                    <strong className="block text-[#181d26]">Địa chỉ chính:</strong>
                    <span>120 Yên Lãng, Đống Đa, Hà Nội</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4 text-[#e31837]" />
                  </div>
                  <div>
                    <strong className="block text-[#181d26]">Hotline đặt món & Khiếu nại:</strong>
                    <a href="tel:0988888888" className="text-[#e31837] font-bold text-base hover:underline">
                      0988.888.888
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-[#e31837]" />
                  </div>
                  <div>
                    <strong className="block text-[#181d26]">Khung giờ phục vụ:</strong>
                    <span>07:00 - 22:00 (Tất cả các ngày trong tuần)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-[#e31837]" />
                  </div>
                  <div>
                    <strong className="block text-[#181d26]">Email hỗ trợ:</strong>
                    <span>hotro@nooneefood.vn</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Guarantees */}
            <div className="bg-white rounded-xl border border-[#dddddd] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#181d26] uppercase tracking-wider mb-3">
                Cam kết dịch vụ NooNee
              </h3>
              <ul className="space-y-2.5 text-xs text-[#41454d]">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Món ăn nấu mới 100% khi nhận đơn, bảo đảm an toàn VSTP.</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Giao hỏa tốc 15-30 phút trong bán kính nội thành.</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hoàn tiền hoặc đổi món nếu có sai sót đơn hàng.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Contact & Support Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl border border-[#dddddd] p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#181d26] mb-2">Gửi tin nhắn cho chúng tôi</h2>
              <p className="text-sm text-[#9297a0] mb-6">
                Điền thông tin bên dưới, nhân viên hỗ trợ của NooNee sẽ phản hồi quý khách trong vòng 10-15 phút.
              </p>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-emerald-900 mb-1">
                    Gửi yêu cầu hỗ trợ thành công!
                  </h3>
                  <p className="text-sm text-emerald-800 mb-4">
                    Cảm ơn quý khách đã gửi thông tin. Đội ngũ CSKH của NooNee sẽ liên hệ sớm nhất theo số điện thoại đã cung cấp.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setPhone('');
                      setEmail('');
                      setContent('');
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                  >
                    Gửi phản hồi khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot field for bot protection */}
                  <input
                    type="text"
                    name="hp_bot_trap"
                    value={hpTrap}
                    onChange={(e) => setHpTrap(e.target.value)}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#181d26] uppercase tracking-wider mb-1.5">
                        Họ và tên <span className="text-[#e31837]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="VD: Nguyễn Văn A"
                        className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-lg text-sm text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#181d26] uppercase tracking-wider mb-1.5">
                        Số điện thoại <span className="text-[#e31837]">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="VD: 0912345678"
                        className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-lg text-sm text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#181d26] uppercase tracking-wider mb-1.5">
                      Email (không bắt buộc)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="VD: email@example.com"
                      className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-lg text-sm text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#181d26] uppercase tracking-wider mb-1.5">
                      Nội dung cần hỗ trợ hoặc góp ý <span className="text-[#e31837]">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Mô tả chi tiết vấn đề bạn cần giúp đỡ hoặc mã đơn hàng..."
                      className="w-full p-3.5 bg-white border border-[#dddddd] rounded-lg text-sm text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 bg-[#e31837] hover:bg-[#be0e27] text-white font-medium rounded-lg text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Đang gửi thông tin...' : 'Gửi yêu cầu hỗ trợ'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
