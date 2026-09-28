# NooNee - Database Schema Documentation
## Danh sách các bảng

| # | Tên bảng | Số cột | Số dòng dữ liệu | Khóa chính (PK) | Mô tả tóm tắt |
|---|---|---|---|---|---|
| 1 | **`Categories`** | 6 | 5 | `id` | Danh mục món ăn (Cơm, Phở, Đồ uống, Khai vị...) |
| 2 | **`GroupOrders`** | 9 | 9 | `id` | Phòng đặt đơn nhóm (mã phòng, chủ phòng, danh sách thành viên & món) |
| 3 | **`OrderItems`** | 9 | 2 | `id` | Chi tiết từng món trong đơn (số lượng, giá tại thời điểm đặt, topping đã chọn) |
| 4 | **`Orders`** | 20 | 1 | `id` | Đơn đặt hàng, thông tin giao hàng, trạng thái, mã đơn nhóm, mã giảm giá |
| 5 | **`Payments`** | 10 | 0 | `id` | Giao dịch thanh toán (VietQR/Sepay, Tiền mặt, Số tiền, Trạng thái) |
| 6 | **`Products`** | 13 | 73 | `id` | Danh sách món ăn, giá tiền, hình ảnh, toppings, đánh giá |
| 7 | **`Reviews`** | 8 | 0 | `id` | Đánh giá & nhận xét của khách hàng cho từng món ăn |
| 8 | **`SupportMessages`** | 9 | 8 | `id` | Tin nhắn hỗ trợ trực tuyến giữa khách hàng và Admin theo mã đơn |
| 9 | **`Users`** | 10 | 8 | `id` | Tài khoản người dùng & Admin, mật khẩu băm, ví tiền (walletBalance) |

---

## Bảng `Categories`

- **Mô tả:** Danh mục món ăn (Cơm, Phở, Đồ uống, Khai vị...)
- **Số dòng hiện tại:** `5` dòng
- **Khóa chính (PK):** `id`

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Identity (Auto-Inc) | Ghi chú |
|---|---|---|---|---|---|
| `id` | `int` | **Không (NOT NULL)** | - | Có | **PK** |
| `name` | `nvarchar(100)` | **Không (NOT NULL)** | - | - |  |
| `slug` | `nvarchar(100)` | **Không (NOT NULL)** | - | - |  |
| `description` | `nvarchar(255)` | Có (NULL) | - | - |  |
| `icon` | `nvarchar(50)` | **Không (NOT NULL)** | `('Utensils')` | - |  |
| `createdAt` | `datetime` | **Không (NOT NULL)** | `(getdate())` | - |  |

---

## Bảng `GroupOrders`

- **Mô tả:** Phòng đặt đơn nhóm (mã phòng, chủ phòng, danh sách thành viên & món)
- **Số dòng hiện tại:** `9` dòng
- **Khóa chính (PK):** `id`

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Identity (Auto-Inc) | Ghi chú |
|---|---|---|---|---|---|
| `id` | `int` | **Không (NOT NULL)** | - | Có | **PK** |
| `code` | `nvarchar(50)` | **Không (NOT NULL)** | - | - |  |
| `hostName` | `nvarchar(150)` | **Không (NOT NULL)** | - | - |  |
| `hostUserId` | `int` | Có (NULL) | - | - |  |
| `status` | `nvarchar(50)` | Có (NULL) | `('active')` | - |  |
| `orderCode` | `nvarchar(50)` | Có (NULL) | - | - |  |
| `membersData` | `nvarchar(MAX)` | Có (NULL) | - | - |  |
| `createdAt` | `datetime` | Có (NULL) | `(getdate())` | - |  |
| `updatedAt` | `datetime` | Có (NULL) | `(getdate())` | - |  |

---

## Bảng `OrderItems`

- **Mô tả:** Chi tiết từng món trong đơn (số lượng, giá tại thời điểm đặt, topping đã chọn)
- **Số dòng hiện tại:** `2` dòng
- **Khóa chính (PK):** `id`
- **Khóa ngoại (FK):**
  - `orderId` ➔ `Orders(id)` (FK__OrderItem__order__6477ECF3)
  - `productId` ➔ `Products(id)` (FK__OrderItem__produ__656C112C)

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Identity (Auto-Inc) | Ghi chú |
|---|---|---|---|---|---|
| `id` | `int` | **Không (NOT NULL)** | - | Có | **PK** |
| `orderId` | `int` | **Không (NOT NULL)** | - | - | FK ➔ Orders |
| `productId` | `int` | Có (NULL) | - | - | FK ➔ Products |
| `productName` | `nvarchar(150)` | **Không (NOT NULL)** | - | - |  |
| `price` | `decimal(18, 0)` | **Không (NOT NULL)** | - | - |  |
| `quantity` | `int` | **Không (NOT NULL)** | - | - |  |
| `total` | `decimal(18, 0)` | **Không (NOT NULL)** | - | - |  |
| `note` | `nvarchar(500)` | Có (NULL) | - | - |  |
| `toppings` | `nvarchar(1000)` | Có (NULL) | - | - |  |

