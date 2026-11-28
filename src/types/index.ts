export type UserRole = 'admin' | 'manager' | 'staff' | 'customer';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  role: UserRole;
  branchId?: number | null;
  isActive?: boolean;
  walletBalance?: number;
  token?: string;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string;
  createdAt?: string;
}

export interface ProductTopping {
  id: string | number;
  name: string;
  price: number;
}

export interface Branch {
  id: number;
  code: string;
  name: string;
  shortName: string;
  address: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  openHours: string;
  isDefault?: boolean;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  isAvailable: boolean;
  isFeatured: boolean;
  soldCount?: number;
  rating: number;
  prepTime?: number;
  toppings?: ProductTopping[];
  branchId?: number | null; // null = all branches, 1 = CS1 (120 Yên Lãng), 2 = CS2 (269 Cầu Giấy)
  createdAt?: string;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedToppings?: ProductTopping[];
  note?: string;
  itemPrice: number;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Delivering' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Paid' | 'Failed';
export type PaymentMethod = 'Sepay' | 'COD' | 'Wallet';

export interface OrderItem {
  id?: number;
  orderId?: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  total: number;
  toppings?: string | null;
  selectedToppings?: any[] | null;
  note?: string | null;
}

export interface Order {
  id: number;
  orderCode: string;
  userId?: number | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes?: string | null;
  totalAmount: number;
  shippingFee?: number;
  discountAmount?: number;
  couponCode?: string | null;
  groupCode?: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cancelReason?: string | null;
  walletAmountUsed?: number;
  refundStatus?: 'None' | 'Refunded';
  branchId?: number;
  branchName?: string;
  orderType?: 'online' | 'dinein';
  tableId?: number | null;
  tableName?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface RestaurantTable {
  id: number;
  branchId: number;
  tableNumber: string;
  tableName: string;
  capacity: number;
  qrToken: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AdminLog {
  id: number;
  adminId?: number | null;
  adminName: string;
  adminRole: string;
  branchId?: number | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface Coupon {
  id?: number | string;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  requiresVietQR?: boolean;
  forNewUserOnly?: boolean;
  badge?: string;
  minTier?: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  expiryDate?: string; // Format: YYYY-MM-DD or DD/MM/YYYY
  usageLimit?: number; // Maximum total allowed uses
  usedCount?: number;  // Number of times used so far
  categoryExclusive?: 'all' | 'rice' | 'drinks' | 'best_seller';
  isOneTimeUse?: boolean;
  isActive?: boolean;
  createdAt?: string;
  /** Phân loại voucher: 'food_discount' = giảm giá đồ ăn, 'freeship' = miễn/giảm phí giao hàng */
  couponType?: 'food_discount' | 'freeship';
}

export interface Review {
  id: number;
  productId: number;
  userId?: number | null;
  customerName: string;
  rating: number;
  comment: string;
  orderCode?: string | null;
  createdAt: string;
}

export interface SupportMessage {
  id: number;
  orderCode?: string | null;
  userId?: number | null;
  senderRole: 'customer' | 'admin';
  senderName: string;
  message: string;
  isComplaint: boolean;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface GroupMemberItem {
  id: string;
  productId: number;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  toppings?: string | null;
  selectedToppings?: ProductTopping[];
  note?: string;
  total?: number;
}

export interface GroupMember {
  id: string;
  name: string;
  isHost: boolean;
  userId?: number | null;
  joinedAt: string;
  items: GroupMemberItem[];
}

export interface GroupOrder {
  id?: number;
  code: string;
  hostName: string;
  hostUserId?: number | null;
  status: 'active' | 'locked' | 'completed' | 'cancelled';
  orderCode?: string | null;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
  totalMembers?: number;
  membersWithItemsCount?: number;
  totalQuantity?: number;
  subtotal?: number;
  discountPercentage?: number;
  discountAmount?: number;
  finalTotal?: number;
}

