# 🔍 BÁO CÁO ĐÁNH GIÁ TOÀN DIỆN DỰ ÁN NOONEE
## Trang Web Đặt Đồ Ăn - Next.js + MSSQL + VietQR

**Ngày đánh giá:** 16/09/2026  
**Phiên bản:** 1.0.0  
**Stack:** Next.js 14.2.15, React 18, TypeScript, Tailwind CSS, MSSQL, Cloudinary, VietQR (Sepay), Goong Maps  
**Tổng file đã review:** 50+ files (23 API routes, 13 components, 8 lib modules, 3 context, 11+ pages)

---

## 📊 TỔNG KẾT NHANH

| Mức độ | Số lượng | Mô tả |
|--------|----------|-------|
| 🔴 **CRITICAL** | 12 | Bảo mật, lộ credentials, RCE, SQL Injection |
| 🟠 **HIGH** | 18 | Logic sai, authentication bypass, data integrity |
| 🟡 **MEDIUM** | 22 | UX, validation, performance, accessibility |
| 🟢 **LOW** | 15+ | Code quality, best practices, minor improvements |

> [!CAUTION]
> Hệ thống hiện tại **KHÔNG AN TOÀN** để deploy lên internet. Có nhiều lỗ hổng bảo mật nghiêm trọng cần phải sửa trước khi public.

---

## 🔴 LỖI CRITICAL (Bảo mật nghiêm trọng - Phải sửa ngay)

### C1. 🚨 Lộ Database Credentials trong Source Code
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L9-L14)

```typescript
const dbConfig = {
  user: process.env.SQLSERVER_USER || 'db68391',
  password: process.env.SQLSERVER_PASSWORD || '7Em_Ze#3-8yA',
  server: process.env.SQLSERVER_HOST || 'db68391.public.databaseasp.net',
  port: parseInt(process.env.SQLSERVER_PORT || '1433'),
  database: process.env.SQLSERVER_DATABASE || 'db68391',
```

**Vấn đề:** Username, password, host, port của database cloud bị hardcode trực tiếp trong source code dưới dạng fallback values. Nếu repo được push lên GitHub (public hoặc private bị leak), bất kỳ ai cũng có thể truy cập trực tiếp vào database, đọc/ghi/xóa toàn bộ dữ liệu.

**Mức độ:** CRITICAL - Lộ toàn bộ dữ liệu người dùng, đơn hàng, mật khẩu.

**Fix:** Xóa hoàn toàn fallback credentials. Chỉ đọc từ `process.env`. Nếu thiếu env, throw error thay vì fallback.

---

