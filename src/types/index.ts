export interface User {
  id: number;
  username: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  role: 'admin' | 'customer';
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
  id: string;
  name: string;
  price: number;
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
  rating: number;
  toppings?: ProductTopping[];
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
  discountAmount?: number;
  couponCode?: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cancelReason?: string | null;
  walletAmountUsed?: number;
  refundStatus?: 'None' | 'Refunded';
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface Coupon {
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  requiresVietQR?: boolean;
  forNewUserOnly?: boolean;
  badge?: string;
  minTier?: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
}

export interface PaymentRecord {
  id?: number;
  orderId: number;
  transactionId?: string;
  referenceCode: string;
  amount: number;
  bankAccount?: string;
  bankCode?: string;
  status: 'Pending' | 'Success' | 'Failed';
  paidAt?: string;
}

export interface SepayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount?: string;
  code?: string;
  content: string;
  transferType: 'in' | 'out';
  description?: string;
  transferAmount: number;
  referenceCode?: string;
  accumulated?: number;
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

