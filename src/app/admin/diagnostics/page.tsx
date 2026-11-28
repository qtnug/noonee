'use client';

import React, { useEffect, useState } from 'react';
import {
  CiDatabase as Database,
  CiBarcode as QrCode,
  CiCircleCheck as CheckCircle2,
  CiRedo as RefreshCw,
  CiStar as Zap,
  CiClock2 as Clock,
  CiPlay1 as Play,
  CiRedo as Loader2,
  CiCircleCheck as ShieldCheck,
} from 'react-icons/ci';

interface ApiTestItem {
  id: string;
  name: string;
  category: string;
  status: 'online' | 'warning' | 'offline';
  latencyMs: number;
  statusCode?: number;
  details: string;
  endpoint: string;
  lastTested: string;
}

export default function AdminDiagnosticsPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // API tests state
  const [apiTests, setApiTests] = useState<ApiTestItem[]>([]);
  const [testingAll, setTestingAll] = useState(false);
  const [testingItem, setTestingItem] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runApiTests = async (target?: string) => {
    if (target) {
      setTestingItem(target);
    } else {
      setTestingAll(true);
    }

    try {
      const url = target ? `/api/admin/test-apis?target=${target}` : '/api/admin/test-apis';
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        if (target) {
          setApiTests((prev) => {
            const copy = [...prev];
            const idx = copy.findIndex((it) => it.id === target);
            if (idx !== -1) {
              copy[idx] = data.data[0];
            } else {
              copy.push(data.data[0]);
            }
            return copy;
          });
        } else {
          setApiTests(data.data);
        }
      }
    } catch (err) {
      console.error('Error testing APIs:', err);
    } finally {
      setTestingAll(false);
      setTestingItem(null);
    }
  };

  useEffect(() => {
    fetchHealth();
    runApiTests();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#181d26]">
            Chẩn đoán hệ thống & Kiểm thử API
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#41454d] mt-1">
            Theo dõi trạng thái kết nối Cloud Database, Cổng thanh toán VietQR và kiểm thử tốc độ các API đang sử dụng
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              fetchHealth();
              runApiTests();
            }}
            disabled={loading || testingAll}
            className="w-full sm:w-auto h-10 px-4 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#181d26] text-[13px] font-medium rounded-[6px] flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#9297a0] ${loading || testingAll ? 'animate-spin' : ''}`} />
            <span>Làm mới chẩn đoán</span>
          </button>
        </div>
      </div>

      {/* Grid of Diagnostics: Database & Sepay */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Database Diagnostic Card */}
        <div className="bg-white rounded-[10px] p-4 sm:p-6 lg:p-8 border border-[#dddddd] space-y-4 sm:space-y-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#dddddd] gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[#181d26] flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[13px] sm:text-[14px] font-semibold text-[#181d26] leading-tight">Cơ sở dữ liệu Microsoft SQL Server</h2>
                <span className="text-[11px] text-[#9297a0]">Kết nối theo cấu hình SQLSERVER_*</span>
              </div>
            </div>
            {healthData?.database?.connected ? (
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-[4px] bg-[#f0fdf4] text-[#15803d] text-[11px] sm:text-[12px] font-medium border border-[#bbf7d0] shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đang kết nối tốt</span>
                <span className="sm:hidden">Kết nối tốt</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-[4px] bg-amber-50 text-amber-800 text-[11px] sm:text-[12px] font-medium border border-amber-200 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dự phòng bộ nhớ</span>
                <span className="sm:hidden">Dự phòng</span>
              </span>
            )}
          </div>

          <div className="space-y-2 sm:space-y-2.5 text-[12px] sm:text-[13px]">
            <div className="flex justify-between py-1 border-b border-[#dddddd] gap-2">
              <span className="text-[#41454d]">Động cơ CSDL (Engine):</span>
              <strong className="text-[#181d26] font-medium">{healthData?.database?.engine || 'Đang kiểm tra...'}</strong>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-[#dddddd] gap-0.5 sm:gap-2">
              <span className="text-[#41454d]">Máy chủ SQL Host:</span>
              <strong className="text-[#181d26] font-mono font-medium text-[11px] sm:text-[12px] break-all">
                {healthData?.database?.host || 'Chưa cấu hình'}
              </strong>
            </div>

            <div className="flex justify-between py-1 border-b border-[#dddddd] gap-2">
              <span className="text-[#41454d]">Tên Database:</span>
              <strong className="text-[#181d26] font-mono font-medium">
                {healthData?.database?.databaseName || healthData?.database?.database || 'Chưa cấu hình'}
              </strong>
            </div>

            <div className="flex justify-between py-1 border-b border-[#dddddd] gap-2">
              <span className="text-[#41454d]">Danh mục món (Categories):</span>
              <span className="font-medium text-[#181d26]">{healthData?.database?.categoryCount ?? 0} danh mục</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#dddddd] gap-2">
              <span className="text-[#41454d]">Món ăn thực đơn (Products):</span>
              <span className="font-medium text-[#181d26]">{healthData?.database?.productCount ?? 0} món</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#dddddd] gap-2">
              <span className="text-[#41454d]">Đơn hàng hệ thống (Orders):</span>
              <span className="font-medium text-[#181d26]">{healthData?.database?.orderCount ?? 0} đơn</span>
            </div>
          </div>

          <div
            className={`p-3 sm:p-3.5 rounded-[6px] border text-[12px] space-y-1 ${
              healthData?.database?.connected
                ? 'bg-[#f8fafc] border-[#dddddd] text-[#333840]'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            <div
              className={`font-medium flex items-center gap-1.5 ${
                healthData?.database?.connected ? 'text-[#15803d]' : 'text-amber-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Trạng thái kết nối:</span>
            </div>
            <p className="leading-relaxed text-gray-600">
              {healthData?.database?.details || 'Đang kiểm tra trạng thái kết nối cơ sở dữ liệu...'}
            </p>
          </div>
        </div>

        {/* 2. Sepay API Diagnostic Card */}
        <div className="bg-white rounded-[10px] p-4 sm:p-6 lg:p-8 border border-[#dddddd] space-y-4 sm:space-y-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#dddddd] gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[#181d26] flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4 text-[#A30029]" />
              </div>
              <div>
                <h2 className="text-[13px] sm:text-[14px] font-semibold text-[#181d26] leading-tight">Cổng thanh toán VietQR (Sepay)</h2>
                <span className="text-[11px] text-[#9297a0]">Tự động xác nhận chuyển khoản ngân hàng</span>
              </div>
            </div>
            {healthData?.sepay?.configured ? (
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-[4px] bg-[#f0fdf4] text-[#15803d] text-[11px] sm:text-[12px] font-medium border border-[#bbf7d0] shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sẵn sàng hoạt động</span>
                <span className="sm:hidden">Sẵn sàng</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-[4px] bg-amber-50 text-amber-800 text-[11px] sm:text-[12px] font-medium border border-amber-200 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chưa cấu hình đủ</span>
                <span className="sm:hidden">Thiếu cấu hình</span>
              </span>
            )}
          </div>

          <div className="space-y-2 sm:space-y-2.5 text-[12px] sm:text-[13px]">
            <div className="flex justify-between py-1 border-b border-[#dddddd] gap-2">
              <span className="text-[#41454d]">Ngân hàng nhận tiền:</span>
              <strong className="text-[#181d26] font-medium">{healthData?.sepay?.bank || 'Chưa cấu hình'}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-[#dddddd] gap-2">
              <span className="text-[#41454d]">Số tài khoản thụ hưởng:</span>
              <strong className="font-mono font-medium text-[#181d26]">{healthData?.sepay?.account || 'Chưa cấu hình'}</strong>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-[#dddddd] gap-0.5 sm:gap-2">
              <span className="text-[#41454d]">Tên chủ tài khoản:</span>
              <strong className="text-[#181d26] font-medium uppercase text-[11px] sm:text-[12px] break-all">
                {healthData?.sepay?.accountName || 'Chưa cấu hình'}
              </strong>
            </div>

            <div className="flex justify-between py-1 border-b border-[#dddddd] gap-2">
              <span className="text-[#41454d]">Đường dẫn Webhook:</span>
              <span className="font-mono text-[#181d26] font-medium text-[11px] sm:text-[12px]">/api/sepay/webhook</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-[#dddddd] gap-1">
              <span className="text-[#41454d]">Chế độ thanh toán:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                  {healthData?.sepay?.mode || 'Live'}
                </span>
                {healthData?.sepay?.webhookConfigured && (
                  <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Webhook đã bảo mật
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className={`p-3 sm:p-3.5 rounded-[6px] border text-[12px] space-y-1 ${
              healthData?.sepay?.configured
                ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d]'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {healthData?.sepay?.configured
                  ? 'Hệ thống thanh toán đã kích hoạt hoàn tất:'
                  : 'Cần bổ sung cấu hình SePay trong .env.local:'}
              </span>
            </div>
            <p className="leading-relaxed">
              {healthData?.sepay?.configured
                ? healthData?.sepay?.simulationEnabled
                  ? 'Đang bật chế độ Sandbox (local) song song với VietQR để kiểm thử đơn hàng.'
                  : 'Đang chạy chế độ Live nhận giao dịch thực tế qua VietQR và Webhook SePay.'
                : 'Kiểm tra lại SEPAY_BANK_NAME, SEPAY_BANK_ACCOUNT, SEPAY_ACCOUNT_NAME và SEPAY_API_TOKEN trong .env.local.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Interactive Live API Testing Section */}
      <div className="bg-white rounded-[10px] p-4 sm:p-6 lg:p-8 border border-[#dddddd] space-y-4 sm:space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dddddd]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[6px] bg-[#fff1f2] border border-[#fecdd3] text-[#A30029] flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26]">
                Kiểm thử API trực tiếp (API Diagnostics & Testing)
              </h2>
              <p className="text-[12px] text-[#41454d] mt-0.5">
                Đo độ trễ (latency), trạng thái kết nối và phản hồi thời gian thực của các dịch vụ bên ngoài
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={testingAll}
            onClick={() => runApiTests()}
            className="w-full sm:w-auto h-10 px-4 bg-[#A30029] hover:bg-[#850021] text-white text-[13px] font-medium rounded-[6px] transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {testingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kiểm tra toàn bộ...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Chạy kiểm thử tất cả API</span>
              </>
            )}
          </button>
        </div>

        {/* API Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {apiTests.map((api) => {
            const isThisTesting = testingItem === api.id;
            const isFast = api.latencyMs <= 200;
            const isMedium = api.latencyMs > 200 && api.latencyMs <= 600;

            return (
              <div
                key={api.id}
                className="p-3.5 sm:p-4 rounded-[8px] border border-[#dddddd] bg-[#f8fafc]/50 hover:bg-white hover:border-[#9297a0] transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {api.category}
                    </span>
                    <h3 className="text-[13px] sm:text-[14px] font-semibold text-[#181d26] pt-1 truncate">{api.name}</h3>
                    <div className="text-[11px] font-mono text-gray-500 truncate max-w-[200px] sm:max-w-xs">
                      {api.endpoint}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold shrink-0 ${
                      api.status === 'online'
                        ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]'
                        : api.status === 'offline'
                        ? 'bg-[#fff1f2] text-[#A30029] border border-[#fecdd3]'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {api.status === 'online'
                        ? 'Sẵn sàng'
                        : api.status === 'offline'
                        ? 'Lỗi kết nối'
                        : 'Cảnh báo'}
                    </span>
                  </span>
                </div>

                <p className="text-[12px] text-[#41454d] leading-relaxed line-clamp-2">
                  {api.details}
                </p>

                <div className="pt-2 border-t border-[#dddddd] flex items-center justify-between text-[11px] flex-wrap gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>Độ trễ:</span>{' '}
                      <strong
                        className={`font-mono ${
                          isFast ? 'text-[#15803d]' : isMedium ? 'text-amber-700' : 'text-[#A30029]'
                        }`}
                      >
                        {api.latencyMs}ms
                      </strong>
                    </span>

                    <span className="text-gray-300 hidden sm:inline">|</span>

                    <span className="text-gray-400">Lúc: {api.lastTested}</span>
                  </div>

                  <button
                    type="button"
                    disabled={isThisTesting || testingAll}
                    onClick={() => runApiTests(api.id)}
                    className="text-[#A30029] hover:text-[#850021] font-semibold hover:underline flex items-center gap-1 disabled:opacity-40 ml-auto"
                  >
                    {isThisTesting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span>Test lại</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
