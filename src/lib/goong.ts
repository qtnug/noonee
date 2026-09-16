// Goong.io Map & Distance Service for NooNee Food

export const STORE_ADDRESS = '120 Yên Lãng, Đống Đa, Hà Nội';
export const STORE_NAME = 'Quán Ăn NooNee (Cơ sở 120 Yên Lãng)';

// Exact coordinates for 120 Yên Lãng, Thịnh Quang, Đống Đa, Hà Nội
export const STORE_COORDINATES = {
  lat: 21.011467,
  lng: 105.816642,
};

export interface GoongPrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface DistanceCalculationResult {
  storeAddress: string;
  customerAddress: string;
  distanceKm: number;
  distanceText: string;
  durationMinutes: number;
  durationText: string;
  deliveryEstimateText: string;
  shippingFee: number;
  isSimulated?: boolean;
}

// Fallback popular landmarks in Hanoi when API key is missing or offline
const FALLBACK_HANOI_PLACES: { name: string; address: string; lat: number; lng: number }[] = [
  { name: '120 Phố Yên Lãng', address: '120 Yên Lãng, Thịnh Quang, Đống Đa, Hà Nội', lat: 21.011467, lng: 105.816642 },
  { name: 'Đại học Thủy Lợi', address: '175 Tây Sơn, Trung Liệt, Đống Đa, Hà Nội', lat: 21.0076, lng: 105.8236 },
  { name: 'Đại học Công Đoàn', address: '169 Tây Sơn, Quang Trung, Đống Đa, Hà Nội', lat: 21.0089, lng: 105.8247 },
  { name: 'Vincom Center Phạm Ngọc Thạch', address: '02 Phạm Ngọc Thạch, Kim Liên, Đống Đa, Hà Nội', lat: 21.0072, lng: 105.8327 },
  { name: 'Hồ Hoàng Cầu', address: 'Hoàng Cầu, Ô Chợ Dừa, Đống Đa, Hà Nội', lat: 21.0182, lng: 105.8217 },
  { name: 'Đường Láng Hạ', address: 'Láng Hạ, Đống Đa, Hà Nội', lat: 21.0163, lng: 105.8144 },
  { name: 'Đường Thái Hà', address: 'Thái Hà, Trung Liệt, Đống Đa, Hà Nội', lat: 21.0124, lng: 105.8202 },
  { name: 'Đường Chùa Bộc', address: 'Chùa Bộc, Quang Trung, Đống Đa, Hà Nội', lat: 21.0078, lng: 105.8286 },
  { name: 'Royal City', address: '72A Nguyễn Trãi, Thượng Đình, Thanh Xuân, Hà Nội', lat: 20.9998, lng: 105.8152 },
  { name: 'Keangnam Landmark 72', address: 'Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội', lat: 21.0173, lng: 105.7838 },
  { name: 'Hồ Hoàn Kiếm (Phố Đi Bộ)', address: 'Hàng Trống, Hoàn Kiếm, Hà Nội', lat: 21.0285, lng: 105.8542 },
  { name: 'Đại học Bách Khoa Hà Nội', address: 'Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội', lat: 21.0056, lng: 105.8433 },
  { name: 'Đại học Quốc Gia Hà Nội', address: '144 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội', lat: 21.0368, lng: 105.7824 },
  { name: 'Lotte Center Hà Nội', address: '54 Liễu Giai, Cống Vị, Ba Đình, Hà Nội', lat: 21.0319, lng: 105.8126 },
  { name: 'Times City', address: '458 Minh Khai, Vĩnh Tuy, Hai Bà Trưng, Hà Nội', lat: 20.9954, lng: 105.8672 },
];

/**
 * Standard Haversine formula to compute great-circle distance between two coordinates in km
 */
export function calculateHaversineDistance(
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
  // Multiply by 1.35 factor to reflect real Hanoi road routing (streets, turns, alleys)
  return Math.round(straightDist * 1.35 * 10) / 10;
}

/**
 * Calculate standard delivery shipping fee based on distance in kilometers
 * - Under or equal to 2 km: 15,000 ₫ (base store fee)
 * - From 2 km to 10 km: 15,000 ₫ + 5,000 ₫/km for extra distance
 * - Above 10 km: 55,000 ₫ (first 10km) + 7,000 ₫/km for extra distance
 */
