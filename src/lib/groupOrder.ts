import { GroupOrder, GroupMember, GroupMemberItem } from '@/types';

export const MIN_GROUP_MEMBERS = 2;
export const MAX_GROUP_MEMBERS = 10;

/**
 * Calculate group discount according to requirements:
 * - 3 people: 2%
 * - 5 people: 5%
 * - 10 people: 10%
 *
 * Applicable based on number of members in group (or members who selected items)
 */
export function calculateGroupDiscount(memberCount: number): {
  percentage: number;
  tierLabel: string;
  nextTier?: {
    peopleNeeded: number;
    percentage: number;
    targetCount: number;
  };
} {
  if (memberCount >= 10) {
    return {
      percentage: 10,
      tierLabel: 'Giảm 10% (Mức tối đa)',
    };
  }

  if (memberCount >= 5) {
    return {
      percentage: 5,
      tierLabel: 'Giảm 5%',
      nextTier: {
        peopleNeeded: 10 - memberCount,
        percentage: 10,
        targetCount: 10,
      },
    };
  }

  if (memberCount >= 3) {
    return {
      percentage: 2,
      tierLabel: 'Giảm 2%',
      nextTier: {
        peopleNeeded: 5 - memberCount,
        percentage: 5,
        targetCount: 5,
      },
    };
  }

  // Under 3 people
  return {
    percentage: 0,
    tierLabel: memberCount < 2 ? 'Cần tối thiểu 2 người' : 'Thêm 1 người để giảm 2%',
    nextTier: {
      peopleNeeded: Math.max(1, 3 - memberCount),
      percentage: 2,
      targetCount: 3,
    },
  };
}

/**
 * Generate a friendly unique group code, e.g. NN-8392 or GRP-4821
 */
export function generateGroupCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'NN-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Enrich group order with computed stats (subtotal, discount, totals)
 */
export function computeGroupOrderStats(group: GroupOrder): GroupOrder {
  const members = group.members || [];
  const totalMembers = members.length;
  
  // Members who have chosen at least 1 item
  const membersWithItems = members.filter((m) => m.items && m.items.length > 0);
  const membersWithItemsCount = membersWithItems.length;

  let subtotal = 0;
  let totalQuantity = 0;

  for (const m of members) {
    for (const it of m.items || []) {
      subtotal += (it.price || 0) * (it.quantity || 1);
      totalQuantity += it.quantity || 1;
    }
  }

  // Base discount tier on number of participating members
  // If there are members with items, count those; otherwise fallback to joined members
  const countForDiscount = Math.max(membersWithItemsCount, totalMembers);
  const discountInfo = calculateGroupDiscount(countForDiscount);
  const discountPercentage = discountInfo.percentage;
  const discountAmount = Math.round(subtotal * (discountPercentage / 100));
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return {
    ...group,
    totalMembers,
    membersWithItemsCount,
    totalQuantity,
    subtotal,
    discountPercentage,
    discountAmount,
    finalTotal,
  };
}
