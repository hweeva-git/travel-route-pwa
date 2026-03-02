const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// 항상 서버리스 프록시 경로 사용 (CORS 방지)
const MAPS_BASE = '/api/google'
const PLACES_BASE = '/api/places'
const ROUTES_BASE = '/api/routes'
const NAVER_BASE = '/api/naver'

export function buildGoogleMapsUrl(path: string, params: Record<string, string>): string {
  const search = new URLSearchParams(params).toString()
  return `${MAPS_BASE}${path}?${search}`
}

export function getPlacesBaseUrl(): string {
  return PLACES_BASE
}

export function getRoutesBaseUrl(): string {
  return ROUTES_BASE
}

export function getApiKey(): string {
  return API_KEY || ''
}

export function getNaverBaseUrl(): string {
  return NAVER_BASE
}