export function calculateShippingFeeByKm(distanceKm: number): number {
  const d = Math.max(0.1, distanceKm);
  if (d <= 2) {
    return 15000;
  }
  if (d <= 10) {
    const extraKm = d - 2;
    const fee = 15000 + extraKm * 5000;
    return Math.round(fee / 1000) * 1000;
  }
  const extraKm = d - 10;
  const fee = 55000 + extraKm * 7000;
  return Math.round(fee / 1000) * 1000;
}

/**
 * Get Goong API Key from environment
 */
export function getGoongApiKey(): string {
  return (
    process.env.GOONG_API_KEY || ''
  ).trim();
}

/**
 * Query Goong AutoComplete API
 */
export async function searchGoongPlaces(input: string): Promise<GoongPrediction[]> {
  const query = (input || '').trim();
  if (!query) return [];

  const apiKey = getGoongApiKey();

  if (apiKey) {
    try {
      // Focus bias around Hanoi center (Yên Lãng coordinates)
      const url = `https://rsapi.goong.io/Place/AutoComplete?api_key=${apiKey}&input=${encodeURIComponent(
        query
      )}&location=${STORE_COORDINATES.lat},${STORE_COORDINATES.lng}&limit=7`;

      const res = await fetch(url, { next: { revalidate: 60 } });
      const data = await res.json();

      if (data.status === 'OK' && Array.isArray(data.predictions)) {
        return data.predictions.map((p: any) => ({
          place_id: p.place_id,
          description: p.description,
          main_text: p.structured_formatting?.main_text || p.description,
          secondary_text: p.structured_formatting?.secondary_text || '',
        }));
      }
    } catch (err) {
      console.warn('Goong AutoComplete API error, using intelligent fallback:', err);
    }
  }

  // Fallback matching from local Hanoi places dictionary
  const qLower = query.toLowerCase();
  const matched = FALLBACK_HANOI_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(qLower) ||
      p.address.toLowerCase().includes(qLower)
  ).slice(0, 6);

  if (matched.length > 0) {
    return matched.map((p, idx) => ({
      place_id: `fallback_${idx}_${p.lat}_${p.lng}`,
      description: p.address,
      main_text: p.name,
      secondary_text: p.address,
    }));
  }

  // Generic Hanoi query fallback
  return [
    {
      place_id: `custom_${Date.now()}`,
      description: `${query}, Hà Nội, Việt Nam`,
      main_text: query,
      secondary_text: 'Hà Nội, Việt Nam',
    },
  ];
}

/**
 * Query Goong Place Detail API to get coordinates
 */
