const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const NAVER_BASE = '/api/naver'

/**
 * Google Maps API (Directions, Geocoding) 용 URL 생성.
 * 경로를 ?p= 쿼리 파라미터로 전달해 Vercel 라우팅 충돌 방지.
 */
export function buildGoogleMapsUrl(path: string, params: Record<string, string>): string {
  const { key: _key, ...rest } = params // key는 서버에서 주입하므로 제거
  const search = new URLSearchParams({ p: path.replace(/^\//, ''), ...rest }).toString()
  return `/api/gmap?${search}`
}

export function getApiKey(): string {
  return API_KEY || ''
}

export function getNaverBaseUrl(): string {
  return NAVER_BASE
}