### C2. 🚨 Lộ thông tin tài khoản ngân hàng
**File:** [sepay.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/sepay.ts#L10-L12)

```typescript
const bank = config.bankId || process.env.SEPAY_BANK_NAME || 'MB';
const acc = config.accountNo || process.env.SEPAY_BANK_ACCOUNT || '0822123346';
const name = encodeURIComponent(config.accountName || process.env.SEPAY_ACCOUNT_NAME || 'HOANG KHOI NGUYEN');
```

**Và trong:** [test-apis/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/admin/test-apis/route.ts#L124-L126), [health/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/health/route.ts#L13-L14)

**Vấn đề:** Số tài khoản ngân hàng thật (`0822123346`), tên chủ tài khoản (`HOANG KHOI NGUYEN`), và tên ngân hàng (`MB`) bị hardcode. Thêm vào đó, health check API trả về thông tin bank account cho bất kỳ ai gọi `/api/health`.

---

### C3. 🚨 Lộ Cloudinary Cloud Name
**File:** [test-apis/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/admin/test-apis/route.ts#L162)

```typescript
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'h2776qfi';
```

**Vấn đề:** Cloud name Cloudinary bị hardcode, cho phép kẻ tấn công liệt kê tất cả ảnh đã upload.

---

### C4. 🚨 Remote Code Execution (RCE) qua `child_process.exec`
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L110-L132)

```typescript
import { exec } from 'child_process';
// ...
async function queryLocalSqlCmd(query: string): Promise<any> {
  const safeQuery = query.replace(/"/g, '""');
  const command = `sqlcmd -S "localhost\\SQLEXPRESS" -d FoodOrderingDB -E -C -Q "${safeQuery}" -y 0 -w 8000`;
  const { stdout } = await execAsync(command);
```

**Vấn đề:** Hàm `queryLocalSqlCmd()` nhận SQL query và chạy trực tiếp qua `child_process.exec()` với shell. Mặc dù có replace `"` thành `""`, đây không đủ để ngăn command injection. Ký tự `$()`, backtick `` ` ``, hoặc `\n` có thể bypass escape và thực thi lệnh tùy ý trên server.

**Mức độ:** CRITICAL - Attacker có thể thực thi bất kỳ lệnh OS nào trên server.

---

### C5. 🚨 SQL Injection trong Local Fallback Queries
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts) - Nhiều dòng

Các hàm local fallback sử dụng string interpolation thay vì parameterized queries:

```typescript
// Dòng 192 - createCategory
await executeLocalSqlCmd(`INSERT INTO Categories ... VALUES (N'${data.name.replace(/'/g, "''")}'...`);

// Dòng 263 - deleteCategory  
await executeLocalSqlCmd(`...WHERE categoryId = ${id}; DELETE FROM Categories WHERE id = ${id};`);

// Dòng 324 - getProducts
if (options?.categoryId) query += ` AND p.categoryId = ${options.categoryId}`;

// Dòng 471 - createProduct
'${data.image}' // image URL không được escape!

// Dòng 534 - updateProduct
if (data.image) updates.push(`image = '${data.image}'`); // Không escape!

// Dòng 666 - createOrder  
VALUES ('${data.orderCode}', ...); // orderCode không escape!
```

**Vấn đề:** Mặc dù cloud queries dùng parameterized inputs (tốt), nhưng tất cả local fallback queries đều dùng string concatenation. Đặc biệt, `data.image` (dòng 471, 534) hoàn toàn không được escape.

---

### C6. 🚨 Mật khẩu lưu dạng Plain Text - Không Hash
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L1234-L1242)

```typescript
export async function verifyUserCredentials(username: string, password: string): Promise<User | null> {
  const user = await getUserByUsername(username);
  if (!user) return null;
  if ((user as any).password === password) { // So sánh trực tiếp!
    const { password: _, ...safeUser } = user as any;
    return safeUser;
  }
  return null;
}
```

**Và:** [db.ts#L1319](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L1319)
```typescript
if ((user as any).password !== currentPass) { // So sánh plaintext
```

**Vấn đề:** Mật khẩu được lưu trữ và so sánh dưới dạng plaintext. Không sử dụng bcrypt, argon2, hay bất kỳ thuật toán hash nào. Nếu database bị leak, toàn bộ mật khẩu người dùng bị lộ nguyên bản.

---

### C7. 🚨 Không có Authentication/Authorization trên API Backend
**File:** Hầu hết các API routes

| API Endpoint | Vấn đề |
|---|---|
| `PUT /api/products/[id]` | Bất kỳ ai cũng có thể sửa sản phẩm |
| `DELETE /api/products/[id]` | Bất kỳ ai cũng có thể xóa sản phẩm |
| `POST /api/products` | Bất kỳ ai cũng có thể thêm sản phẩm |
| `PUT /api/categories/[id]` | Bất kỳ ai cũng có thể sửa danh mục |
| `DELETE /api/categories/[id]` | Bất kỳ ai cũng có thể xóa danh mục |
| `POST /api/upload` | Bất kỳ ai cũng có thể upload ảnh lên Cloudinary |
| `GET /api/admin/stats` | Bất kỳ ai cũng có thể xem thống kê doanh thu |
| `PATCH /api/orders/[code]` | Bất kỳ ai cũng có thể thay đổi trạng thái đơn hàng |
| `GET /api/orders` | Bất kỳ ai cũng có thể xem TẤT CẢ đơn hàng |
| `GET /api/user/profile?userId=X` | Bất kỳ ai cũng có thể xem profile người khác |
| `PATCH /api/user/profile` | Bất kỳ ai cũng có thể sửa profile người khác |
| `POST /api/user/change-password` | Đổi pass chỉ cần biết userId, không cần session |
| `POST /api/sepay/simulate` | Bất kỳ ai cũng có thể giả lập thanh toán |

**Vấn đề:** Không có một API route nào kiểm tra JWT token, session, hay cookie xác thực. "AdminGuard" chỉ là kiểm tra ở phía client (localStorage), hoàn toàn vô dụng cho bảo mật.

---

### C8. 🚨 Thao túng giá đơn hàng từ Client
**File:** [orders/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/orders/route.ts#L52-L55)

```typescript
const subtotal = items.reduce(
  (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
  0
);
```

**Vấn đề:** API nhận `price` từ client-side payload. Attacker có thể intercept request và đặt `price: 0` cho mọi sản phẩm, tạo đơn hàng miễn phí. Backend PHẢI tra cứu giá từ database dựa vào `productId`.

---

### C9. 🚨 Sepay Webhook dễ bị giả mạo
**File:** [sepay/webhook/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/sepay/webhook/route.ts#L8-L20)

```typescript
const expectedToken = process.env.SEPAY_API_TOKEN;
if (expectedToken && expectedToken !== 'demo_sepay_token' && expectedToken.trim() !== '') {
  const isAuthorized = authHeader.includes(expectedToken.trim());
```

**Vấn đề:**
1. Nếu `SEPAY_API_TOKEN` không được set hoặc bằng `'demo_sepay_token'`, webhook hoàn toàn **KHÔNG** xác thực → bất kỳ ai POST đến `/api/sepay/webhook` đều có thể đánh dấu đơn hàng là "Paid"
2. Dùng `includes()` thay vì `===` để so sánh token → dễ bị bypass nếu token ngắn
3. Không verify webhook signature (HMAC)

---

### C10. 🚨 Simulate Payment API không được bảo vệ
**File:** [sepay/simulate/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/sepay/simulate/route.ts)

**Vấn đề:** Endpoint `/api/sepay/simulate` cho phép bất kỳ ai giả lập thanh toán thành công cho bất kỳ đơn hàng nào, chỉ cần biết `orderCode`. Không có authentication, không có điều kiện disable trong production.

---

### C11. 🚨 Inconsistency giữa In-Memory và Cloud Data
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts)

**Vấn đề:** Mỗi hàm CRUD đều update in-memory cache VÀ cloud database song song, nhưng:
1. Nếu cloud insert thành công nhưng in-memory có ID khác → data inconsistency
2. Trong môi trường serverless (Vercel), in-memory data bị reset giữa các cold starts
3. `createCategory()`: `newCat.id = inMemoryCategories.length + 1` nhưng DB tự tăng ID → ID conflict
4. `createProduct()`: tương tự

---

### C12. 🚨 deleteCategory dùng cùng request object cho 2 queries
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L250-L257)

```typescript
const req = pool.request();
req.input('id', sql.Int, id);
await req.query('UPDATE Products SET categoryId = NULL WHERE categoryId = @id');
await req.query('DELETE FROM Categories WHERE id = @id');
```

**Vấn đề:** Reuse cùng một `request` object cho 2 query liên tiếp. Trong `mssql` library, một request object không nên được dùng lại. Điều này có thể gây lỗi runtime: `"Request is in failed state"`.

---

## 🟠 LỖI HIGH (Chức năng bị hỏng/Logic sai)

### H1. Coupon Validation Thiếu Membership Tier trên Server
**File:** [coupons/validate/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/coupons/validate/route.ts#L17-L22)

```typescript
const result = validateCoupon(
  code,
  Number(subtotal) || 0,
  paymentMethod || 'Sepay',
  isNewUser
  // ⚠️ Thiếu userTier parameter!
);
```

**Vấn đề:** Hàm `validateCoupon()` nhận parameter `userTier` nhưng API validate không truyền nó → membership tier vouchers (SILVER10, GOLD25, GOLDVIP, DIAMOND50, DIAMONDVIP) sẽ bị coi là `userTier = undefined` → rank = 0 (Bronze) → tất cả voucher membership đều bị từ chối dù user đủ điều kiện.

---

### H2. Order Code có khả năng bị trùng
**File:** [utils.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/utils.ts#L31-L38)

```typescript
export function generateOrderCode(): string {
  const chars = '0123456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DH${Date.now().toString().slice(-4)}${rand}`;
}
```

**Vấn đề:** Chỉ dùng 4 chữ số cuối của timestamp + 4 random digits → 8 chữ số → 10^8 = 100 triệu tổ hợp. Nhưng `Date.now().slice(-4)` chỉ thay đổi mỗi 10 giây → nếu có 2 đơn trong cùng 10 giây chỉ còn 10^4 = 10,000 tổ hợp. Hơn nữa, `Math.random()` không cryptographically secure.

---

### H3. Không kiểm tra đơn hàng đã thanh toán khi nhận tiền thiếu
**File:** [sepay/webhook/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/sepay/webhook/route.ts#L44-L48)

```typescript
const transferAmount = payload.transferAmount || payload.amount;
if (transferAmount && Number(transferAmount) < order.totalAmount) {
  console.warn(`[Sepay] Amount paid (${transferAmount}) is less than order total (${order.totalAmount})`);
}
// Vẫn đánh dấu Paid dù thiếu tiền!
await updateOrderStatus(orderCode, 'Pending', 'Paid');
```

**Vấn đề:** Khi khách chuyển thiếu tiền, hệ thống chỉ log warning nhưng VẪN đánh dấu đơn là "Paid". Khách có thể cố ý chuyển 1,000đ cho đơn 500,000đ và vẫn được coi là đã thanh toán.

---

### H4. Race Condition khi trừ Wallet
**File:** [orders/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/orders/route.ts#L82-L93)

```typescript
if (body.useWallet && parsedUserId) {
  const currentWallet = await getUserWalletBalance(parsedUserId);
  if (currentWallet > 0) {
    walletAmountUsed = Math.min(currentWallet, totalBeforeWallet);
    if (walletAmountUsed > 0) {
      await deductUserWallet(parsedUserId, walletAmountUsed);
    }
  }
}
```

**Vấn đề:** Race condition TOCTOU (Time-of-Check Time-of-Use). Nếu user gửi 2 đơn hàng cùng lúc, cả 2 request sẽ đọc cùng `currentWallet`, rồi cả 2 đều trừ tiền → trừ gấp đôi hoặc trừ nhiều hơn số dư. Cần dùng database transaction hoặc row-level locking.

---

### H5. Wallet Deduction không rollback khi tạo Order thất bại
**File:** [orders/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/orders/route.ts#L86-L114)

**Vấn đề:** Tiền trong ví được trừ TRƯỚC khi tạo order. Nếu `createOrder()` thất bại (database error), tiền đã bị trừ nhưng order không được tạo → mất tiền ví. Cần dùng database transaction.

---

### H6. Change Password yêu cầu khác nhau giữa Register và Change
**File:** 
- Register: [register/route.ts#L59-L81](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/auth/register/route.ts#L59-L81) - Yêu cầu ≥8 ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt
- Change: [change-password/route.ts#L18](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/user/change-password/route.ts#L18) - Chỉ yêu cầu ≥6 ký tự

**Vấn đề:** User có thể đăng ký với mật khẩu mạnh rồi đổi sang mật khẩu yếu `123456`.

---

### H7. `updateUserProfile` ghi đè trường rỗng thay vì giữ nguyên
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L1353-L1355)

```typescript
req.input('fullName', sql.NVarChar(100), data.fullName || '');
req.input('phone', sql.NVarChar(20), data.phone || '');
req.input('address', sql.NVarChar(255), data.address || '');
```

**Vấn đề:** Mặc dù SQL dùng `COALESCE(NULLIF(@fullName, ''), fullName)`, nhưng nếu client gửi `fullName: ""` → giá trị `''` bị truyền vào → `NULLIF('', '')` = NULL → `COALESCE(NULL, fullName)` = giữ nguyên (may mắn đúng). Tuy nhiên logic này không rõ ràng và dễ gây nhầm lẫn.

---

### H8. In-Memory Users chứa mật khẩu admin mặc định
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L104-L107)

```typescript
let inMemoryUsers: User[] = [
  { id: 1, username: 'admin', fullName: 'Quản Trị Viên', ... role: 'admin' },
  { id: 2, username: 'khachhang', fullName: 'Nguyễn Văn An', ... role: 'customer' }
];
```

**Vấn đề:** Khi fallback sang in-memory, tài khoản admin có thể đăng nhập không cần mật khẩu vì `verifyUserCredentials` so sánh `(user as any).password === password` mà in-memory user không có field password → `undefined === ''` = false. Tuy nhiên nếu user gửi `password: undefined` → `undefined === undefined` = true → bypass auth!

---

### H9. `checkDatabaseHealth()` luôn trả `connected: true` 
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L1145-L1147)

```typescript
return {
    connected: true, // ⚠️ Luôn true kể cả khi cả 2 DB đều fail!
    engine: 'In-Memory Fallback & SQL Bridge',
```

**Vấn đề:** Health check báo `connected: true` kể cả khi cả cloud DB và local DB đều không kết nối được. Đánh lừa monitoring system.

---

### H10. Không validate `orderCode` khi hủy đơn
**File:** [orders/[code]/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/orders/%5Bcode%5D/route.ts#L21-L45)

**Vấn đề:** PATCH endpoint cho phép bất kỳ ai hủy bất kỳ đơn nào chỉ cần biết `orderCode`. Không kiểm tra đơn hàng có thuộc về user đang request hay không.

---

### H11. FREESHIP coupon logic không đúng
**File:** [orders/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/orders/route.ts#L79)

```typescript
const couponDiscountExcludingFreeship = validCouponCode === 'FREESHIP' ? 0 : discountAmount;
const totalBeforeWallet = Math.max(0, subtotal - couponDiscountExcludingFreeship + shippingFee);
```

**Vấn đề:** FREESHIP coupon có `discountValue: 15000` nhưng khi tính tổng, nó bị set `couponDiscountExcludingFreeship = 0`. Vậy discount 15k của FREESHIP đi đâu? Nó vẫn được ghi vào `discountAmount` trong order nhưng không thực sự được trừ khỏi tổng tiền.

---

### H12. API Support cho phép giả mạo senderRole
**File:** [support/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/support/route.ts#L45)

```typescript
senderRole: senderRole === 'admin' ? 'admin' : 'customer',
```

**Vấn đề:** Client có thể gửi `senderRole: 'admin'` và message sẽ hiển thị như là từ admin. Không có xác thực backend.

---

### H13. `getUserById` trả về password
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L1250-L1252)

```typescript
const res = await req.query(`
  SELECT id, username, password, fullName, email, phone, address, role, ...
```

**Vấn đề:** Query SELECT bao gồm field `password`. Mặc dù một số nơi strip password trước khi trả về client, nhưng hàm `getUserById` tự nó trả về password → dễ bị rò rỉ nếu có dev mới gọi hàm này và quên strip.

---

### H14. Rate Limiter bị reset khi server restart
**File:** [rateLimit.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/rateLimit.ts#L6)

```typescript
const rateLimitStore = new Map<string, RateLimitRecord>();
```

**Vấn đề:** Rate limit lưu trong RAM, bị mất hoàn toàn khi:
- Server cold start trên Vercel
- Hot reload trong dev mode
- Khi có nhiều serverless instances, mỗi instance có rate limit store riêng → attacker chỉ cần đổi route qua instance khác

---

### H15. Không có Pagination cho Orders và Products
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L746-L827), [orders/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/orders/route.ts#L8-L21)

**Vấn đề:** `getOrders()` và `getProducts()` trả về TẤT CẢ records. Khi có hàng ngàn đơn hàng, response sẽ cực kỳ lớn, gây:
- Timeout trên serverless
- Out of memory
- Chậm render client

---

### H16. Không validate `status` giá trị hợp lệ khi update order
**File:** [orders/[code]/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/orders/%5Bcode%5D/route.ts#L41)

```typescript
const success = await updateOrderStatus(params.code, status, paymentStatus, cancelReason);
```

**Vấn đề:** `status` nhận từ client không được validate. Client có thể gửi bất kỳ giá trị nào, ví dụ `status: "HackedStatus"`.

---

### H17. Order Items thiếu validation trên server
**File:** [orders/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/orders/route.ts#L113)

```typescript
items, // items từ client truyền thẳng vào createOrder
```

**Vấn đề:** Không validate `productId` tồn tại, `quantity > 0`, `price` khớp DB. Attacker có thể gửi items với productId không tồn tại hoặc quantity âm.

---

### H18. `getAdminStats()` load toàn bộ data vào memory
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L1075-L1090)

```typescript
export async function getAdminStats() {
  const orders = await getOrders();       // Load ALL orders
  const products = await getProducts();   // Load ALL products
  const totalRevenue = orders.reduce(...);
```

**Vấn đề:** Thay vì dùng SQL aggregate (`SUM`, `COUNT`), hàm load toàn bộ dữ liệu vào JavaScript rồi tính. Với 10,000 orders, response sẽ mất vài giây và tốn RAM.

---

## 🟡 LỖI MEDIUM (UX, Validation, Performance)

### M1. Thiếu Error Boundary
**File:** [layout.tsx](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/layout.tsx)

**Vấn đề:** Không có `error.tsx` hay `<ErrorBoundary>`. Bất kỳ lỗi runtime nào sẽ gây White Screen of Death.

---

### M2. Dùng thẻ `<img>` thay vì Next.js `<Image>`
**File:** Nhiều components (ProductCard, page.tsx, v.v.)

**Vấn đề:** Ảnh không được lazy load, resize tự động, hay optimize format → giảm điểm LCP, SEO và tốc độ tải trang.

---

### M3. Thiếu Accessibility (a11y)
**Files:** AddressAutocompleteInput.tsx, CartDrawer.tsx, ProductOptionsModal.tsx

**Vấn đề:**
- Thiếu `role="combobox"`, `aria-expanded`, `role="listbox"` cho autocomplete
- Modal/Drawer thiếu focus trap → user dùng Tab thoát ra khỏi modal
- Thiếu `aria-label` trên nhiều button chỉ có icon

---

### M4. Memory Leak trong AddressAutocompleteInput
**File:** [AddressAutocompleteInput.tsx](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/components/AddressAutocompleteInput.tsx)

**Vấn đề:** `setTimeout` + `fetch` không có cleanup function, không dùng `AbortController`. Nếu user gõ nhanh rồi chuyển trang, state vẫn bị update gây memory leak.

---

### M5. Body overflow conflict giữa CartDrawer và ProductOptionsModal
**Files:** CartDrawer.tsx, ProductOptionsModal.tsx

**Vấn đề:** Cả 2 đều set `document.body.style.overflow = 'hidden'` khi mở và `'unset'` khi đóng. Nếu mở cả 2 cùng lúc rồi đóng 1, overflow bị reset → modal còn lại bị scroll through.

---

### M6. Checkout flash khi chưa load xong Auth
**File:** checkout/page.tsx

**Vấn đề:** Kiểm tra `if (!user)` ngay lập tức. Nếu AuthContext chưa load xong (`isLoading = true`), user sẽ thấy "Vui lòng đăng nhập" flash rồi mất.

---

### M7. Silent Errors trong Checkout
**File:** checkout/page.tsx

**Vấn đề:** Các fetch call kết thúc bằng `.catch(() => {})`, ẩn hoàn toàn lỗi mạng/server.

---

### M8. `revalidate = 0` trên Homepage
**File:** page.tsx

**Vấn đề:** Ép SSR mỗi request. Nên dùng ISR (`revalidate = 60`) để cache.

---

### M9. Fetch không check `res.ok`
**File:** Nhiều components

**Vấn đề:** Gọi `res.json()` mà không check `res.ok`. Nếu server trả lỗi HTML (nginx 502), `res.json()` sẽ throw exception.

---

### M10. Hydration Mismatch (Cart/Favorites)
**Files:** CartContext.tsx, FavoritesContext.tsx

**Vấn đề:** Server render với state trống, client load từ localStorage → hydration mismatch trên console.

---

### M11. Slug generation không hỗ trợ tiếng Việt
**File:** [products/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/products/route.ts#L25), [categories/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/categories/route.ts#L20)

```typescript
const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
```

**Vấn đề:** Tên sản phẩm tiếng Việt như "Phở Bò Đặc Biệt" sẽ thành `"ph-----c-bi-t"` vì toàn bộ ký tự Unicode bị thay bằng `-`. Cần thêm hàm loại bỏ dấu trước khi tạo slug.

---

### M12. Email validation thiếu
**File:** [register/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/auth/register/route.ts)

**Vấn đề:** Không validate format email. User có thể đăng ký với `email: "not-an-email"`.

---

### M13. Font tùy chỉnh "Haas" không được load
**File:** [tailwind.config.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/tailwind.config.ts#L61-L62)

```typescript
fontFamily: {
  sans: ["Haas", "Inter", "-apple-system", ...],
  display: ["Haas Groot Disp", "Haas", "Inter", "sans-serif"],
},
```

**Vấn đề:** Font "Haas" và "Haas Groot Disp" không được import ở đâu trong project (không có `@font-face`, không import từ Google Fonts). Sẽ luôn fallback về Inter hoặc system fonts.

---

### M14. `next.config.mjs` thiếu Cloudinary domain
**File:** [next.config.mjs](file:///D:/DangQuangTung/NooNee/Noonee/noonee/next.config.mjs)

**Vấn đề:** `remotePatterns` có `images.unsplash.com` và `api.vietqr.io`, nhưng thiếu `res.cloudinary.com`. Ảnh upload lên Cloudinary sẽ không thể hiển thị qua `<Image>` component.

---

### M15. Không có CORS headers
**File:** Tất cả API routes

**Vấn đề:** Không set Access-Control headers. Nếu frontend deploy trên domain khác backend, tất cả API calls sẽ bị browser block.

---

### M16. `trustServerCertificate: true` cho Cloud DB
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L17)

**Vấn đề:** Chấp nhận bất kỳ SSL certificate nào → dễ bị Man-in-the-Middle attack. Chỉ nên dùng cho dev, production phải validate certificate.

---

### M17. Error responses lộ stack trace
**File:** Nhiều API routes

```typescript
return NextResponse.json({ success: false, error: error.message }, { status: 500 });
```

**Vấn đề:** `error.message` có thể chứa chi tiết database schema, SQL errors, hoặc đường dẫn file server. Chỉ nên trả generic error message cho client.

---

### M18. Thiếu CSRF protection
**Vấn đề:** Không có CSRF token cho bất kỳ form nào. Attacker có thể tạo trang web giả mạo tự động gửi POST requests thay user.

---

### M19. Timeout quá ngắn cho Cloud DB
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L18-L19)

```typescript
connectTimeout: 15000,
requestTimeout: 15000,
```

**Vấn đề:** 15 giây có thể đủ cho local, nhưng cloud DB qua internet có thể chậm hơn, đặc biệt với các query phức tạp.

---

### M20. `Goong API Key` bị lộ qua env variable name
**File:** [goong.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/goong.ts#L99-L103)

```typescript
export function getGoongApiKey(): string {
  return (
    process.env.GOONG_API_KEY ||
    process.env.NEXT_PUBLIC_GOONG_API_KEY || // ⚠️ NEXT_PUBLIC_ = exposed to client!
    ''
  ).trim();
}
```

**Vấn đề:** `NEXT_PUBLIC_GOONG_API_KEY` sẽ bị đưa vào client bundle. API key nên chỉ dùng trên server.

---

### M21. Không validate phone number khi đặt hàng
**File:** [orders/route.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/app/api/orders/route.ts#L45-L50)

**Vấn đề:** Chỉ check `!customerPhone` (empty), không validate format. User có thể nhập `customerPhone: "abc"`.

---

### M22. schemaChecked flag reset khi server restart
**File:** [db.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/lib/db.ts#L35-L56)

```typescript
let schemaChecked = false;
async function ensureSchemaColumns(pool: any) {
  if (schemaChecked || !pool) return;
  schemaChecked = true;
```

**Vấn đề:** `ensureSchemaColumns` chạy ALTER TABLE mỗi lần server cold start. Trên serverless, điều này xảy ra rất thường xuyên. Mặc dù SQL có `IF NOT EXISTS`, nhưng vẫn tốn resources.

---

## 🟢 LỖI LOW (Code Quality & Best Practices)

### L1. `any` type sử dụng quá nhiều
**File:** Toàn bộ db.ts, API routes

**Vấn đề:** `pool: any`, `req: any`, `(user as any).password`, `error: any` - TypeScript strict mode bị phá bỏ bởi `any` types.

---

### L2. Duplicate toppings parse logic
**File:** db.ts - 6 lần copy-paste cùng đoạn parse toppings

```typescript
let parsedToppings = [];
if (r.toppings) {
  try {
    parsedToppings = typeof r.toppings === 'string' ? JSON.parse(r.toppings) : r.toppings;
  } catch (e) {}
}
```

**Fix:** Extract thành helper function.

---

### L3. Hardcoded hex colors thay vì dùng Tailwind tokens
**File:** Tất cả components

**Vấn đề:** `text-[#181d26]`, `bg-[#e31837]`, `border-[#dddddd]` xuất hiện khắp nơi thay vì dùng semantic class names từ tailwind.config.ts.

---

### L4. Hardcoded Vietnamese text
**File:** Toàn bộ project

**Vấn đề:** Tất cả UI text và error messages hardcode tiếng Việt. Không thể hỗ trợ đa ngôn ngữ. Nên dùng i18n library.

---

### L5. Missing TypeScript strict null checks
**File:** tsconfig.json

**Vấn đề:** `strict: true` đã bật nhưng code sử dụng `any` khắp nơi, vô hiệu hóa lợi ích của strict mode.

---

### L6. No unit tests
**Vấn đề:** Không có bất kỳ test file nào (ngoại trừ `test_system.js` ở root). Không có test cho business logic quan trọng như coupon validation, shipping fee calculation, order creation.

---

### L7. `postcss.config.js` dùng CommonJS
**File:** postcss.config.js

**Vấn đề:** Không nhất quán - project dùng ESM (`next.config.mjs`) nhưng PostCSS dùng CJS.

---

### L8. Missing `.env.example` file
**Vấn đề:** Không có file mẫu cho environment variables. Developer mới không biết cần config những gì.

---

### L9. `mssql.d.ts` gần như trống
**File:** [types/mssql.d.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/src/types/mssql.d.ts)

**Nội dung chỉ là:** `declare module 'mssql';` - Override type definitions chính thức, mất toàn bộ type safety cho mssql library.

---

### L10. Tailwind content path bao gồm `pages/` không tồn tại
**File:** [tailwind.config.ts](file:///D:/DangQuangTung/NooNee/Noonee/noonee/tailwind.config.ts#L5)

```typescript
"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
```

**Vấn đề:** Project dùng App Router, không có thư mục `pages/`. Path này không cần thiết.

---

---

## 🚀 KHUYẾN NGHỊ ĐỂ WEBSITE HOẠT ĐỘNG THỰC TẾ TRÊN INTERNET

### 1. **Bảo mật (Must-have trước khi deploy)**

| # | Hành động | Ưu tiên |
|---|---|---|
| 1 | **Xóa toàn bộ hardcoded credentials** khỏi source code, rotate tất cả password/token đã lộ | 🔴 P0 |
| 2 | **Implement JWT authentication** với HTTP-Only cookies, refresh token, và session management | 🔴 P0 |
| 3 | **Hash mật khẩu bằng bcrypt** (min 12 rounds) hoặc argon2 | 🔴 P0 |
| 4 | **Thêm middleware xác thực** cho tất cả admin API routes | 🔴 P0 |
| 5 | **Validate price server-side** - lookup từ DB thay vì tin tưởng client | 🔴 P0 |
| 6 | **Xóa `child_process.exec`** fallback hoàn toàn | 🔴 P0 |
| 7 | **Xóa `/api/sepay/simulate`** hoặc chỉ enable khi `NODE_ENV=development` | 🔴 P0 |
| 8 | **Implement HMAC signature verification** cho Sepay webhook | 🟠 P1 |
| 9 | **Thêm CSRF protection** | 🟠 P1 |
| 10 | **Dùng Redis** cho rate limiting thay vì in-memory Map | 🟡 P2 |

### 2. **Kiến trúc & Database**

| # | Hành động | Ưu tiên |
|---|---|---|
| 1 | **Loại bỏ in-memory fallback** - nó gây inconsistency và là nguồn gốc nhiều bug | 🟠 P1 |
| 2 | **Dùng Database Transactions** cho order creation + wallet deduction | 🟠 P1 |
| 3 | **Thêm pagination** (OFFSET/FETCH hoặc cursor-based) cho orders, products | 🟠 P1 |
| 4 | **Tối ưu `getAdminStats()`** bằng SQL aggregate queries | 🟡 P2 |
| 5 | **Tạo database migration scripts** thay vì auto ALTER TABLE | 🟡 P2 |
| 6 | **Thêm unique constraint** cho orderCode, username | 🟡 P2 |

### 3. **Frontend**

| # | Hành động | Ưu tiên |
|---|---|---|
| 1 | **Thêm Error Boundary** (`error.tsx` cho mỗi route segment) | 🟠 P1 |
| 2 | **Dùng Next.js `<Image>` component** thay vì `<img>` | 🟠 P1 |
| 3 | **Fix hydration mismatch** bằng cờ `isLoaded` cho Cart/Favorites | 🟡 P2 |
| 4 | **Thêm loading skeleton** cho mọi data fetch | 🟡 P2 |
| 5 | **Cải thiện Accessibility** (ARIA attributes, focus trap, keyboard nav) | 🟡 P2 |

### 4. **DevOps & Deployment**

| # | Hành động | Ưu tiên |
|---|---|---|
| 1 | **Tạo `.env.example`** với danh sách tất cả biến môi trường cần thiết | 🟠 P1 |
| 2 | **Setup CI/CD** với lint + type check + test trước khi deploy | 🟡 P2 |
| 3 | **Thêm logging có cấu trúc** (structured logging) thay vì `console.log` | 🟡 P2 |
| 4 | **Setup monitoring/alerting** (Sentry, DataDog, hoặc tối thiểu Vercel Analytics) | 🟡 P2 |
| 5 | **Enable Next.js security headers** (CSP, X-Frame-Options, HSTS) | 🟡 P2 |

---

> [!IMPORTANT]
> **Kết luận:** Dự án có kiến trúc tốt (Next.js App Router, cấu trúc rõ ràng, UI đẹp) và nhiều tính năng ấn tượng (VietQR payment, Goong maps, membership tiers, wallet system). Tuy nhiên, **12 lỗi CRITICAL về bảo mật** khiến website **không thể deploy public** trong trạng thái hiện tại. Các lỗi nghiêm trọng nhất là: lộ credentials (C1-C3), RCE (C4), SQL injection (C5), không hash password (C6), và thiếu authentication (C7). Cần tối thiểu 2-3 tuần effort tập trung vào bảo mật trước khi đưa lên production.
