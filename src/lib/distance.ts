/** 두 좌표 간 Haversine 직선거리 (km) */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** 한국 좌표 범위 (위도 33~39°N, 경도 124~132°E) */
export function isKoreaCoordinate(lat: number, lng: number): boolean {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132
}

/**
 * 한국 도보 경로 추정 (Google/네이버 API 모두 walking 미지원).
 * 직선거리 × 1.2(도보 도로계수), 평균 5 km/h 가정.
 */
export function estimateKoreaWalk(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): { distanceKm: number; durationMinutes: number } {
  const straightKm = haversineKm(from.lat, from.lng, to.lat, to.lng)
  const distanceKm = Math.round(straightKm * 1.2 * 10) / 10
  const durationMinutes = Math.round((distanceKm / 5) * 60)
  return { distanceKm, durationMinutes }
}

/**
 * 한국 자동차 경로 추정 (Google Maps가 한국 driving을 법적으로 지원하지 않으므로 fallback).
 * 네이버 Directions API 실패 시에만 사용. 직선거리 × 1.3(도로계수), 평균 30 km/h 가정.
 */
export function estimateKoreaDrive(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): { distanceKm: number; durationMinutes: number } {
  const straightKm = haversineKm(from.lat, from.lng, to.lat, to.lng)
  const distanceKm = Math.round(straightKm * 1.3 * 10) / 10
  const durationMinutes = Math.round((distanceKm / 30) * 60)
  return { distanceKm, durationMinutes }
}
