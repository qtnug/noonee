import { Branch } from '@/types';

export const BRANCHES: Branch[] = [
  {
    id: 1,
    code: 'cs1-yenlang',
    name: 'NooNee - Cơ sở 120 Yên Lãng',
    shortName: '120 Yên Lãng',
    address: '120 Yên Lãng, Đống Đa, Hà Nội',
    district: 'Đống Đa',
    city: 'Hà Nội',
    lat: 21.011467,
    lng: 105.816642,
    phone: '0943 190 609',
    openHours: '08:00 - 22:30',
    isDefault: true,
  },
  {
    id: 2,
    code: 'cs2-caugiay',
    name: 'NooNee - Cơ sở 269 Cầu Giấy',
    shortName: '269 Cầu Giấy',
    address: '269 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội',
    district: 'Cầu Giấy',
    city: 'Hà Nội',
    lat: 21.03452,
    lng: 105.79785,
    phone: '0943 190 609',
    openHours: '08:00 - 22:30',
  },
];

export function getBranchById(id?: number | string | null): Branch {
  if (!id) return BRANCHES[0];
  const numId = Number(id);
  const found = BRANCHES.find((b) => b.id === numId);
  return found || BRANCHES[0];
}

/**
 * Standard Haversine formula to compute great-circle distance in km (road-adjusted)
 */
export function calculateBranchDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDist = R * c;
  // Multiply by 1.35 factor to reflect real Hanoi road routing
  return Math.round(straightDist * 1.35 * 10) / 10;
}

/**
 * Given user coordinates, determine the nearest branch and distance
 */
export function findNearestBranch(userLat: number, userLng: number): {
  nearestBranch: Branch;
  distances: { branch: Branch; distanceKm: number }[];
} {
  const distances = BRANCHES.map((b) => ({
    branch: b,
    distanceKm: calculateBranchDistanceKm(userLat, userLng, b.lat, b.lng),
  })).sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    nearestBranch: distances[0].branch,
    distances,
  };
}

