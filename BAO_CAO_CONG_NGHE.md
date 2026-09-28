# BÁO CÁO CÔNG NGHỆ DỰ ÁN NOONEE FOOD

> **Dự án:** NooNee Food - Nền tảng đặt món ăn trực tuyến chuẩn vị  
> **Kiến trúc:** Fullstack Modern Web Application (Next.js App Router)  
> **Cập nhật:** 2026  

---

## 1. TỔNG QUAN STACK CÔNG NGHỆ CHÍNH

| Tầng kiến trúc | Công nghệ chính | Phiên bản | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js (App Router)** | `14.2.15` | Khung ứng dụng chính, hỗ trợ Server Components (RSC), SSR, tối ưu SEO và routing. |
| **Core UI Library** | **React** | `18.3.1` | Thư viện xây dựng giao diện người dùng tương tác cao. |
| **Ngôn ngữ lập trình** | **TypeScript** | `5.6.3` | Đảm bảo Type Safety end-to-end từ Database, API đến UI. |
| **Styling & CSS** | **Tailwind CSS** | `3.4.14` | Utility-first CSS, responsive mobile-first, bảng màu `#A30029` thương hiệu. |
| **Cơ sở dữ liệu (DBMS)** | **Microsoft SQL Server** | `MSSQL` | Hệ quản trị CSDL quan hệ chính (lưu trữ Users, Products, Orders, Groups, v.v.). |
| **DB Driver / Client** | **node-mssql** | `11.0.1` | Quản lý kết nối Database với cơ chế Connection Pooling (`max: 10`). |
| **Data Layer Fallback** | **In-Memory Store** | Custom | Cơ chế tự động fallback sang bộ nhớ RAM khi mất kết nối mạng SQL Server. |

---

## 2. CHI TIẾT CÁC THƯ VIỆN & CÔNG CỤ THEO MODULE

### 2.1. Giao diện & Trải nghiệm người dùng (Frontend & UI)
- **Tailwind CSS & PostCSS:** Xây dựng toàn bộ giao diện responsive, dark/light contrast, tối ưu hiển thị mobile.
- **Framer Motion (`^13.4.0`):** Hiệu ứng chuyển động mượt mà cho các modal, tab thực đơn và giỏ hàng.
- **ScrollReveal (Custom Hook & Component):** Tối ưu hiệu ứng xuất hiện khi cuộn trang bằng Web API `IntersectionObserver` không gây giật lag.
- **React Icons (`^5.7.0`) & Lucide React (`^0.453.0`):** Hệ thống icon trực quan (bộ icon Ci bo tròn và Lucide tối giản).
- **Recharts (`^3.10.1`):** Vẽ biểu đồ doanh thu, thống kê đơn hàng động trong trang quản trị Admin.
- **Typography:** Google Font *Montserrat*, *Plus Jakarta Sans* và font chữ ký thương hiệu *Friem*.

### 2.2. Backend & Xử lý API (Server Runtime)
- **Next.js Route Handlers (`src/app/api/**`):** Xây dựng 37+ RESTful API endpoints xử lý toàn bộ logic nghiệp vụ (Auth, Products, Cart, Orders, Admin, Support).
- **JSON Web Token (`jsonwebtoken ^9.0.3`):** Xác thực và phân quyền người dùng (User/Admin) qua Cookie/Header an toàn.
- **Bcrypt.js (`^3.0.3`):** Mã hóa mật khẩu một chiều với salt rounds = 12, chống brute-force.
- **Rate Limiter (Custom Sliding Window):** Cơ chế chống spam, giới hạn tần suất gọi API (VD: tối đa 80 request/phút) và tự động chặn IP khả nghi.
- **XSS & Input Sanitizer:** Chuẩn hóa dữ liệu đầu vào, phòng chống SQL Injection và XSS.

### 2.3. Tích hợp Dịch vụ Bên Thứ Ba (Third-party Services)
- **Thanh toán VietQR (`qrcode ^1.5.4`):** Tạo mã QR thanh toán động chuẩn EMVCo của ngân hàng Việt Nam, quét chuyển khoản 1-chạm không mất phí.
- **Cloudinary SDK (`^2.11.0`):** Lưu trữ, nén và tối ưu CDN cho toàn bộ hình ảnh món ăn tải lên từ trang Admin.
- **Chatbot AI (LLM7 Gateway - llm7.io):** Tích hợp nền tảng LLM7 (OpenAI-compatible) với mô hình `fast` tốc độ cao, tư vấn thực đơn thông minh theo khẩu vị khách hàng dựa trên dữ liệu món ăn `Food.csv`.
- **Báo cáo Excel (`xlsx ^0.18.5`):** Cho phép Quản trị viên xuất báo cáo đơn hàng và doanh thu sang file `.xlsx`.
- **Bản đồ & Định vị:** Tích hợp OpenStreetMap Nominatim API để tự động gợi ý địa chỉ giao hàng và tính phí vận chuyển theo khoảng cách.

---

## 3. ĐIỂM NỔI BẬT VỀ KIẾN TRÚC KỸ THUẬT

1. **Hybrid Rendering:** Kết hợp linh hoạt Server Components (tải dữ liệu nhanh, SEO tốt) và Client Components (tương tác giỏ hàng, đặt món nhóm thời gian thực).
2. **Khả năng chịu lỗi cao (Fault Tolerance):** Khi Cloud Database gặp sự cố mạng, tầng dữ liệu tự động kích hoạt chế độ Fallback In-Memory giúp trang web vẫn duyệt món bình thường mà không bị crash (Error 500).
3. **Bảo mật đa tầng:** Bảo vệ qua Honeypot Trap, xác thực quyền Admin Guard, mã hóa dữ liệu nhạy cảm và cơ chế Rate Limiting chống quét cào dữ liệu.
4. **Trải nghiệm Mobile tối ưu:** Tinh giản hóa giao diện di động, loại bỏ các cụm ảnh thừa thãi giúp tải trang siêu tốc dưới 1.5 giây.
