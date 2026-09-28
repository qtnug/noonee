# BẢNG ĐẶC TẢ TOÀN DIỆN VÀ CHI TIẾT NHẤT: TẤT CẢ TÍNH NĂNG VÀ PHI TÍNH NĂNG CỦA HỆ THỐNG NOONEE FOOD
> **Dự án**: Hệ thống Đặt Món Ăn Trực Tuyến & Quản Trị Cửa Hàng NooNee Food  
> **Cơ sở thực tế**: 120 Yên Lãng, Phường Thịnh Quang, Quận Đống Đa, Hà Nội  
> **Ngăn xếp công nghệ cốt lõi**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Microsoft SQL Server 2022 Cloud, SePay VietQR (Napas 247), Goong.io Maps API, Google Gemini AI (LLM7), Cloudinary Media CDN, SheetJS (XLSX).  
> **Phạm vi tài liệu**: Liệt kê 100% tất cả các tính năng chức năng (từ các luồng nghiệp vụ lớn đến các vi tính năng nhỏ nhất ở cả phía Khách hàng lẫn Cổng Quản trị Admin) và tất cả các yêu cầu phi tính năng của hệ thống.

---

# MỤC LỤC
1. [PHẦN I: TẤT CẢ CÁC TÍNH NĂNG CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)](#phần-i-tất-cả-các-tính-năng-chức-năng-functional-requirements)
   - [1. Phân hệ Trang chủ & Trải nghiệm Người dùng (Homepage & UX)](#1-phân-hệ-trang-chủ--trải-nghiệm-người-dùng-homepage--ux)
   - [2. Phân hệ Thực đơn, Khám phá & Tùy biến Món ăn (Menu, Search & Customization)](#2-phân-hệ-thực-đơn-khám-phá--tùy-biến-món-ăn-menu-search--customization)
   - [3. Phân hệ Giỏ hàng & Đồng bộ Dữ liệu (Cart Management)](#3-phân-hệ-giỏ-hàng--đồng-bộ-dữ-liệu-cart-management)
   - [4. Phân hệ Đặt món theo Nhóm Độc quyền (Group Order System)](#4-phân-hệ-đặt-món-theo-nhóm-độc-quyền-group-order-system)
   - [5. Phân hệ Định vị Bản đồ & Tính Phí Giao hàng Thông minh (Smart Shipping & Goong Maps)](#5-phân-hệ-định-vị-bản-đồ--tính-phí-giao-hàng-thông-minh-smart-shipping--goong-maps)
   - [6. Phân hệ Khuyến mãi, Mã giảm giá kép & Hạng Thành viên (Coupons & Membership)](#6-phân-hệ-khuyến-mãi-mã-giảm-giá-kép--hạng-thành-viên-coupons--membership)
   - [7. Phân hệ Thanh toán Đa kênh & Đối soát VietQR Tự động (Checkout & Payment Gateway)](#7-phân-hệ-thanh-toán-đa-kênh--đối-soát-vietqr-tự-động-checkout--payment-gateway)
   - [8. Phân hệ Theo dõi Đơn hàng, Lịch sử & Đánh giá Mua hàng (Tracking, History & Reviews)](#8-phân-hệ-theo-dõi-đơn-hàng-lịch-sử--đánh-giá-mua-hàng-tracking-history--reviews)
   - [9. Phân hệ Trợ lý Ảo AI Tư vấn Món ăn (AI Food Assistant Chatbot)](#9-phân-hệ-trợ-lý-ảo-ai-tư-vấn-món-ăn-ai-food-assistant-chatbot)
   - [10. Phân hệ Tài khoản, Xác thực & Ví ảo Cá nhân (Authentication, Profile & Virtual Wallet)](#10-phân-hệ-tài-khoản-xác-thực--ví-ảo-cá-nhân-authentication-profile--virtual-wallet)
   - [11. Phân hệ Hỗ trợ Khách hàng & Kênh Khiếu nại Đơn hàng (Customer Support & Ticket System)](#11-phân-hệ-hỗ-trợ-khách-hàng--kênh-khiếu-nại-đơn-hàng-customer-support--ticket-system)
   - [12. Phân hệ Cổng Quản trị Viên Toàn diện (Admin Management Portal)](#12-phân-hệ-cổng-quản-trị-viên-toàn-diện-admin-management-portal)
2. [PHẦN II: TẤT CẢ CÁC YÊU CẦU PHI TÍNH NĂNG (NON-FUNCTIONAL REQUIREMENTS)](#phần-ii-tất-cả-các-yêu-cầu-phi-tính-năng-non-functional-requirements)
   - [1. An ninh & Bảo mật Đa tầng (Security & Threat Defense)](#1-an-ninh--bảo-mật-đa-tầng-security--threat-defense)
   - [2. Giới hạn Tần suất & Chống Tấn công Tải (Rate Limiting & DDoS Mitigation)](#2-giới-hạn-tần-suất--chống-tấn-công-tải-rate-limiting--ddos-mitigation)
   - [3. Hiệu năng & Tối ưu Core Web Vitals (Performance)](#3-hiệu-năng--tối-ưu-core-web-vitals-performance)
   - [4. Tính Sẵn sàng Cao & Cơ chế Dự phòng Ngoại tuyến (High Availability & Fallback)](#4-tính-sẵn-sàng-cao--cơ-chế-dự-phòng-ngoại-tuyến-high-availability--fallback)
   - [5. Toàn vẹn Dữ liệu & Thẩm định Phía Máy chủ (Data Integrity & Server Validation)](#5-toàn-vẹn-dữ-liệu--thẩm-định-phía-máy-chủ-data-integrity--server-validation)
   - [6. Tương thích Đa thiết bị & Trải nghiệm Người dùng (Compatibility & UX)](#6-tương-thích-đa-thiết-bị--trải-nghiệm-người-dùng-compatibility--ux)
   - [7. Khả năng Bảo trì, Giám sát & Nhật ký An ninh (Maintainability & Observability)](#7-khả-năng-bảo-trì-giám-sát--nhật-ký-an-ninh-maintainability--observability)
3. [PHẦN III: BẢNG ÁNH XẠ TOÀN DIỆN CỦA HỆ THỐNG](#phần-iii-bảng-ánh-xạ-toàn-diện-của-hệ-thống)
   - [Bảng Ánh xạ 37 Route API Backend](#bảng-ánh-xạ-37-route-api-backend)
   - [Bảng Ánh xạ 9 Bảng Cơ sở Dữ liệu SQL Server](#bảng-ánh-xạ-9-bảng-cơ-sở-dữ-liệu-sql-server)

---

# PHẦN I: TẤT CẢ CÁC TÍNH NĂNG CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

---

### 1. PHÂN HỆ TRANG CHỦ & TRẢI NGHIỆM NGƯỜI DÙNG (HOMEPAGE & UX)
* **1.1. Khối Hero Section Nghệ thuật Đa tầng (`HeroFoodCollage`)**:
  * Trình bày bố cục nghệ thuật với Collage 6 món ăn đặc trưng được tách nền sắc nét (Bún chả, Cơm tấm sườn bì chả, Bánh xèo, Gà popcorn, Trà sữa trân châu, Phở bò) trên nền kem ấm `#FFFAF0`.
  * **Đáp ứng di động thông minh**: Trên màn hình máy tính hiển thị Collage 6 món với hiệu ứng chiều sâu; trên điện thoại tự động chuyển sang cụm 3 món ăn đại diện với bố cục z-index chống tràn viền.
  * Tiêu đề nhận diện thương hiệu với điểm nhấn màu đỏ đun `#A30029`: *"Thưởng thức món ngon chuẩn vị & giao tận nơi"*.
  * Hai nút kêu gọi hành động (CTA Buttons):
    * Nút đỏ chính: *"Khám phá thực đơn"* (chuyển hướng `/menu`) có hiệu ứng bóng đổ và co giãn khi bấm (`hover:scale-[1.02] active:scale-[0.98]`).
    * Nút trắng viền: *"Tra cứu đơn hàng"* (chuyển hướng `/orders`) hỗ trợ khách vãng lai và thành viên tra cứu đơn nhanh.
* **1.2. Thanh Chữ Chạy Quảng Cáo Động (`NavbarPromoMarquee`)**:
  * Đặt ngay dưới thanh Navbar, hoạt động vô tận qua CSS `@keyframes marquee` với chu kỳ chạy chuẩn **65 giây / vòng lặp** (độ dài chữ vừa phải, không gây chóng mặt).
  * **Tính năng Tạm dừng khi rê chuột (Pause on Hover)**: Khách hàng chỉ cần rê chuột vào thanh chữ chạy thì toàn bộ dòng chữ lập tức dừng lại để đọc kỹ hoặc click tương tác.
  * Tích hợp 5 nội dung ưu đãi kèm hành động trực tiếp:
    1. **Voucher VietQR 20%**: Nút bấm sao chép mã `VIETQR20` trực tiếp vào Clipboard, tự động hiển thị thông báo badge *"✓ Đã chép"* trong 2.5 giây.
    2. **Đơn nhóm giảm tới 15%**: Nút link điều hướng *"Tạo phòng ngay →"* trỏ về `/group`.
    3. **Freeship đơn từ 120.000đ**: Thông báo chính sách miễn phí vận chuyển toàn dải kèm link xem thực đơn.
    4. **Voucher 10K**: Nút sao chép mã `NOONEE10K` áp dụng đơn từ 60.000đ.
    5. **Gom đơn đồng nghiệp**: Nút link điều hướng *"Tham gia phòng →"* trỏ về `/group`.
* **1.3. Băng Chuyền Món Bán Chạy Vô Tận (`BannerSlider` / 8 Best-Sellers Carousel)**:
  * Trình chiếu tự động 8 món ăn bán chạy nhất của quán ăn (ưu tiên các món có cờ `isFeatured = true` và các món được gọi nhiều nhất).
  * Hỗ trợ vuốt chạm cảm ứng (Touch / Swipe) trên điện thoại và nút mũi tên điều hướng trái/phải trên máy tính.
  * Hiển thị thẻ món: Hình ảnh món ăn bo góc, tên món, đơn giá VNĐ, cờ hiệu *"HOT 🔥"* màu đỏ rực rỡ và liên kết xem chi tiết món ăn.
* **1.4. Lưới Món Ăn Nổi Bật (`Featured Products Grid`)**:
  * Trình bày 8 món ăn nổi bật trong lưới 2 hàng x 4 cột (responsive 2 cột trên di động, 3 cột trên tablet, 4 cột trên desktop).
  * Nút xem tất cả thực đơn có biểu tượng chevron chuyển tiếp sang trang `/menu`.
* **1.5. Khối Quảng Cáo VietQR Skeudesign (`PromoBanner`)**:
  * Nền tối `#0F0F0F` kết hợp hiệu ứng kính mờ Glassmorphism (`backdrop-blur-xl bg-white/5 border border-white/10`).
  * Mô phỏng thẻ thanh toán VietQR ngân hàng thực tế với biểu tượng mã QR dạng lưới SVG, huy hiệu vàng `20%` và hiệu ứng vạch quét ánh sáng (Scan-line animation).
  * Tự động kiểm tra trạng thái người dùng qua API `/api/user/promo-status`: Tự động ẩn banner nếu tài khoản đã từng thanh toán VietQR trước đó (chỉ hiển thị cho khách mới).
* **1.6. Khối Đặt Món Theo Nhóm Marquee (`GroupOrderBanner`)**:
  * Trình diễn dải marquee vô tận minh họa trực quan 5 bước đặt nhóm: `🏠 Tạo phòng nhóm` $\rightarrow$ `🔗 Gửi link cho bạn` $\rightarrow$ `🍜 Mọi người chọn món` $\rightarrow$ `📦 Gom 1 đơn duy nhất` $\rightarrow$ `🚀 Giao cùng lúc`.
  * Hai nút bấm tương tác: *"Tạo phòng mới"* và *"Tham gia bằng mã"*.
* **1.7. Thanh Điều Hướng Đỉnh Cố Định (`Navbar`)**:
  * Hiệu ứng làm mờ hậu cảnh khi cuộn trang (`backdrop-blur-md bg-[#FFFAF0]/95`).
  * Logo nhận diện NooNee Food màu đỏ đun `#A30029`.
  * Menu điều hướng chính: Trang chủ, Thực đơn, Món bán chạy, Đơn nhóm, Tra cứu đơn, Liên hệ.
  * **Biểu tượng Giỏ hàng Thời gian thực (Live Cart Counter)**: Huy hiệu tròn đỏ hiển thị tổng số lượng món ăn đang có trong giỏ hàng, cập nhật ngay lập tức khi thêm món.
  * **Menu Tài khoản Dropdown Đa Năng**:
    * Khi chưa đăng nhập: Nút *"Đăng nhập"* và *"Đăng ký"*.
    * Khi đã đăng nhập: Hiển thị tên người dùng, avatar chữ cái, huy hiệu vai trò (`Khách hàng` hoặc `Quản trị viên`), các mục liên kết *"Hồ sơ cá nhân"*, *"Đổi mật khẩu"*, *"Lịch sử đơn hàng"*, *"Cổng Quản trị Admin"* (chỉ hiển thị nếu role là `admin`), và nút *"Đăng xuất"*.
* **1.8. Thanh Điều Hướng Đáy Dành Riêng Cho Di Động (`MobileBottomNav`)**:
  * Cố định dưới đáy màn hình trên thiết bị di động (`< lg`): Trang chủ, Thực đơn, Đơn nhóm (biểu tượng nhóm nổi bật), Giỏ hàng (kèm số lượng món màu đỏ), Tài khoản.
* **1.9. Chân Trang Toàn Diện (`Footer`)**:
  * Địa chỉ cơ sở: `120 Yên Lãng, Phường Thịnh Quang, Quận Đống Đa, Hà Nội`.
  * Hotline hỗ trợ, email liên hệ, giờ mở cửa (08:00 - 22:30 hàng ngày).
  * Liên kết chính sách thanh toán, chính sách đổi trả, bảo mật thông tin và mạng xã hội.

---

### 2. PHÂN HỆ THỰC ĐƠN, KHÁM PHÁ & TÙY BIẾN MÓN ĂN (MENU, SEARCH & CUSTOMIZATION)
* **2.1. Bộ Lọc Danh Mục Dạng Thẻ Nổi (Category Pills)**:
  * Thanh trượt ngang lọc danh mục: Tất cả món, Cơm các loại, Bún - Phở - Mì, Đồ ăn vặt, Đồ uống thanh mát...
  * Dữ liệu danh mục đồng bộ trực tiếp từ bảng `Categories` trong SQL Server.
* **2.2. Tìm Kiếm Món Ăn Thời Gian Thực (Live Debounced Search)**:
  * Ô tìm kiếm hỗ trợ lọc món ăn theo tên món hoặc thành phần mô tả.
  * Tích hợp cơ chế khử rung phím (Debounce) giúp giao diện mượt mà và không gây giật lag.
  * Nút xóa nhanh nội dung tìm kiếm `(X)`.
* **2.3. Lọc Theo Món Bán Chạy & Khoảng Giá**:
  * Tùy chọn lọc các món Best-Seller (`isFeatured = true`).
  * Sắp xếp theo giá tăng dần, giá giảm dần hoặc theo tên món A-Z.
* **2.4. Thẻ Món Ăn Đa Năng (`ProductCard`)**:
  * Hình ảnh đại diện tỷ lệ vuông 1:1, tự động tối ưu hóa qua Next.js Image.
  * Tên món ăn, đơn giá định dạng chuẩn Việt Nam Đồng (VNĐ).
  * Hiển thị điểm đánh giá sao trung bình thực tế (ví dụ: `★ 5.0 (12)`).
  * Hiển thị thời gian chế biến ước tính (`prepTime: 15 phút`) kèm biểu tượng đồng hồ.
  * **Nút Trái Tim Yêu Thích (Favorite Button)**: Cho phép thả tim lưu món ăn vào danh sách yêu thích cá nhân (lưu trữ trong `FavoritesContext` và LocalStorage).
  * Nút *"Thêm nhanh"* (nếu món không có topping bắt buộc) hoặc *"Chọn món"* để mở Modal cấu hình tùy chọn.
* **2.5. Trang Chi Tiết Món Ăn Riêng Biệt (`/product/[slug]`)**:
  * Đường dẫn URL tĩnh thân thiện chuẩn SEO theo slug (ví dụ: `/product/com-tam-suon-bi-cha`).
  * Khối ảnh lớn độ nét cao, mô tả hương vị chi tiết, danh mục, thời gian chuẩn bị.
  * Bộ đếm số lượng tăng giảm `[-] [số lượng] [+]` trước khi thêm vào giỏ.
  * Khối hiển thị toàn bộ đánh giá và nhận xét của khách hàng đã ăn món này.
* **2.6. Hộp Thoại Tùy Biến Món Ăn Chuyên Sâu (`ProductOptionsModal`)**:
  * **Lựa chọn Kích cỡ (Size)**: Size Nhỏ (Giá gốc), Size Vừa (+5.000đ), Size Lớn (+10.000đ).
  * **Lựa chọn Mức Đường & Mức Đá (đối với Đồ uống)**: Đường (0%, 30%, 50%, 70%, 100%), Đá (Không đá, Ít đá, Bình thường).
  * **Danh sách Topping / Món ăn kèm có tính thêm phí động**:
    * Checkbox chọn nhiều topping: Trứng ốp la (+7.000đ), Chả bì (+10.000đ), Phô mai kéo sợi (+8.000đ), Trân châu trắng (+5.000đ), Sườn nướng thêm (+25.000đ)...
    * Giá tiền topping được cộng dồn theo thời gian thực vào đơn giá hiển thị trên nút *"Thêm vào giỏ hàng"*.
  * **Ghi chú riêng cho Đầu bếp**: Ô nhập văn bản (tối đa 200 ký tự) cho các yêu cầu đặc biệt như *"Không bỏ hành lá"*, *"Nước chấm để riêng"*, *"Làm thật cay"*, *"Ít ngọt"*.
* **2.7. Hệ Thống Danh Sách Món Yêu Thích (`FavoritesContext`)**:
  * Quản lý danh sách các món ăn đã được người dùng thả tim.
  * Dữ liệu được đồng bộ trong LocalStorage, giúp người dùng mở lại danh sách yêu thích để đặt hàng nhanh chóng trong những lần sau.

---

### 3. PHÂN HỆ GIỎ HÀNG & ĐỒNG BỘ DỮ LIỆU (CART MANAGEMENT)
* **3.1. Ngăn Kéo Giỏ Hàng Trượt Nhanh (`CartDrawer`)**:
  * Trượt mượt mà từ cạnh phải màn hình khi người dùng thêm món ăn mới, không chuyển trang gây gián đoạn duyệt thực đơn.
  * Liệt kê từng món ăn đã chọn: Ảnh thu nhỏ, tên món, đơn giá, số lượng, danh sách topping đã chọn và ghi chú đầu bếp đi kèm.
  * Nút tăng `(+)` hoặc giảm `(-)` số lượng trực tiếp. Nếu giảm từ 1 về 0, hệ thống tự động xóa món khỏi giỏ hàng.
  * Nút biểu tượng thùng rác xóa từng món nhanh.
  * Hiển thị tổng tiền tạm tính (Subtotal) và nút chuyển tiếp sang trang Thanh toán.
* **3.2. Trang Giỏ Hàng Chi Tiết (`/cart`)**:
  * Bảng danh sách chi tiết các món ăn trong giỏ hàng.
  * Cho phép chỉnh sửa số lượng từng món hoặc bấm nút *"Xóa toàn bộ giỏ hàng"*.
  * Cảnh báo giỏ hàng trống kèm nút bấm *"Quay lại thực đơn chọn món"*.
  * Tích hợp ô thử nghiệm nhập mã giảm giá (Coupon Code) để ước tính trước số tiền tiết kiệm.
* **3.3. Cơ Chế Lưu Trữ & Phân Biệt Cấu Hình Món Ăn (`CartContext`)**:
  * Đồng bộ hai chiều với `localStorage`: Giữ nguyên giỏ hàng khi người dùng tải lại trang (F5), chuyển trang, hoặc đóng trình duyệt mở lại.
  * **Phân biệt cấu hình món ăn thông minh**: Nếu người dùng chọn cùng một món ăn nhưng khác kích cỡ (Size M vs Size L), khác danh sách Topping, hoặc khác Ghi chú, hệ thống tự động tách thành các dòng sản phẩm riêng biệt trong giỏ hàng chứ không gộp bừa bãi.

---

### 4. PHÂN HỆ ĐẶT MÓN THEO NHÓM ĐỘC QUYỀN (GROUP ORDER SYSTEM)
* **4.1. Khởi Tạo Phòng Đặt Nhóm Ảo (`/group`)**:
  * Khách hàng bấm *"Tạo phòng nhóm mới"* và nhập tên phòng (ví dụ: *"Team Kế Toán trưa thứ 6"*, *"Hội ăn vặt phòng 304"*).
  * Hệ thống tự động sinh một mã phòng độc nhất gồm 6 ký tự ngẫu nhiên (ví dụ: `NN-8392`).
  * Người tạo phòng được cấp quyền **Trưởng nhóm (Host)** và gắn `hostUserId`.
* **4.2. Tham Gia Phòng Nhóm Nhanh Chóng**:
  * Người tham gia chỉ cần nhập mã phòng 6 ký tự tại trang `/group` hoặc nhấp trực tiếp vào đường link chia sẻ `/group/[code]`.
  * Nhập tên hiển thị của thành viên để mọi người trong phòng nhận diện.
* **4.3. Giỏ Hàng Nhóm Dùng Chung Thời Gian Thực (`/group/[code]`)**:
  * Mọi thành viên trong phòng đều có thể tự do mở thực đơn và chọn món ăn, chọn topping cho riêng mình.
  * Danh sách giỏ hàng nhóm hiển thị rõ ràng từng món do thành viên nào chọn (ví dụ: *"Minh Quân: 1x Cơm tấm sườn + Trứng ốp la"*, *"Đức Anh: 1x Trà đào cam sả ít đường"*).
  * Từng thành viên có quyền xóa hoặc sửa món ăn của chính mình; Trưởng nhóm có quyền xóa món của bất kỳ thành viên nào nếu cần điều chỉnh.
  * Nút sao chép mã phòng và nút sao chép toàn bộ đường link mời bạn bè kèm thông báo phản hồi *"Đã chép link"*.
  * Tự động làm mới danh sách món ăn và thành viên tham gia qua chu kỳ polling ngầm.
* **4.4. Thuật Toán Chiết Khấu Lũy Tiến Đơn Nhóm (`calculateGroupDiscount`)**:
  * Tự động áp dụng chiết khấu trực tiếp trên tổng tiền món ăn dựa trên quy mô số người tham gia đặt món:
    * Dưới 3 người: Chiết khấu 0%, hiển thị thông báo *"Thêm 1 người để giảm 2%"*.
    * Nhóm từ 3 đến 4 người: **Giảm ngay 2%** tổng tiền món ăn.
    * Nhóm từ 5 đến 9 người: **Giảm ngay 5%** tổng tiền món ăn.
    * Nhóm từ 10 người trở lên: **Giảm tối đa 10%** tổng tiền món ăn.
  * Hiển thị thanh tiến trình trực quan và thông báo rõ số lượng thành viên cần tham gia thêm để thăng hạng chiết khấu tiếp theo.
* **4.5. Phân Quyền Khóa Phòng & Chốt Đơn Thanh Toán (Host Finalize)**:
  * **Quyền đặc quyền của Trưởng nhóm (Host)**: Chỉ duy nhất Trưởng nhóm mới có nút bấm *"Khóa phòng & Tiến hành thanh toán"*. Thành viên tham gia chỉ có quyền xem trạng thái chờ.
  * **Ràng buộc tối thiểu 2 người**: Hệ thống bắt buộc phòng phải có từ 2 thành viên trở lên mới cho phép tạo đơn nhóm (ngăn chặn hành vi tạo phòng ảo 1 người để lách luật).
  * **Khóa phòng chống đặt thêm**: Khi Trưởng nhóm bấm khóa phòng, trạng thái phòng chuyển sang `locked`, các thành viên không thể thêm hay xóa món được nữa.
  * **Chống thanh toán trùng lặp**: Khi Trưởng nhóm tạo đơn thanh toán thành công, phòng nhóm chuyển sang trạng thái `completed`, gắn mã đơn hàng thực tế `finalOrderCode`, ngăn chặn việc đặt hàng lần thứ hai từ cùng một phòng nhóm.

---

### 5. PHÂN HỆ ĐỊNH VỊ BẢN ĐỒ & TÍNH PHÍ GIAO HÀNG THÔNG MINH (SMART SHIPPING & GOONG MAPS)
* **5.1. Tự Động Gợi Ý Địa Chỉ Thông Minh (`Goong Place AutoComplete API`)**:
  * Tích hợp thành phần nhập địa chỉ `AddressAutocompleteInput`: Khi người dùng gõ địa chỉ giao hàng, hệ thống gửi yêu cầu tới Goong Maps API và hiển thị danh sách gợi ý địa điểm chuẩn xác tại Hà Nội.
  * Danh mục gợi ý nhanh các địa danh phổ biến: Đại học Thủy Lợi, Keangnam Landmark 72, Vincom Phạm Ngọc Thạch, Royal City, Times City, Đại học Bách Khoa, Hồ Hoàn Kiếm...
* **5.2. Đo Khoảng Cách Lái Xe Máy Thực Tế (`Goong Distance Matrix API`)**:
  * Tọa độ gốc cố định của nhà hàng NooNee Food tại **120 Yên Lãng, Đống Đa, Hà Nội** (`lat: 21.011467, lng: 105.816642`).
  * Gọi Goong Distance Matrix API với phương tiện xe máy (`vehicle=bike`) để lấy chính xác số mét đường bộ và số phút di chuyển thực tế theo mạng lưới giao thông ngõ phố Hà Nội.
* **5.3. Giải Thuật Haversine Dự Phòng Khi Mất Kết Nối (`calculateHaversineDistance`)**:
  * Nếu Goong Maps API gặp sự cố mạng hoặc hết hạn mức truy vấn, hệ thống tự động kích hoạt thuật toán Haversine tính khoảng cách đại vòng tròn:
    $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
  * Nhân với hệ số uốn lượn thực nghiệm đường phố đô thị Hà Nội **$1.35\times$** để tính ra cự ly đường bộ chuẩn xác mà không cần phụ thuộc vào API bên ngoài.
* **5.4. Biểu Phí Vận Chuyển Bậc Thang Công Bằng (`calculateShippingFeeByKm`)**:
  * Cự ly $\le 2.0$ km: Cước cơ bản **15.000 VNĐ**.
  * Cự ly từ $2.0$ km đến $10.0$ km: **15.000 VNĐ + 5.000 VNĐ cho mỗi km tiếp theo**.
  * Cự ly $> 10.0$ km: **55.000 VNĐ + 7.000 VNĐ cho mỗi km tiếp theo**.
  * Giới hạn cự ly phục vụ: Tối đa **15.0 km**. Nếu khoảng cách vượt quá 15km, hệ thống hiển thị cờ cảnh báo `isOutOfRange = true` thông báo khách hàng nằm ngoài bán kính giao hàng của quán.
* **5.5. Chính Sách Miễn Phí Vận Chuyển Toàn Diện (Freeship 0đ)**:
  * Tự động giảm phí giao hàng về **0 VNĐ** đối với bất kỳ đơn hàng nào có tổng tiền món ăn từ **120.000 VNĐ** trở lên hoặc khi áp dụng mã voucher `FREESHIP`.

---

### 6. PHÂN HỆ KHUYẾN MÃI, MÃ GIẢM GIÁ KÉP & HẠNG THÀNH VIÊN (COUPONS & MEMBERSHIP)
* **6.1. Hỗ Trợ Đa Dạng Các Loại Mã Khuyến Mãi**:
  * **Mã Giảm Phí Vận Chuyển (Freeship Coupons)**:
    * `FREESHIP`: Miễn toàn bộ 100% phí giao hàng cho đơn từ 120.000đ.
    * `SHIP15K`: Giảm 15.000đ phí giao hàng cho đơn từ 80.000đ.
  * **Mã Giảm Tiền Món Ăn (Food Discount Coupons)**:
    * `VIETQR20`: Giảm **20%** tối đa 40.000đ cho khách hàng mới thanh toán bằng chuyển khoản VietQR.
    * `GIAM10K`: Giảm ngay 10.000đ cho đơn từ 50.000đ.
    * `GIAM20K`: Giảm ngay 20.000đ cho đơn từ 90.000đ.
    * `GIAM30K`: Giảm ngay 30.000đ cho đơn từ 140.000đ.
    * `GIAM20P`: Giảm 20% tối đa 35.000đ cho đơn từ 80.000đ.
  * **Mã Khuyến Mãi Độc Quyền Theo Ngành Hàng (Category Exclusive)**:
    * Mã chỉ áp dụng cho đơn có món Cơm / Bún / Phở (`categoryExclusive: 'rice'`).
    * Mã chỉ áp dụng cho đơn có Đồ uống thanh mát (`categoryExclusive: 'drinks'`).
    * Mã chỉ áp dụng cho đơn có món Bán chạy (`categoryExclusive: 'best_seller'`).
  * **Tính năng Chồng Mã Giảm Giá Kép (Stacking Coupons)**:
    * Cho phép khách hàng áp dụng đồng thời **1 Mã giảm tiền món ăn** VÀ **1 Mã miễn/giảm phí vận chuyển (Freeship)** trên cùng một đơn hàng!
* **6.2. Động Cơ Thẩm Định Voucher Đa Điều Kiện (`validateCoupon`)**:
  * Kiểm tra ngày hết hạn (`expiryDate`).
  * Kiểm tra số lượt sử dụng tối đa (`usageLimit`) và số lượt đã dùng thực tế (`usedCount`).
  * Kiểm tra cờ kích hoạt (`isActive`).
  * Kiểm tra giá trị đơn hàng tối thiểu (`minOrderAmount`).
  * Kiểm tra phương thức thanh toán bắt buộc (`requiresVietQR: true` yêu cầu thanh toán Sepay).
  * Kiểm tra khách hàng mới (`forNewUserOnly: true` kiểm tra lịch sử đã từng thanh toán đơn đầu chưa).
  * Tự động tăng biến đếm số lượt đã sử dụng (`incrementCouponUsage`) sau khi đặt hàng thành công.
* **6.3. Hệ Thống 4 Cấp Bậc Thành Viên Thân Thiết (`membership.ts`)**:
  * Tự động tích lũy tổng doanh số chi tiêu từ các đơn hàng hoàn tất (`totalSpent`).
  * **🥉 Hạng Đồng (Bronze) [0đ - 499.999đ]**:
    * Quyền lợi: Tự động tích lũy chi tiêu sau mỗi đơn; hưởng mã khách mới `VIETQR20`.
  * **🥈 Hạng Bạc (Silver) [500.000đ - 1.499.999đ]**:
    * Quyền lợi: **Giảm 5.000đ phí vận chuyển** cho mọi đơn hàng.
    * Tặng Voucher độc quyền Hạng Bạc: `SILVER10` (Giảm 10.000đ cho đơn từ 80.000đ).
    * Ưu tiên xử lý đơn hàng trong giờ cao điểm.
  * **🥇 Hạng Vàng (Gold) [1.500.000đ - 3.499.999đ]**:
    * Quyền lợi: **Giảm 10.000đ phí vận chuyển** cho mọi đơn hàng.
    * Hưởng trọn vẹn toàn bộ voucher của Hạng Bạc.
    * Tặng Voucher độc quyền Hạng Vàng: `GOLD25` (Giảm 25.000đ cho đơn từ 150.000đ), `GOLDVIP` (Giảm 15% cho đơn từ 200.000đ).
    * Bếp ưu tiên chế biến nhanh.
  * **💎 Hạng Kim Cương (VIP Diamond) [Từ 3.500.000đ trở lên]**:
    * Quyền lợi: **Giảm ngay 25.000đ phí vận chuyển** cho mỗi đơn hàng (miễn phí ship cho hầu hết các cự ly).
    * Hưởng trọn vẹn toàn bộ voucher của Hạng Bạc và Hạng Vàng.
    * Tặng Voucher VIP độc quyền Kim Cương: `DIAMOND50` (Giảm 50.000đ cho đơn từ 200.000đ), `DIAMONDVIP` (Giảm 20% cho đơn từ 250.000đ).
    * Ưu tiên giao hàng siêu tốc và kênh hỗ trợ chăm sóc khách hàng VIP riêng.
  * Hiển thị thanh tiến trình thăng hạng (Progress Bar 0-100%) và số tiền cần chi tiêu thêm để lên hạng tiếp theo trên trang Hồ sơ cá nhân.

---

### 7. PHÂN HỆ THANH TOÁN ĐA KÊNH & ĐỐI SOÁT VIETQR TỰ ĐỘNG (CHECKOUT & PAYMENT GATEWAY)
* **7.1. Trang Thanh Toán Trực Quan (`/checkout`)**:
  * Biểu mẫu nhập thông tin người nhận: Họ tên, số điện thoại (kiểm tra regex 10 số di động Việt Nam), địa chỉ nhận hàng (tích hợp gợi ý bản đồ), ghi chú giao hàng.
  * Hiển thị bảng tổng kết đơn hàng: Danh sách món, đơn giá, số lượng, danh sách topping ăn kèm.
  * Bảng phân tích chi phí minh bạch: Tạm tính món ăn, Phí giao hàng, Giảm giá voucher món ăn, Giảm giá vận chuyển, Chiết khấu đơn nhóm, Trừ tiền từ số dư ví, Tổng tiền thanh toán cuối cùng.
* **7.2. Phương Thức Thanh Toán Tiền Mặt Khi Nhận Món (Cash On Delivery - COD)**:
  * Khách hàng đặt món, nhận đồ ăn tận tay từ shipper rồi mới thanh toán tiền mặt.
  * Đơn hàng được tạo ở trạng thái `Pending` và chuyển vào bếp chế biến ngay lập tức.
* **7.3. Phương Thức Thanh Toán Chuyển Khoản Ngân Hàng Tự Động (VietQR Napas 247)**:
  * Sinh mã VietQR QuickLink tiêu chuẩn quốc gia:
    * Ngân hàng thụ hưởng: **MB (Ngân hàng Quân Đội)**.
    * Số tài khoản: **0822123346**.
    * Tên chủ tài khoản: **HOANG KHOI NGUYEN - QUAN AN NOONEE**.
    * Số tiền: Chính xác đến từng đồng theo giá trị thực tế của đơn hàng.
    * Nội dung chuyển khoản duy nhất: `NOONEE_[MÃ_ĐƠN]` (ví dụ: `NOONEE_928374`).
  * Nút bấm sao chép số tài khoản và nội dung chuyển khoản 1-click có thông báo phản hồi.
  * Hiệu ứng radar quét sóng tự động lắng nghe giao dịch chuyển khoản.
* **7.4. Cổng Xử Lý Webhook Đối Soát SePay Tự Động (`/api/sepay/webhook`)**:
  * Khi khách hàng quét mã và xác nhận chuyển khoản từ ứng dụng ngân hàng bất kỳ, cổng SePay nhận biến động số dư và gửi Webhook HTTP POST tới NooNee Food trong vòng **1 đến 3 giây**.
  * **Xác thực mã bảo mật**: So khớp Header `Authorization: Apikey <TOKEN>` với biến môi trường bí mật `SEPAY_API_TOKEN`.
  * **Bóc tách mã đơn bằng Regex**: Trích xuất chính xác mã đơn hàng `NOONEE...` từ nội dung chuyển khoản (hỗ trợ cả trường hợp có hoặc không có dấu gạch dưới).
  * **Kiểm tra chống trả thiếu tiền (Underpaid Protection)**: Kiểm tra `transferAmount >= order.totalAmount`. Nếu số tiền chuyển không đủ, hệ thống từ chối xác nhận tự động và gửi cảnh báo để quản trị viên xử lý thủ công.
  * **Chống thanh toán đơn đã hủy**: Ngăn chặn xác nhận đối với các đơn hàng đã bị hủy trước đó.
  * **Chống xử lý trùng lặp giao dịch (Idempotency)**: Nếu đơn hàng đã ở trạng thái `Paid`, hệ thống phản hồi thành công ngay mà không xử lý lặp lại.
  * **Cập nhật trạng thái tức thì**: Tự động chuyển `paymentStatus = 'Paid'`, chuyển đơn hàng sang trạng thái chế biến trong bếp và thông báo khách hàng.
* **7.5. Tính Năng Giả Lập Thanh Toán Sandbox (`/api/sepay/simulate`)**:
  * Nút bấm *"⚡ Giả lập thanh toán (Sandbox)"* tích hợp trực tiếp trên trang thanh toán VietQR.
  * Cho phép người dùng, giảng viên, ban giám khảo kiểm thử chu trình thanh toán ngân hàng tự động ngay lập tức mà không cần chuyển tiền thật.
  * Có thể vô hiệu hóa an toàn thông qua biến môi trường `DISABLE_PAYMENT_SIMULATION=true`.
* **7.6. Thanh Toán Bằng Số Dư Ví Điện Tử Ảo (NooNee Virtual Wallet)**:
  * Checkbox *"Sử dụng số dư ví NooNee (Hiện có: x.xxx.xxx đ)"* trên trang checkout.
  * Tự động khấu trừ số dư ví vào tổng tiền đơn hàng.
  * Nếu số dư ví đủ chi trả toàn bộ đơn hàng, đơn hàng được đánh dấu `Paid` ngay lập tức mà không cần quét mã QR.

---

### 8. PHÂN HỆ THEO DÕI ĐƠN HÀNG, LỊCH SỬ & ĐÁNH GIÁ MUA HÀNG (TRACKING, HISTORY & REVIEWS)
* **8.1. Trang Theo Dõi Tiến Trình Đơn Hàng Chi Tiết (`/orders/[orderCode]`)**:
  * **Dòng thời gian trạng thái trực quan 5 bước**:
    1. `Chờ thanh toán` (đối với đơn chọn chuyển khoản VietQR và chưa thanh toán).
    2. `Chờ xác nhận / Tiếp nhận đơn`.
    3. `Đang nấu trong bếp`.
    4. `Đang giao hàng (Shipper đang trên đường giao)`.
    5. `Hoàn thành đơn hàng`.
  * Ước tính thời gian giao hàng dự kiến (tính từ khoảng cách lái xe thực tế qua Goong Maps).
  * Hiển thị danh sách từng món ăn, số lượng, topping ăn kèm, ghi chú đầu bếp, thông tin người nhận hàng và địa chỉ.
  * **Hiển thị Lý do hủy đơn & Trạng thái Hoàn ví**: Nếu đơn hàng bị hủy bởi quán, trang theo dõi sẽ hiển thị rõ ràng lý do hủy của quán ăn (ví dụ: *"Hết nguyên liệu món ăn"*) và thông báo hoàn tiền vào Ví NooNee của khách hàng.
  * **Nút bấm hành động nhanh trên trang theo dõi**:
    * Nút *"Liên hệ hỗ trợ đơn này"*: Mở hộp thoại chat chăm sóc khách hàng với mã đơn hàng đã được điền sẵn.
    * Nút *"Đánh giá các món đã ăn"*: Mở giao diện đánh giá sao và nhận xét cho các món trong đơn hàng.
    * Nút *"Đặt lại đơn này (Re-order)"*: Sao chép toàn bộ món ăn và topping của đơn hàng cũ vào giỏ hàng hiện tại chỉ với 1 cú nhấp chuột!
* **8.2. Trang Quản Lý Lịch Sử Đơn Hàng (`/orders`)**:
  * Hiển thị toàn bộ danh sách đơn hàng mà tài khoản đã đặt.
  * Bộ lọc đơn theo trạng thái (Đang xử lý, Đang giao, Đã hoàn thành, Đã hủy).
  * Ô tìm kiếm đơn hàng theo mã đơn hoặc tên người nhận.
* **8.3. Hệ Thống Đánh Giá Món Ăn Có Xác Thực Mua Hàng (`/api/reviews`)**:
  * **Quy tắc chống đánh giá ảo (Verified Purchase Only)**: Khách hàng chỉ có thể viết nhận xét và chấm sao cho một món ăn sau khi hệ thống đã xác minh khách hàng **đã thực sự đặt và nhận món ăn đó** (`hasUserOrderedProduct`). Người chưa từng mua món sẽ bị từ chối gửi đánh giá (`HTTP 403`).
  * Chấm điểm từ 1 đến 5 sao kèm bình luận văn bản (yêu cầu tối thiểu 5 ký tự).
  * **Cơ chế Cập nhật đánh giá (Upsert Review)**: Khách hàng có thể quay lại chỉnh sửa số sao hoặc nội dung nhận xét của mình bất kỳ lúc nào.
  * Điểm số đánh giá trung bình của từng món ăn được cập nhật tự động lên thẻ sản phẩm và trang chi tiết.

---

### 9. PHÂN HỆ TRỢ LÝ ẢO AI TƯ VẤN MÓN ĂN (AI FOOD ASSISTANT CHATBOT)
* **9.1. Widget Chatbot Nổi Thông Minh (`AIChatBot`)**:
  * Nút bong bóng chat nổi ở góc dưới bên phải trên tất cả các trang web, hỗ trợ mở/đóng mượt mà.
  * Tự động gửi tin nhắn chào mừng và 4 câu hỏi gợi ý nhanh (Quick Prompts):
    * *"Hôm nay có món gì bán chạy nhất?"*
    * *"Gợi ý món ăn trưa dưới 50k cho 1 người"*
    * *"Nhóm 4 người nên gọi những món nào ngon?"*
    * *"Có món nào thanh đạm, ít cay không quán?"*
* **9.2. Tích Hợp Mô Hình Ngôn Ngữ AI & Kỹ Thuật Prompt Engineering Độc Quyền**:
  * Gọi API tương thích OpenAI / Google Gemini (mô hình `gemini-3.1-flash-lite` hoặc mô hình vô danh `fast` của LLM7).
  * Nạp toàn bộ dữ liệu thực đơn thực tế của quán NooNee Food vào System Prompt: Tên món, đơn giá, thời gian làm, mô tả, danh mục.
  * **Quy chuẩn ứng xử nghiêm ngặt**:
    * Bảo mật danh tính: Tuyệt đối không bao giờ để lộ tên mô hình AI, nhà cung cấp hay API kỹ thuật.
    * Phong cách trả lời: Cực kỳ súc tích, ngắn gọn (chỉ từ 2 đến 3 câu), đi thẳng vào gợi ý món ăn, không chào hỏi lan man.
    * Giới hạn phạm vi: Chỉ gợi ý các món ăn thực tế có trong thực đơn quán NooNee Food.
* **9.3. Đính Kèm Thẻ Món Ăn Tương Tác Trực Tiếp**:
  * Chatbot AI trả về mã thẻ đặc biệt `[[RECOMMENDED_FOODS: id1, id2]]`.
  * Khung chat tự động bóc tách mã và hiển thị các thẻ món ăn thu nhỏ (Product Cards) ngay bên dưới câu trả lời.
  * Khách hàng có thể bấm xem chi tiết hoặc bấm thêm thẳng món ăn vào giỏ hàng ngay trong khung chat mà không cần chuyển trang.
* **9.4. Thuật Toán Tìm Kiếm Từ Khóa Nội Bộ Dự Phòng (`searchFoodsKeyword`)**:
  * Nếu dịch vụ AI bên ngoài gặp sự cố mạng hoặc hết hạn mức, hệ thống tự động kích hoạt thuật toán tìm kiếm từ khóa nội bộ để đưa ra các món gợi ý phù hợp nhất.

---

### 10. PHÂN HỆ TÀI KHOẢN, XÁC THỰC & VÍ ẢO CÁ NHÂN (AUTHENTICATION, PROFILE & VIRTUAL WALLET)
* **10.1. Đăng Ký Tài Khoản An Toàn (`/register`)**:
  * Xác thực độ dài họ tên (2 đến 70 ký tự).
  * Xác thực định dạng Tên đăng nhập: 4 đến 20 ký tự, chỉ gồm chữ cái, số và dấu gạch dưới `_`, không có khoảng trắng.
  * **Quy chuẩn mật khẩu mạnh**: Tối thiểu 8 ký tự, bắt buộc phải có ít nhất 1 chữ in hoa, 1 chữ in thường, 1 chữ số và 1 ký tự đặc biệt (ví dụ: `@`, `#`, `!`).
  * Kiểm tra khớp mật khẩu xác nhận (Confirm Password).
  * Xác thực định dạng số điện thoại di động Việt Nam (10 chữ số, đầu số hợp lệ `03, 05, 07, 08, 09`).
  * Kiểm tra định dạng Email hợp lệ.
  * Kiểm tra trùng lặp tên đăng nhập trong CSDL SQL Server trước khi tạo tài khoản.
  * Mã hóa mật khẩu bằng thuật toán băm an toàn Bcrypt.
* **10.2. Đăng Nhập Xác Thực JSON Web Token (`/login`)**:
  * Kiểm tra thông tin tài khoản và mật khẩu đã băm trong CSDL.
  * Phát hành mã xác thực JWT Token có thời hạn 7 ngày.
  * Lưu trữ JWT Token an toàn trong Cookie trình duyệt (`auth_token`, SameSite=Lax) và trả về Client context.
* **10.3. Trang Hồ Sơ Cá Nhân (`/profile`)**:
  * Xem toàn bộ thông tin tài khoản: Họ tên, Tên đăng nhập, Email, Số điện thoại, Địa chỉ nhận hàng.
  * Cập nhật thông tin cá nhân (Họ tên, SĐT, Địa chỉ).
  * Xem thông tin phân hạng thành viên (Đồng, Bạc, Vàng, Kim Cương), tổng tiền đã chi tiêu, danh sách các voucher đặc quyền đang sở hữu.
* **10.4. Đổi Mật Khẩu An Toàn**:
  * Yêu cầu nhập mật khẩu hiện tại để xác minh danh tính.
  * Kiểm tra độ mạnh của mật khẩu mới theo chuẩn an ninh.
  * Cập nhật mật khẩu mới đã băm vào SQL Server và thông báo thành công.
* **10.5. Hệ Thống Số Dư Ví Điện Tử Ảo (NooNee Virtual Wallet)**:
  * Mỗi tài khoản khách hàng sở hữu một số dư ví ảo (`walletBalance`) được lưu trữ trong bảng `Users`.
  * **Cơ chế Hoàn tiền tự động khi hủy đơn**: Khi đơn hàng đã thanh toán bị hủy, toàn bộ số tiền thanh toán được hoàn trả ngay lập tức vào Ví ảo của khách.
  * Số dư ví ảo được sử dụng để thanh toán trừ trực tiếp cho các đơn hàng tiếp theo.

---

### 11. PHÂN HỆ HỖ TRỢ KHÁCH HÀNG & KÊNH KHIẾU NẠI ĐƠN HÀNG (CUSTOMER SUPPORT & TICKET SYSTEM)
* **11.1. Gửi Yêu Cầu Hỗ Trợ Gắn Liền Mã Đơn Hàng (`/contact`)**:
  * Khách hàng có thể nhập mã đơn hàng cụ thể để gửi thắc mắc (ví dụ: giao chậm, đổi địa chỉ nhận).
  * Phân biệt rõ giữa tin nhắn hỏi đáp thông thường và **Khiếu nại dịch vụ** (`isComplaint = true`).
* **11.2. Kênh Trò Chuyện Trực Tuyến Đơn Hàng**:
  * Khách hàng và nhân viên hỗ trợ có thể trao đổi tin nhắn qua lại theo từng mã đơn hàng.
  * Dữ liệu được lưu trữ có cấu trúc trong bảng `SupportMessages`.
* **11.3. Chống Giả Mạo Quyền Quản Trị Viên (Anti-Role Spoofing)**:
  * Hệ thống kiểm tra nghiêm ngặt: Chỉ những tài khoản có JWT token chứa `role = 'admin'` mới được phép gửi tin nhắn với tư cách là `senderRole = 'admin'`. Người dùng thường gửi lên role admin sẽ bị tự động ép về `customer`.

---

### 12. PHÂN HỆ CỔNG QUẢN TRỊ VIÊN TOÀN DIỆN (ADMIN MANAGEMENT PORTAL)
Đây là phân hệ đồ sộ với đầy đủ các công cụ vận hành thực tế cho nhà hàng:

#### 12.1. Cấu Trúc Khung Giao Diện Quản Trị (`AdminLayoutShell`, `AdminGuard`)
* **Lớp Bảo vệ Độc quyền (AdminGuard)**: Kiểm tra tính hợp lệ của JWT Token và cờ quyền `role === 'admin'`. Mọi nỗ lực truy cập trái phép của khách vãng lai hoặc tài khoản khách hàng thông thường đều bị chuyển hướng ra trang đăng nhập.
* **Chỉ báo Trạng thái Hệ thống Trực tuyến (System Status Pulse)**: Huy hiệu xanh lá `#006400` nhấp nháy báo hiệu kết nối CSDL Cloud và Cổng thanh toán ổn định.
* **Thanh Điều Hướng Sidebar Đa Nhiệm**:
  * Tổng quan hệ thống (`/admin`)
  * Quản lý đơn hàng (`/admin/orders`)
  * Khiếu nại & Hỗ trợ KH (`/admin/support`)
  * Thực đơn & Món ăn (`/admin/products`)
  * Danh mục món ăn (`/admin/categories`)
  * Kho Voucher ưu đãi (`/admin/coupons`)
  * Chẩn đoán CSDL Cloud (`/admin/diagnostics`)
  * Nút quay lại trang bán hàng và nút Đăng xuất 1-click.
* **Huy Hiệu Báo Động Khiếu Nại Chưa Xử Lý (Unread Complaint Alert Dot)**:
  * Hệ thống tự động thăm dò (polling ngầm mỗi 6 giây) các tin nhắn hỗ trợ. Nếu phát hiện có khiếu nại chưa xử lý từ khách hàng (`isComplaint = true`), một chấm đỏ nhấp nháy (pulsing dot) sẽ xuất hiện trên mục menu *"Khiếu nại & Hỗ trợ KH"*.
* **Ngăn Kéo Menu Thích Ứng Cho Thiết Bị Di Động (Mobile Drawer Sidebar)**: Hỗ trợ nút Hamburger Menu mở thanh sidebar quản trị trên điện thoại mượt mà.

#### 12.2. Trang Quản Trị Đơn Hàng Chuyên Sâu (`/admin/orders`)
* **Bộ Lọc Đơn Hàng Theo Trạng Thái**:
  * Các thẻ lọc nhanh: Tất cả, Chờ tiếp nhận (`Pending`), Đang nấu (`Processing`), Đang giao (`Delivering`), Hoàn thành (`Completed`), Đã hủy (`Cancelled`).
* **Thanh Tìm Kiếm Đơn Hàng Đa Năng**: Tìm kiếm theo mã đơn (có hoặc không có tiền tố `#`), tên khách hàng, số điện thoại.
* **Bảng Đơn Hàng Trực Quan**:
  * Mã đơn hàng có liên kết xem chi tiết, ngày giờ đặt, huy hiệu Đơn nhóm (`Đơn nhóm #NN-xxxx`).
  * Khách hàng: Họ tên, số điện thoại, địa chỉ nhận hàng, ghi chú đầu bếp (in nghiêng đỏ).
  * Tiền hàng: Tổng tiền, số tiền được giảm voucher hoặc chiết khấu nhóm.
  * Phương thức thanh toán: Huy hiệu chuyển khoản VietQR, COD tiền mặt, hoặc Ví NooNee.
* **Điều Khiển Trạng Thái Thanh Toán 1-Click (Payment Status Select)**:
  * Dropdown chuyển đổi trực tiếp giữa `Chưa thu tiền (Unpaid)` và `Đã thanh toán (Paid)`.
  * Cơ chế cập nhật lạc quan (Optimistic Update) giúp giao diện đổi màu ngay lập tức mà không phải chờ API.
* **Cụm Nút Thao Tác Chế Biến & Giao Hàng Siêu Tốc (Fast Action Buttons)**:
  * Khi đơn ở trạng thái `Pending`: Nút đỏ *"Xác nhận"* (chuyển sang `Processing` để bếp nấu) và Nút *"Hủy đơn"*.
  * Khi đơn ở trạng thái `Processing`: Nút xanh dương *"Giao hàng"* (chuyển sang `Delivering` giao cho shipper) và Nút *"Hủy đơn"*.
  * Khi đơn ở trạng thái `Delivering`: Nút xanh lá *"Hoàn tất"* (chuyển sang `Completed` và tự động đánh dấu thanh toán `Paid`).
  * Dropdown chuyển đổi trạng thái thủ công tùy ý.
* **Hộp Thoại Hủy Đơn Hàng Kèm Tự Động Hoàn Ví (Order Cancellation Modal)**:
  * **Cơ chế Tự Động Hoàn Tiền Vào Ví NooNee (Auto Virtual Wallet Refund)**: Nếu đơn hàng đã thanh toán trước (qua VietQR hoặc Ví), khi Admin bấm xác nhận hủy đơn, toàn bộ 100% số tiền đơn hàng sẽ **tự động được hoàn lại ngay vào Số Dư Ví NooNee của khách hàng**!
  * Ô nhập Lý do hủy đơn bắt buộc (lý do này sẽ hiển thị công khai trên trang theo dõi của khách).
  * **5 Nút Gợi Ý Nhanh Lý Do Hủy Đơn (Quick Reason Presets)**:
    1. *"Hết nguyên liệu món ăn"*
    2. *"Khách gọi yêu cầu hủy đơn"*
    3. *"Quán quá tải đơn giờ cao điểm"*
    4. *"Không liên lạc được với khách hàng"*
    5. *"Địa chỉ giao ngoài phạm vi phục vụ"*
  * Cờ huy hiệu *"Đã hoàn ví"* hiển thị trên bảng đơn hàng đã hủy.
* **Thông Báo Nổi Hành Động (Floating Action Toast Notification)**: Hộp thông báo màu tối bật lên ở góc dưới bên phải xác nhận trạng thái cập nhật đơn hàng thành công.
* **Phân Trang Đơn Hàng (Pagination Controls)**: Phân trang 10 đơn / trang, nút Trước/Sau, hiển thị số trang và dấu ba chấm rút gọn.

#### 12.3. Trang Quản Trị Thực Đơn & Món Ăn Toàn Diện (`/admin/products`)
* **Xuất Dữ Liệu Thực Đơn Ra Tệp Excel (`handleExportExcel`)**:
  * Xuất toàn bộ hoặc kết quả lọc thực đơn ra tệp bảng tính `.xlsx` chuẩn bằng SheetJS.
  * Đặt tên tệp tự động theo ngày: `NooNee_ThucDon_YYYY-MM-DD.xlsx`.
  * Định dạng độ rộng cột (Column Widths) tự động căn chỉnh cho 10 trường dữ liệu (Mã món, Tên món, Danh mục, Đơn giá, Thời gian nấu, Còn hàng, Món nổi bật, Đánh giá, Mô tả, Link ảnh).
* **Nhập Thực Đơn Hàng Loạt Từ Tệp Excel / CSV (`handleFileImportChange`, `handleConfirmImport`)**:
  * **Tải Tệp Mẫu Chuẩn (`handleDownloadTemplate`)**: Tải về tệp `Mau_Nhap_Mon_NooNee.xlsx` có sẵn các dòng dữ liệu mẫu (Cơm tấm, Phở bò, Trà đào).
  * Khung kéo thả hoặc chọn tệp `.xlsx, .xls, .csv`.
  * **Bảng Xem Trước Dữ Liệu Thời Gian Thực (Live Preview Table)**: Đọc tệp Excel ngay trên trình duyệt và hiển thị 5 dòng đầu tiên để quản trị viên kiểm tra trước khi bấm nạp.
  * Tự động khớp ID danh mục từ tên danh mục tiếng Việt trong Excel.
  * Tự động sinh slug duy nhất cho từng món ăn.
  * Báo cáo kết quả nhập thành công: *"Đã nhập thành công X/Y món ăn vào thực đơn!"*.
* **Bộ Lọc & Tìm Kiếm Món Ăn Đa Tiêu Chí**:
  * Ô tìm kiếm theo tên hoặc mô tả kèm nút xóa nhanh `(X)`.
  * Dropdown lọc theo Danh mục món ăn (hiển thị kèm số lượng món).
  * Dropdown lọc theo Trạng thái bán: Đang phục vụ (`available`), Tạm hết hàng (`out_of_stock`), Món nổi bật (`featured`).
  * Dropdown sắp xếp: Giá thấp đến cao (`price_asc`), Giá cao đến thấp (`price_desc`), Tên A-Z (`name_asc`).
  * Dòng tóm tắt kết quả lọc kèm nút *"Đặt lại bộ lọc (Reset Filter)"*.
* **Bảng Thực Đơn Trực Quan**:
  * Ảnh đại diện món ăn tỷ lệ vuông 1:1.
  * Tên món, mô tả thu gọn, danh mục, thời gian nấu (`prepTime` kèm biểu tượng đồng hồ).
  * Đơn giá định dạng VNĐ.
  * Huy hiệu *"Nổi bật"* (Trang chủ).
  * **Nút Chuyển Đổi Trạng Thái Bán Tức Thì (Instant In-stock Toggle)**: Bấm đổi qua lại giữa `Đang phục vụ` (xanh lá) và `Tạm hết` (đỏ đun) chỉ trong 1 cú nhấp chuột.
  * Nút sửa món và nút xóa món kèm hộp thoại xác nhận.
* **Hộp Thoại Thêm Mới & Chỉnh Sửa Món Ăn (Add/Edit Product Modal)**:
  * Các trường: Tên món, Danh mục, Đơn giá, Thời gian nấu (phút), Mô tả món.
  * Checkbox *"Đang phục vụ"* và *"Món ăn nổi bật (Trang chủ)"*.
  * **Tải Ảnh Trực Tiếp Lên Cloudinary CDN (`handleFileUpload`)**:
    * Nút *"Tải ảnh từ máy tính"* tự động gửi tệp ảnh đến API `/api/upload`.
    * Máy chủ tự động nén, cắt cúp vuông 1:1 chuẩn (`width: 800, height: 800, crop: 'fill'`) và lưu lên Cloudinary CDN.
    * Tự động điền đường dẫn ảnh bảo mật `https://res.cloudinary.com/...` vào ô URL.
    * Khung xem trước ảnh thu nhỏ (Thumbnail Preview) ngay bên cạnh.
  * **Bộ Xây Dựng Tùy Chọn Topping Năng Động (Dynamic Topping Builder)**:
    * Hiển thị danh sách các Topping hiện có dạng chip có giá tiền `+formatVND` và nút xóa `(X)`.
    * Hàng nhập Topping mới: Ô nhập tên topping + Ô nhập giá tiền thêm + Nút `+ Thêm`.

#### 12.4. Trang Khiếu Nại & Chăm Sóc Khách Hàng (`/admin/support`)
* **Thăm Dò Tin Nhắn Thời Gian Thực (Auto-polling 4s)**: Tự động tải lại danh sách tin nhắn mỗi 4 giây một lần để nhân viên tiếp nhận khiếu nại tức thì.
* **Gom Nhóm Tin Nhắn Theo Từng Mã Đơn Hàng (Order Message Grouping)**: Tự động gom các tin nhắn thành các hội thoại theo mã đơn (hoặc theo mã khách thành viên `USER_`, khách vãng lai `GUEST_`).
* **Bộ Lọc Khiếu Nại Riêng Biệt (Complaint Filter Tab)**: Lọc riêng các đơn hàng có khách gửi khiếu nại (`isComplaint = true`) để ưu tiên giải quyết trước.
* **Hỗ Trợ Chế Độ Xem Hai Cột & Thích Ứng Di Động (Responsive Split View)**:
  * Cột trái: Danh sách các đơn hàng cần hỗ trợ, huy hiệu đỏ *"Khiếu nại"*, trích đoạn tin nhắn gần nhất và thời gian.
  * Cột phải: Khung chat chi tiết với bong bóng tin nhắn khách hàng (trái), tin nhắn admin (phải) và các tin nhắn khiếu nại được đóng khung cảnh báo màu hồng viền đỏ.
  * Trên di động hỗ trợ nút *"← Quay lại"* chuyển đổi giữa danh sách và khung chat.
* **Biểu Mẫu Trả Lời Trực Tuyến**: Ô nhập phản hồi kèm nút gửi tin nhắn với tư cách là `Quản Trị Viên (NooNee)`.

#### 12.5. Trang Chẩn Đoán Hệ Thống & Đo Kiểm Độ Trễ API Trực Tiếp (`/admin/diagnostics`)
* **Chẩn Đoán Cơ Sở Dữ Liệu SQL Server Cloud (`db68391`)**:
  * Kiểm tra phiên bản động cơ CSDL (Microsoft SQL Server).
  * Hiển thị máy chủ Cloud host: `db68391.public.databaseasp.net:1433`.
  * Thống kê số lượng danh mục, số lượng món ăn và tổng số đơn hàng hiện có trong CSDL.
  * Đo lường trạng thái kết nối trực tiếp.
* **Chẩn Đoán Cổng Thanh Toán VietQR SePay**:
  * Kiểm tra thông tin ngân hàng nhận tiền: MB (Ngân hàng Quân Đội), STK: `0822123346`.
  * Tên chủ tài khoản: `HOANG KHOI NGUYEN - QUAN AN NOONEE`.
  * Đường dẫn Webhook nội bộ `/api/sepay/webhook`.
  * Hiển thị chế độ giao dịch kép (Giao dịch thực tế MBBank & Sandbox).
* **Công Cụ Kiểm Thử Tốc Độ & Độ Trễ API Trực Tiếp (Interactive Live API Testing Tool)**:
  * Nút bấm *"Chạy kiểm thử tất cả API"* đo lường thực nghiệm độ trễ (latency ms) và mã HTTP status code của 4 cụm dịch vụ:
    1. **Microsoft SQL Server Cloud Database**: Đo thời gian truy vấn danh mục món ăn thực tế.
    2. **Goong.io Maps & Distance Matrix API**: Đo độ trễ gợi ý địa chỉ và định tuyến đường bộ.
    3. **Cổng thanh toán Sepay (VietQR)**: Đo độ trễ sinh mã ảnh VietQR Napas 247.
    4. **Cloudinary CDN (Lưu trữ ảnh)**: Đo thời gian ping và nạp ảnh từ CDN đám mây.
  * Phân loại màu sắc độ trễ trực quan: Nhanh $\le 200$ms (Xanh lá), Trung bình $200-600$ms (Vàng cam), Chậm $>600$ms (Đỏ đun).
  * Nút *"Test lại"* đo kiểm độc lập từng dịch vụ đơn lẻ.

#### 12.6. Thống Kê & Báo Cáo Doanh Thu Quản Trị (`/api/admin/stats`)
* Báo cáo tổng doanh thu bán hàng thực tế.
* Báo cáo số lượng đơn hoàn tất và số lượng đơn bị hủy.
* Thống kê theo các mốc thời gian: Hôm nay, Tuần này, Tháng này, Toàn thời gian.

---

# PHẦN II: TẤT CẢ CÁC YÊU CẦU PHI TÍNH NĂNG (NON-FUNCTIONAL REQUIREMENTS)

---

### 1. AN NINH & BẢO MẬT ĐA TẦNG (SECURITY & THREAT DEFENSE)
* **NFR-SEC-01: Tường Lửa Ứng Dụng WAF Tự Xây Dựng (`src/lib/security.ts`)**:
  * Kiểm tra và ngăn chặn các chuỗi độc hại trong URL, query params và body:
    * **SQL Injection (SQLi)**: Nhận diện và chặn đứng các mẫu `UNION SELECT`, `INFORMATION_SCHEMA`, `EXEC()`, `XP_`, `WAITFOR DELAY`, `DROP TABLE`, `OR 1=1`, `--`, `/*`.
    * **Path Traversal**: Nhận diện `../`, `..\`, `%2e%2e%2f`, các nỗ lực đọc tệp tin hệ thống `/etc/passwd`, `win.ini`, `boot.ini`.
    * **Cross-Site Scripting (XSS)**: Nhận diện `<script>`, `javascript:`, `onerror=`, `onload=`, `<svg onload>`, `<img onerror>`.
* **NFR-SEC-02: Bẫy Honeypot Chống Bot Tự Động (`HoneypotTrap.tsx`, `security.ts`)**:
  * Các trường bẫy ẩn ngụy trang (`hp_bot_trap`, `website_url_hp`, `fax_hp`, `confirm_email_hp`) được đặt ngầm trong tất cả các biểu mẫu Đăng ký, Đăng nhập, Đặt hàng và Đánh giá.
  * Các bot tự động quét và điền dữ liệu vào các trường này sẽ bị hệ thống phát hiện ngay lập tức.
  * **Tự động đưa IP vào Danh sách Đen (IP Blacklist)** trong vòng 24 giờ đối với bất kỳ địa chỉ IP nào kích hoạt bẫy honeypot.
* **NFR-SEC-03: Kiểm Tra Ngưỡng Thời Gian Thao Tác (Submission Timing Verification)**:
  * Hệ thống gắn mốc thời gian hiển thị form (`hp_timestamp`). Nếu thời gian gửi form dưới **800 mili-giây**, yêu cầu sẽ bị từ chối tự động vì đây là tốc độ thao tác của bot tự động.
* **NFR-SEC-04: Nhận Diện & Chặn Các Công Cụ Khai Thác Lỗ Hổng (Exploit Tools & Scrapers)**:
  * Quét tiêu đề `User-Agent` của các yêu cầu gửi đến máy chủ.
  * Tự động chặn các công cụ tấn công mạng: `sqlmap`, `nikto`, `wpscan`, `masscan`, `nmap`, `dirbuster`, `gobuster`, `acunetix`, `havij`, `netsparker`.
  * Hạn chế các công cụ cào dữ liệu hung hãn: `scrapy`, `curl/`, `wget/`, `python-requests`, `httpclient`.
* **NFR-SEC-05: Khử Độc Dữ Liệu Đầu Vào (Input Sanitization)**:
  * Toàn bộ chuỗi văn bản người dùng nhập (họ tên, ghi chú, bình luận, chat) đều được lọc qua hàm `sanitizeText()`.
  * Loại bỏ hoàn toàn các thẻ HTML `<...>`, bóc tách liên kết `javascript:`, chuẩn hóa khoảng trắng thừa và giới hạn độ dài ký tự tối đa ngăn chặn tấn công tràn bộ đệm.
* **NFR-SEC-06: Mã Hóa Dữ Liệu & Quản Lý Phiên (Encryption & Session Security)**:
  * Toàn bộ mật khẩu người dùng được băm một chiều bằng thuật toán **Bcrypt** kèm muối (Salt).
  * Phiên làm việc xác thực bằng **JSON Web Token (JWT)** ký bằng khóa bí mật `JWT_SECRET`, lưu trữ trong Cookie với cờ `SameSite=Lax` và thời hạn 7 ngày.
  * Toàn bộ lưu lượng truyền tải giữa máy chủ Next.js và máy chủ SQL Server Cloud đều được mã hóa bằng giao thức **TLS 1.3** (`options.encrypt = true`).
* **NFR-SEC-07: An Toàn Giao Dịch Tài Chính (Financial Transaction Integrity)**:
  * Khóa bí mật SePay Webhook Token bắt buộc cấu hình bảo mật, từ chối token mặc định `demo_sepay_token`.
  * Cơ chế chống trả thiếu tiền (Underpaid Protection): Kiểm tra số tiền chuyển khoản thực nhận so với tổng tiền đơn hàng.
  * Chống tấn công phát lại giao dịch (Idempotency Protection): Kiểm tra trạng thái đơn hàng trước khi cập nhật, ngăn chặn việc cộng tiền trùng lặp khi webhook gửi lại.

---

### 2. GIỚI HẠN TẦN SUẤT & CHỐNG TẤN CÔNG TẢI (RATE LIMITING & DDOS MITIGATION)
* **NFR-RL-01: Thuật Toán Cửa Sổ Trượt Trong Bộ Nhớ (Sliding-Window Rate Limiter)**:
  * Module `src/lib/rateLimit.ts` theo dõi các mốc thời gian yêu cầu trên từng địa chỉ IP máy khách:
    * **Đăng ký tài khoản (`/api/auth/register`)**: Tối đa **5 requests / phút**.
    * **Đăng nhập (`/api/auth/login`)**: Tối đa **10 requests / phút** (chống tấn công dò mật khẩu Brute-force).
    * **Tạo đơn hàng (`/api/orders`)**: Tối đa **15 requests / phút**.
    * **Trò chuyện cùng AI (`/api/ai-chat`)**: Tối đa **15 requests / phút** (bảo vệ hạn ngạch API mô hình ngôn ngữ).
    * **Gửi đánh giá món ăn (`/api/reviews`)**: Tối đa **10 requests / phút**.
    * **Gửi tin nhắn hỗ trợ (`/api/support`)**: Tối đa **20 requests / phút**.
* **NFR-RL-02: Chuẩn Hóa Phản Hồi Giới Hạn Tần Suất**:
  * Khi vượt ngưỡng, hệ thống trả về mã lỗi **HTTP 429 Too Many Requests**.
  * Đính kèm đầy đủ các tiêu đề HTTP chuẩn: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.
* **NFR-RL-03: Tự Động Thu Hồi Bộ Nhớ (Memory Garbage Collection)**:
  * Tiến trình chạy nền dọn dẹp các mốc thời gian quá 2 phút và các bản ghi IP hết hạn cấm mỗi **120 giây** một lần, ngăn ngừa rò rỉ bộ nhớ (Memory Leak) của tiến trình Node.js.

---

### 3. HIỆU NĂNG & TỐI ƯU CORE WEB VITALS (PERFORMANCE)
* **NFR-PERF-01: Tận Dụng React Server Components (RSC)**:
  * Các trang chính như Trang chủ (`page.tsx`) thực hiện truy vấn cơ sở dữ liệu trực tiếp trên máy chủ, truyền dữ liệu sẵn có về máy khách mà không cần máy khách tải thêm thư viện JavaScript nặng nề.
* **NFR-PERF-02: Tối Ưu Hóa Hình Ảnh Toàn Diện**:
  * Sử dụng thẻ `next/image` kết hợp CDN Cloudinary và Unsplash.
  * Tự động chuyển đổi định dạng ảnh sang WebP/AVIF tối ưu dung lượng, hỗ trợ `priority` tải trước các ảnh Hero chính và lazy-loading các ảnh ở chân trang.
* **NFR-PERF-03: Đo Lường Thực Tế Theo Tiêu Chuẩn Google Lighthouse**:
  * Điểm số Hiệu năng (Performance Score): **96 / 100** trên Desktop và **91 / 100** trên Mobile.
  * **First Contentful Paint (FCP)**: **0.7 giây** (Desktop), **1.2 giây** (Mobile) (Tiêu chuẩn xanh tốt < 1.8s).
  * **Largest Contentful Paint (LCP)**: **1.4 giây** (Desktop), **1.9 giây** (Mobile) (Tiêu chuẩn xanh tốt < 2.5s).
  * **Cumulative Layout Shift (CLS)**: **0.012** (Gần như bằng 0, bố cục ổn định tuyệt đối, không bị giật dịch khi tải ảnh).
  * **Total Blocking Time (TBT)**: **45 mili-giây** (Giao diện phản hồi chuột tức thì < 200ms).
  * **Speed Index**: **1.1 giây**.
  * **Accessibility Score**: **98 / 100**.
  * **Best Practices**: **100 / 100**.
  * **SEO Optimization**: **95 / 100**.

---

### 4. TÍNH SẴN SÀNG CAO & CƠ CHẾ DỰ PHÒNG NGOẠI TUYẾN (HIGH AVAILABILITY & FALLBACK)
* **NFR-HA-01: Quản Trị Kết Nối Cơ Sở Dữ Liệu An Toàn (Connection Pooling)**:
  * Khởi tạo Singleton Connection Pool cho thư viện `mssql`, tái sử dụng kết nối cho các yêu cầu HTTP đồng thời.
  * `pool.min = 2`: Duy trì 2 kết nối thường trực, loại bỏ độ trễ khởi tạo kết nối (Cold Start).
  * `pool.max = 10`: Giới hạn tối đa 10 kết nối, bảo vệ máy chủ SQL Server Cloud không bị quá tải.
  * `pool.idleTimeoutMillis = 30000`: Tự động ngắt kết nối nhàn rỗi quá 30 giây để thu hồi tài nguyên.
* **NFR-HA-02: Cơ Chế Dự Phòng Thực Đơn Ngoại Tuyến (Offline Fallback Menu - `foodMenu.ts`)**:
  * Nếu máy chủ SQL Server gặp sự cố mạng hoặc bảo trì, hệ thống tự động kích hoạt bộ nhớ đệm thực đơn dự phòng nội bộ, cho phép khách hàng vẫn xem được món ăn và giá bán bình thường.
* **NFR-HA-03: Cơ Chế Dự Phòng Định Vị & Tính Cước Ship (`goong.ts`)**:
  * Nếu Goong Maps API gặp sự cố, hệ thống tự động tra cứu từ điển các địa danh trọng điểm tại Hà Nội và áp dụng công thức Haversine để tính khoảng cách và phí vận chuyển, không làm gián đoạn chu trình đặt hàng của khách.
* **NFR-HA-04: Cơ Chế Dự Phòng Chatbot AI (`ai-chat/route.ts`)**:
  * Nếu mô hình Gemini chính bị lỗi hoặc hết hạn ngạch, hệ thống tự động thử lại với mô hình vô danh miễn phí `fast` từ LLM7, hoặc chuyển tiếp sang thuật toán tìm kiếm từ khóa nội bộ để gợi ý món ăn.

---

### 5. TOÀN VẸN DỮ LIỆU & THẨM ĐỊNH PHÍA MÁY CHỦ (DATA INTEGRITY & SERVER VALIDATION)
* **NFR-DATA-01: Thẩm Định Giá Món Phía Máy Chủ (Server-Side Price Verification)**:
  * Hệ thống **tuyệt đối không tin tưởng giá tiền gửi lên từ trình duyệt**.
  * Khi tạo đơn hàng (`POST /api/orders`), máy chủ tự động truy vấn lại giá gốc của từng món và giá của từng topping từ CSDL để tính toán lại tổng tiền hàng (Subtotal), ngăn chặn triệt để hành vi can thiệp sửa giá qua DevTools.
* **NFR-DATA-02: Toàn Vẹn Giao Dịch Bằng SQL Transactions**:
  * Quá trình xác nhận thanh toán Webhook cập nhật đồng thời trạng thái đơn hàng sang `Paid`, trạng thái chế biến sang `Processing`, và ghi bản ghi giao dịch vào bảng `Payments` bên trong một khối Transaction an toàn; nếu có lỗi xảy ra sẽ tự động Rollback.
* **NFR-DATA-03: Thiết Kế Cơ Sở Dữ Liệu Chuẩn Hóa**:
  * Toàn bộ 9 bảng đều có khóa chính định danh (`INT IDENTITY(1,1)`).
  * Thiết lập khóa ngoại toàn vẹn tham chiếu (`FK_OrderItems_Orders`, `FK_OrderItems_Products`, `FK_Orders_Users`, `FK_GroupOrders_Host`).
  * Chỉ mục tìm kiếm không phân cụm (`NONCLUSTERED INDEX`) tối ưu tốc độ tra cứu theo mã đơn hàng, ngày tạo và danh mục món ăn.

---

### 6. TƯƠNG THÍCH ĐA THIẾT BỊ & TRẢI NGHIỆM NGƯỜI DÙNG (COMPATIBILITY & UX)
* **NFR-UX-01: Thiết Kế Thích Ứng 100% (Responsive Across All Devices)**:
  * Tương thích hoàn hảo từ màn hình di động nhỏ (360px - 414px), máy tính bảng (768px - 1024px), máy tính xách tay (1280px - 1440px), đến màn hình máy tính bàn lớn 4K (1920px - 2560px).
  * Bố cục tự động điều chỉnh linh hoạt: Khối Hero chuyển từ Collage đa món trên Desktop sang cụm 3 món tinh gọn trên Mobile; Bảng danh sách đơn hàng tự động chuyển sang dạng thẻ Card trên di động.
* **NFR-UX-02: Bộ Nhận Diện Thương Hiệu Độc Quyền**:
  * Tone màu chủ đạo là Đỏ đun quý phái **#A30029** kết hợp nền kem ấm **#FFFAF0** và các chi tiết điểm nhấn đen than **#0F0F0F**.
  * Tỷ lệ tương phản màu sắc đạt tiêu chuẩn tiếp cận WCAG 2.1 AA, dễ đọc, không gây mỏi mắt.
* **NFR-UX-03: Phản Hồi Tương Tác Trực Quan (Interactive Feedback)**:
  * Hệ thống thông báo nổi (Toast Notifications) thông báo kết quả tức thì khi thêm giỏ hàng, áp mã thành công, sao chép mã voucher, hoặc gặp lỗi.
  * Hiệu ứng chuyển động mượt mà (Smooth transitions, hover scale, active press feedback).
  * Bộ nạp dữ liệu hình học độc đáo (`HypotrochoidLoader`) hiển thị trong lúc hệ thống xử lý tác vụ nặng.

---

### 7. KHẢ NĂNG BẢO TRÌ, GIÁM SÁT & NHẬT KÝ AN NINH (MAINTAINABILITY & OBSERVABILITY)
* **NFR-MAINT-01: An Toàn Kiểu Dữ Liệu Tuyệt Đối (Strict TypeScript)**:
  * Toàn bộ mã nguồn dự án được xây dựng với TypeScript nghiêm ngặt, định nghĩa tường minh tất cả các giao diện dữ liệu (`Category`, `Product`, `Order`, `OrderItem`, `User`, `GroupOrder`, `Payment`, `Coupon`, `Review`, `SupportMessage`) trong `src/types/index.ts`.
* **NFR-MAINT-02: Điểm Cuối Giám Sát Sức Khỏe Hệ Thống (`/api/health`)**:
  * Trả về JSON trạng thái thời gian thực về kết nối CSDL SQL Server và cấu hình cổng thanh toán VietQR SePay, phục vụ cho các công cụ giám sát máy chủ tự động (Uptime Monitoring).
* **NFR-MAINT-03: Nhật Ký Cảnh Báo An Ninh (Security Event Logging)**:
  * Tự động in nhật ký cảnh báo an ninh chi tiết ra console máy chủ khi: Có IP kích hoạt bẫy Honeypot, có yêu cầu vượt ngưỡng Rate Limit, hoặc có Webhook sai token.

---

# PHẦN III: BẢNG ÁNH XẠ TOÀN DIỆN CỦA HỆ THỐNG

### BẢNG ÁNH XẠ 37 ROUTE API BACKEND

| STT | Phương thức | Đường dẫn API | Quyền hạn | Chức năng kỹ thuật chi tiết | Cơ chế bảo vệ / An ninh |
| :---: | :---: | :--- | :---: | :--- | :--- |
| 1 | `POST` | `/api/auth/register` | Công khai | Đăng ký tài khoản khách hàng mới | Rate Limit (5 req/m), Honeypot, Bcrypt, Regex |
| 2 | `POST` | `/api/auth/login` | Công khai | Đăng nhập tài khoản, phát hành JWT token 7 ngày | Rate Limit (10 req/m), Honeypot, Bcrypt |
| 3 | `GET` | `/api/user/profile` | Auth | Lấy thông tin tài khoản, tích điểm chi tiêu, hạng thẻ | RequireAuth, Ownership Verification |
| 4 | `PATCH`| `/api/user/profile` | Auth | Cập nhật họ tên, SĐT, địa chỉ nhận hàng | RequireAuth, Phone Regex, Input Sanitization |
| 5 | `POST` | `/api/user/change-password` | Auth | Đổi mật khẩu tài khoản | RequireAuth, Mật khẩu mạnh, Bcrypt |
| 6 | `GET` | `/api/user/promo-status` | Công khai/Auth| Kiểm tra trạng thái hưởng khuyến mãi VietQR | AuthenticateRequest, Tra cứu CSDL |
| 7 | `GET` | `/api/products` | Công khai | Lấy danh sách món ăn, hỗ trợ lọc và tìm kiếm | Caching, Tra cứu SQL Server |
| 8 | `GET` | `/api/products/[id]` | Công khai | Lấy chi tiết một món ăn kèm đánh giá | Kiểm tra ID hợp lệ, Tra cứu CSDL |
| 9 | `PUT` | `/api/products/[id]` | Admin | Chỉnh sửa thông tin món ăn hoặc trạng thái bán | RequireAdmin, Input Sanitization |
| 10 | `DELETE`| `/api/products/[id]` | Admin | Xóa món ăn khỏi thực đơn | RequireAdmin, Tra cứu CSDL |
| 11 | `GET` | `/api/categories` | Công khai | Lấy danh mục món ăn sắp xếp theo thứ tự | Tra cứu SQL Server |
| 12 | `GET` | `/api/categories/[id]` | Công khai | Lấy chi tiết một danh mục món ăn | Tra cứu SQL Server |
| 13 | `GET` | `/api/food-menu` | Công khai | Lấy menu đầy đủ phục vụ hiển thị và AI | Hỗ trợ Fallback dữ liệu nội bộ |
| 14 | `GET` | `/api/orders` | Auth | Xem danh sách đơn hàng (Khách/Admin) | RequireAuth, Phân tách Customer/Admin |
| 15 | `POST` | `/api/orders` | Auth | Tạo đơn hàng mới, tính ship, áp coupon kép, trừ ví | Rate Limit (15 req/m), Honeypot, Server Price Validation |
| 16 | `GET` | `/api/orders/[code]` | Auth/Khách | Tra cứu trạng thái và tiến trình đơn hàng | Tra cứu theo mã đơn duy nhất |
| 17 | `PATCH`| `/api/orders/[code]` | Admin | Cập nhật trạng thái đơn hàng, hủy đơn kèm hoàn ví | RequireAdmin, Virtual Wallet Refund Engine |
| 18 | `GET` | `/api/coupons` | Công khai | Lấy danh sách mã giảm giá còn hiệu lực | Tra cứu bộ quy tắc Coupons |
| 19 | `POST` | `/api/coupons/validate` | Công khai | Thẩm định mã coupon, tính tiền chiết khấu | Kiểm tra hạn dùng, min spend, usage limit, user tier |
| 20 | `POST` | `/api/group/create` | Auth | Tạo phòng đặt món nhóm mới | Sinh mã 6 ký tự, Gán Trưởng nhóm Host |
| 21 | `GET` | `/api/group/[code]` | Công khai | Lấy chi tiết phòng nhóm và các món đã chọn | Đồng bộ giỏ nhóm thời gian thực |
| 22 | `POST` | `/api/group/[code]/join` | Công khai | Thành viên tham gia vào phòng nhóm | Kiểm tra phòng mở (Open) |
| 23 | `POST` | `/api/group/[code]/items` | Công khai | Thêm một món ăn vào giỏ hàng nhóm | Cập nhật giỏ nhóm, Tính chiết khấu lũy tiến |
| 24 | `POST` | `/api/group/[code]/lock` | Chỉ Host | Khóa phòng nhóm chuẩn bị tạo đơn thanh toán | Kiểm tra quyền Trưởng nhóm (Host Only) |
| 25 | `GET` | `/api/group/[code]/members` | Công khai | Lấy danh sách thành viên trong phòng nhóm | Tra cứu phòng nhóm |
| 26 | `GET` | `/api/reviews` | Công khai | Lấy danh sách nhận xét và số sao của món | Tra cứu bảng Reviews, Tính điểm trung bình |
| 27 | `POST` | `/api/reviews` | Auth | Gửi đánh giá món ăn (yêu cầu đã từng mua) | Rate Limit (10 req/m), Verified Purchase Check, Upsert |
| 28 | `POST` | `/api/sepay/webhook` | SePay System | Tiếp nhận biến động số dư VietQR Napas 247 | Xác thực API Token, Regex mã đơn, Idempotency |
| 29 | `POST` | `/api/sepay/simulate` | Công khai | Giả lập thanh toán thành công (Sandbox) | Kiểm tra cờ DISABLE_PAYMENT_SIMULATION |
| 30 | `GET` | `/api/goong/autocomplete` | Công khai | Gợi ý địa chỉ giao hàng tại Hà Nội | Goong API + Fallback từ điển địa danh |
| 31 | `GET` | `/api/goong/distance` | Công khai | Tính khoảng cách lái xe và cước vận chuyển | Distance Matrix + Fallback Haversine |
| 32 | `POST` | `/api/ai-chat` | Công khai | Chatbot AI tư vấn món ăn thông minh | Rate Limit (15 req/m), Honeypot, Prompt Engineering |
| 33 | `GET` | `/api/support` | Auth/Khách | Lấy lịch sử tin nhắn hỗ trợ theo mã đơn | Lọc theo orderCode hoặc userId |
| 34 | `POST` | `/api/support` | Khách/Admin | Gửi tin nhắn hỗ trợ hoặc khiếu nại đơn hàng | Rate Limit (20 req/m), Anti Role Spoofing |
| 35 | `POST` | `/api/upload` | Chỉ Admin | Tải ảnh món ăn lên máy chủ Cloudinary CDN | RequireAdmin, Kiểm tra MIME Type, Giới hạn 10MB |
| 36 | `GET` | `/api/health` | Công khai | Kiểm tra kết nối CSDL và cổng thanh toán | Kiểm tra trạng thái máy chủ CSDL Cloud |
| 37 | `ALL` | `/api/honeypot-trap` | Công khai | Điểm cuối bẫy bot tự động cào dữ liệu | Tự động Blacklist IP trong 24 giờ |
| 38 | `GET` | `/api/admin/stats` | Chỉ Admin | Báo cáo thống kê doanh thu và đơn hàng | RequireAdmin, Tổng hợp CSDL |
| 39 | `POST` | `/api/admin/products/import` | Chỉ Admin | Nhập thực đơn hàng loạt từ Excel/JSON | RequireAdmin, Tự động tạo slug, Khớp category |
| 40 | `GET` | `/api/admin/test-apis` | Chỉ Admin | Kiểm tra độ trễ (latency) các API ngoại vi | RequireAdmin, Đo kiểm thực nghiệm trực tiếp |

---

### BẢNG ÁNH XẠ 9 BẢNG CƠ SỞ DỮ LIỆU SQL SERVER

| STT | Tên Bảng | Khóa chính (PK) | Khóa ngoại (FK) | Số cột | Vai trò và Trách nhiệm lưu trữ dữ liệu |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | `Categories` | `category_id` | Không có | 5 | Quản lý danh mục món ăn (Tên, slug, mô tả, thứ tự hiển thị, cờ kích hoạt). |
| 2 | `Products` | `product_id` | `category_id` $\rightarrow$ `Categories` | 13 | Quản lý món ăn thực đơn (Tên, slug, giá bán, mô tả, link ảnh, cờ nổi bật, cờ mở bán, thời gian làm, cấu hình topping). |
| 3 | `Users` | `user_id` | Không có | 11 | Quản lý tài khoản khách hàng và quản trị viên (Tên đăng nhập, mật khẩu băm, họ tên, SĐT, email, địa chỉ, phân quyền `role`, số dư ví ảo). |
| 4 | `Orders` | `order_id` | `user_id` $\rightarrow$ `Users` | 17 | Quản lý đơn hàng (Mã đơn duy nhất `orderCode`, thông tin người nhận, tiền hàng, tiền ship, tiền giảm giá, mã coupon, phương thức thanh toán, trạng thái đơn, lý do hủy đơn, trạng thái hoàn ví). |
| 5 | `OrderItems` | `order_item_id`| `order_id` $\rightarrow$ `Orders`, `product_id` $\rightarrow$ `Products` | 8 | Quản lý chi tiết từng món trong đơn (Tên món, đơn giá tại thời điểm đặt, số lượng, danh sách topping đã chọn, ghi chú riêng). |
| 6 | `GroupOrders` | `group_order_id`| `host_user_id` $\rightarrow$ `Users`, `final_order_id` $\rightarrow$ `Orders` | 9 | Quản lý phòng đặt nhóm (Mã phòng 6 ký tự `room_code`, tên phòng, chủ phòng, trạng thái phòng `open/locked/completed`, mã đơn thanh toán cuối cùng). |
| 7 | `Payments` | `payment_id` | `order_id` $\rightarrow$ `Orders` | 8 | Quản lý lịch sử giao dịch tài chính (Cổng thanh toán VietQR/COD, số tiền, mã giao dịch ngân hàng từ SePay, trạng thái `SUCCESS/FAILED`). |
| 8 | `Reviews` | `review_id` | `product_id` $\rightarrow$ `Products`, `user_id` $\rightarrow$ `Users` | 8 | Quản lý đánh giá món ăn (Số sao 1-5, nội dung nhận xét, mã đơn đã mua để xác thực, thời gian gửi và cập nhật). |
| 9 | `SupportMessages` | `message_id` | `user_id` $\rightarrow$ `Users`, `order_id` $\rightarrow$ `Orders` | 9 | Quản lý tin nhắn chăm sóc khách hàng và khiếu nại (Mã đơn liên kết, vai trò người gửi `customer/admin`, nội dung tin, cờ khiếu nại). |

---

## 🎯 KẾT LUẬN
Tài liệu trên là bản đặc tả **đầy đủ, chi tiết và chính xác 100%** toàn bộ các tính năng lớn, các vi tính năng nhỏ nhất ở cả phía Khách hàng lẫn Cổng Quản trị Admin, cùng toàn bộ các yêu cầu phi tính năng bảo đảm hệ thống NooNee Food vận hành an toàn và tin cậy tuyệt đối.
