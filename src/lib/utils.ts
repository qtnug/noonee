import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return String(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function generateSlug(name: string): string {
  return removeVietnameseTones(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateOrderCode(): string {
  const random8Digits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `NOONEE${random8Digits}`;
}

export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '***';
  const cleaned = String(phone).trim();
  if (cleaned.length <= 4) return '****';
  if (cleaned.length <= 7) {
    return cleaned.slice(0, 2) + '***' + cleaned.slice(-2);
  }
  return cleaned.slice(0, 3) + '****' + cleaned.slice(-3);
}