---

## Bảng `Orders`

- **Mô tả:** Đơn đặt hàng, thông tin giao hàng, trạng thái, mã đơn nhóm, mã giảm giá
- **Số dòng hiện tại:** `1` dòng
- **Khóa chính (PK):** `id`
- **Khóa ngoại (FK):**
  - `userId` ➔ `Users(id)` (FK__Orders__userId__5CD6CB2B)

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Identity (Auto-Inc) | Ghi chú |
|---|---|---|---|---|---|
| `id` | `int` | **Không (NOT NULL)** | - | Có | **PK** |
| `orderCode` | `nvarchar(50)` | **Không (NOT NULL)** | - | - |  |
| `userId` | `int` | Có (NULL) | - | - | FK ➔ Users |
| `customerName` | `nvarchar(100)` | **Không (NOT NULL)** | - | - |  |
| `customerPhone` | `nvarchar(20)` | **Không (NOT NULL)** | - | - |  |
| `deliveryAddress` | `nvarchar(255)` | **Không (NOT NULL)** | - | - |  |
| `notes` | `nvarchar(500)` | Có (NULL) | - | - |  |
| `totalAmount` | `decimal(18, 0)` | **Không (NOT NULL)** | - | - |  |
| `status` | `nvarchar(50)` | **Không (NOT NULL)** | `('Pending')` | - |  |
| `paymentMethod` | `nvarchar(50)` | **Không (NOT NULL)** | `('Sepay')` | - |  |
| `paymentStatus` | `nvarchar(50)` | **Không (NOT NULL)** | `('Unpaid')` | - |  |
| `createdAt` | `datetime` | **Không (NOT NULL)** | `(getdate())` | - |  |
| `updatedAt` | `datetime` | **Không (NOT NULL)** | `(getdate())` | - |  |
| `discountAmount` | `decimal(18, 2)` | Có (NULL) | `((0))` | - |  |
| `couponCode` | `nvarchar(50)` | Có (NULL) | - | - |  |
| `cancelReason` | `nvarchar(500)` | Có (NULL) | - | - |  |
| `walletAmountUsed` | `decimal(18, 0)` | Có (NULL) | `((0))` | - |  |
| `refundStatus` | `nvarchar(50)` | Có (NULL) | `('None')` | - |  |
| `groupCode` | `nvarchar(50)` | Có (NULL) | - | - |  |
| `shippingFee` | `decimal(18, 0)` | Có (NULL) | `((0))` | - |  |

---

## Bảng `Payments`

- **Mô tả:** Giao dịch thanh toán (VietQR/Sepay, Tiền mặt, Số tiền, Trạng thái)
- **Số dòng hiện tại:** `0` dòng
- **Khóa chính (PK):** `id`
- **Khóa ngoại (FK):**
  - `orderId` ➔ `Orders(id)` (FK__Payments__orderI__68487DD7)

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Identity (Auto-Inc) | Ghi chú |
|---|---|---|---|---|---|
| `id` | `int` | **Không (NOT NULL)** | - | Có | **PK** |
| `orderId` | `int` | **Không (NOT NULL)** | - | - | FK ➔ Orders |
| `transactionId` | `nvarchar(100)` | Có (NULL) | - | - |  |
| `referenceCode` | `nvarchar(100)` | **Không (NOT NULL)** | - | - |  |
| `amount` | `decimal(18, 0)` | **Không (NOT NULL)** | - | - |  |
| `bankAccount` | `nvarchar(50)` | Có (NULL) | - | - |  |
| `bankCode` | `nvarchar(50)` | Có (NULL) | - | - |  |
| `status` | `nvarchar(50)` | **Không (NOT NULL)** | `('Pending')` | - |  |
| `paidAt` | `datetime` | Có (NULL) | - | - |  |
| `createdAt` | `datetime` | **Không (NOT NULL)** | `(getdate())` | - |  |

---

## Bảng `Products`

