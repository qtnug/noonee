import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#f8fafc]">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-6xl font-bold text-[#181d26]">404</h1>
        <h2 className="text-xl font-semibold text-[#333840]">Không tìm thấy trang</h2>
        <p className="text-sm text-[#41454d]">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-[#181d26] text-white text-sm font-medium rounded-lg hover:bg-[#0d1218] transition mt-2"
        >
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}
