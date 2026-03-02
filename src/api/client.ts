const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const MAPS_BASE = import.meta.env.DEV ? '/api/google' : 'https://maps.googleapis.com'
const PLACES_BASE = import.meta.env.DEV ? '/api/places' : 'https://places.googleapis.com'
const ROUTES_BASE = import.meta.env.DEV ? '/api/routes' : 'https://routes.googleapis.com'
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