export async function getGoongPlaceDetail(
  placeId: string
): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  if (placeId.startsWith('fallback_')) {
    const parts = placeId.split('_');
    const lat = parseFloat(parts[2]);
    const lng = parseFloat(parts[3]);
    const found = FALLBACK_HANOI_PLACES.find((p) => p.lat === lat && p.lng === lng);
    return {
      lat: lat || STORE_COORDINATES.lat,
      lng: lng || STORE_COORDINATES.lng,
      formattedAddress: found?.address || STORE_ADDRESS,
    };
  }

  const apiKey = getGoongApiKey();
  if (apiKey) {
    try {
      const url = `https://rsapi.goong.io/Place/Detail?place_id=${placeId}&api_key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.result?.geometry?.location) {
        return {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
          formattedAddress: data.result.formatted_address || data.result.name,
        };
      }
    } catch (err) {
      console.warn('Goong Place Detail error:', err);
    }
  }

  return null;
}

/**
 * Calculate distance, delivery time, and shipping fee from 120 Yên Lãng to destination
 */
export async function calculateDistanceFromStore(params: {
  placeId?: string;
  address?: string;
  lat?: number;
  lng?: number;
}): Promise<DistanceCalculationResult> {
  const apiKey = getGoongApiKey();
  let destLat = params.lat;
  let destLng = params.lng;
  let destAddress = params.address || '';

  // 1. Resolve coordinates if placeId is given
  if (params.placeId && (!destLat || !destLng)) {
    const detail = await getGoongPlaceDetail(params.placeId);
    if (detail) {
      destLat = detail.lat;
      destLng = detail.lng;
      if (!destAddress) destAddress = detail.formattedAddress;
    }
  }

  // 2. Resolve coordinates by geocoding address if needed
  if ((!destLat || !destLng) && destAddress && apiKey) {
    try {
      const geoUrl = `https://rsapi.goong.io/Geocode?address=${encodeURIComponent(
        destAddress
      )}&api_key=${apiKey}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      if (geoData.status === 'OK' && geoData.results?.[0]?.geometry?.location) {
        destLat = geoData.results[0].geometry.location.lat;
        destLng = geoData.results[0].geometry.location.lng;
      }
    } catch (e) {}
  }

  // If still not resolved, check fallback places or estimate based on district name
  if (!destLat || !destLng) {
    const addrLower = (destAddress || '').toLowerCase();
    const matched = FALLBACK_HANOI_PLACES.find(
      (p) =>
        addrLower.includes(p.name.toLowerCase()) ||
        addrLower.includes(p.address.toLowerCase())
    );

    if (matched) {
      destLat = matched.lat;
      destLng = matched.lng;
    } else if (addrLower.includes('đống đa')) {
      destLat = 21.015;
      destLng = 105.825;
    } else if (addrLower.includes('thanh xuân')) {
      destLat = 20.995;
      destLng = 105.812;
    } else if (addrLower.includes('cầu giấy')) {
      destLat = 21.031;
      destLng = 105.795;
    } else if (addrLower.includes('ba đình')) {
      destLat = 21.035;
      destLng = 105.825;
    } else if (addrLower.includes('hoàn kiếm')) {
      destLat = 21.028;
      destLng = 105.854;
    } else if (addrLower.includes('hai bà trưng')) {
      destLat = 21.006;
      destLng = 105.855;
    } else {
      // Default to 3.5 km average city trip in Hanoi
      destLat = 21.025;
      destLng = 105.835;
    }
  }

  // 3. Try Goong Distance Matrix API for real bike driving distance
  if (apiKey && destLat && destLng) {
    try {
      const dmUrl = `https://rsapi.goong.io/DistanceMatrix?origins=${STORE_COORDINATES.lat},${STORE_COORDINATES.lng}&destinations=${destLat},${destLng}&vehicle=bike&api_key=${apiKey}`;
      const res = await fetch(dmUrl);
      const data = await res.json();

      if (
        data.rows &&
        data.rows[0]?.elements &&
        data.rows[0].elements[0]?.status === 'OK'
      ) {
        const elem = data.rows[0].elements[0];
        const meters = elem.distance?.value || 3000;
        const seconds = elem.duration?.value || 720;
        const distanceKm = Math.round((meters / 1000) * 10) / 10;
        const durationMinutes = Math.max(5, Math.round(seconds / 60));
        const shippingFee = calculateShippingFeeByKm(distanceKm);

        // Prep time (10-15m) + transit time
        const totalMin = durationMinutes + 12;
        const deliveryEstimateText = `${totalMin - 5} - ${totalMin + 5} phút`;

        return {
          storeAddress: STORE_ADDRESS,
          customerAddress: destAddress || `${distanceKm} km từ 120 Yên Lãng`,
          distanceKm,
          distanceText: `${distanceKm} km`,
          durationMinutes,
          durationText: `${durationMinutes} phút`,
          deliveryEstimateText,
          shippingFee,
          isSimulated: false,
        };
      }
    } catch (err) {
      console.warn('Goong Distance Matrix API error, calculating via coordinates:', err);
    }
  }

  // 4. Fallback calculation using coordinates
  const distanceKm = calculateHaversineDistance(
    STORE_COORDINATES.lat,
    STORE_COORDINATES.lng,
    destLat,
    destLng
  );
  // Average motorbike speed in Hanoi: ~20 km/h -> 3 mins/km
  const durationMinutes = Math.max(5, Math.round(distanceKm * 3));
  const shippingFee = calculateShippingFeeByKm(distanceKm);
  const totalMin = durationMinutes + 12;
  const deliveryEstimateText = `${totalMin - 5} - ${totalMin + 5} phút`;

  return {
    storeAddress: STORE_ADDRESS,
    customerAddress: destAddress || `${distanceKm} km từ 120 Yên Lãng`,
    distanceKm,
    distanceText: `${distanceKm} km`,
    durationMinutes,
    durationText: `${durationMinutes} phút`,
    deliveryEstimateText,
    shippingFee,
    isSimulated: true,
  };
}
