'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#f8fafc]">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#181d26]">Đã xảy ra lỗi</h2>
        <p className="text-sm text-[#41454d]">
          Rất tiếc, đã có sự cố xảy ra. Vui lòng thử lại hoặc quay về trang chủ.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#181d26] text-white text-sm font-medium rounded-lg hover:bg-[#0d1218] transition"
          >
            Thử lại
          </button>
          <a
            href="/"
            className="px-5 py-2.5 border border-[#dddddd] text-[#181d26] text-sm font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