- **Mô tả:** Danh sách món ăn, giá tiền, hình ảnh, toppings, đánh giá
- **Số dòng hiện tại:** `73` dòng
- **Khóa chính (PK):** `id`
- **Khóa ngoại (FK):**
  - `categoryId` ➔ `Categories(id)` (FK__Products__catego__5535A963)

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Identity (Auto-Inc) | Ghi chú |
|---|---|---|---|---|---|
| `id` | `int` | **Không (NOT NULL)** | - | Có | **PK** |
| `categoryId` | `int` | **Không (NOT NULL)** | - | - | FK ➔ Categories |
| `name` | `nvarchar(150)` | **Không (NOT NULL)** | - | - |  |
| `slug` | `nvarchar(150)` | **Không (NOT NULL)** | - | - |  |
| `description` | `nvarchar(MAX)` | Có (NULL) | - | - |  |
| `price` | `decimal(18, 0)` | **Không (NOT NULL)** | - | - |  |
| `image` | `nvarchar(500)` | **Không (NOT NULL)** | - | - |  |
| `isAvailable` | `bit` | **Không (NOT NULL)** | `((1))` | - |  |
| `isFeatured` | `bit` | **Không (NOT NULL)** | `((0))` | - |  |
| `rating` | `decimal(3, 1)` | **Không (NOT NULL)** | `((5.0))` | - |  |
| `createdAt` | `datetime` | **Không (NOT NULL)** | `(getdate())` | - |  |
| `toppings` | `nvarchar(MAX)` | Có (NULL) | - | - |  |
| `prepTime` | `int` | Có (NULL) | `((15))` | - |  |

---

## Bảng `Reviews`

- **Mô tả:** Đánh giá & nhận xét của khách hàng cho từng món ăn
- **Số dòng hiện tại:** `0` dòng
- **Khóa chính (PK):** `id`
- **Khóa ngoại (FK):**
  - `productId` ➔ `Products(id)` (FK__Reviews__product__6D0D32F4)
  - `userId` ➔ `Users(id)` (FK__Reviews__userId__6E01572D)

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Identity (Auto-Inc) | Ghi chú |
|---|---|---|---|---|---|
| `id` | `int` | **Không (NOT NULL)** | - | Có | **PK** |
| `productId` | `int` | **Không (NOT NULL)** | - | - | FK ➔ Products |
| `userId` | `int` | Có (NULL) | - | - | FK ➔ Users |
| `customerName` | `nvarchar(100)` | **Không (NOT NULL)** | - | - |  |
| `rating` | `int` | **Không (NOT NULL)** | - | - |  |
| `comment` | `nvarchar(MAX)` | **Không (NOT NULL)** | - | - |  |
| `orderCode` | `nvarchar(50)` | Có (NULL) | - | - |  |
| `createdAt` | `datetime` | **Không (NOT NULL)** | `(getdate())` | - |  |

---

## Bảng `SupportMessages`

- **Mô tả:** Tin nhắn hỗ trợ trực tuyến giữa khách hàng và Admin theo mã đơn
- **Số dòng hiện tại:** `8` dòng
- **Khóa chính (PK):** `id`
- **Khóa ngoại (FK):**
  - `userId` ➔ `Users(id)` (FK__SupportMe__userI__72C60C4A)

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Identity (Auto-Inc) | Ghi chú |
|---|---|---|---|---|---|
| `id` | `int` | **Không (NOT NULL)** | - | Có | **PK** |
| `orderCode` | `nvarchar(50)` | Có (NULL) | - | - |  |
| `userId` | `int` | Có (NULL) | - | - | FK ➔ Users |
| `senderRole` | `nvarchar(20)` | **Không (NOT NULL)** | - | - |  |
| `senderName` | `nvarchar(100)` | **Không (NOT NULL)** | - | - |  |
| `message` | `nvarchar(MAX)` | **Không (NOT NULL)** | - | - |  |
| `isComplaint` | `bit` | **Không (NOT NULL)** | `((0))` | - |  |
| `status` | `nvarchar(30)` | **Không (NOT NULL)** | `('open')` | - |  |
| `createdAt` | `datetime` | **Không (NOT NULL)** | `(getdate())` | - |  |

---

## 🗄️ Bảng `Users`

- **Mô tả:** Tài khoản người dùng & Admin, mật khẩu băm, ví tiền (walletBalance)
- **Số dòng hiện tại:** `8` dòng
- **Khóa chính (PK):** `id`

| Tên cột | Kiểu dữ liệu | Nullable | Mặc định | Identity (Auto-Inc) | Ghi chú |
|---|---|---|---|---|---|
| `id` | `int` | **Không (NOT NULL)** | - | Có | **PK** |
| `username` | `nvarchar(50)` | **Không (NOT NULL)** | - | - |  |
| `password` | `nvarchar(255)` | **Không (NOT NULL)** | - | - |  |
| `fullName` | `nvarchar(100)` | **Không (NOT NULL)** | - | - |  |
| `email` | `nvarchar(100)` | Có (NULL) | - | - |  |
| `phone` | `nvarchar(20)` | Có (NULL) | - | - |  |
| `address` | `nvarchar(255)` | Có (NULL) | - | - |  |
| `role` | `nvarchar(20)` | **Không (NOT NULL)** | `('customer')` | - |  |
| `createdAt` | `datetime` | **Không (NOT NULL)** | `(getdate())` | - |  |
| `walletBalance` | `decimal(18, 0)` | Có (NULL) | `((0))` | - |  |

---

