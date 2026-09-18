import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';

const friemFont = localFont({
  src: '../../public/fonts/Friem-Regular.ttf',
  variable: '--font-friem',
  display: 'swap',
});

const plusJakartaSans = localFont({
  src: [
    {
      path: '../../public/fonts/PlusJakartaSans-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/PlusJakartaSans-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/PlusJakartaSans-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NooNee Food - Quán Ăn Online Chuẩn Vị & Đặt Món Nhanh',
  description: 'Website đặt món ăn trực tuyến NooNee Food, thực đơn tươi ngon mỗi ngày, giao hàng nhanh chóng và thanh toán tiện lợi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${plusJakartaSans.variable} ${friemFont.variable} font-sans`}>
      <body className="flex flex-col min-h-screen pb-14 md:pb-0 font-sans">
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <CartDrawer />
              <MobileBottomNav />
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
