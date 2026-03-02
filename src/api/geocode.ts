import { buildGoogleMapsUrl, getApiKey } from './client'

export interface GeocodeResult {
  name: string
  address: string
  lat: number
  lng: number
}

/** 공백·줄바꿈 정리 (구글 맵에서 복사한 텍스트에 맞춤) */
function normalizeAddress(address: string): string {
  return address.trim().replace(/\s+/g, ' ')
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const normalized = normalizeAddress(address)
  if (!normalized || !getApiKey()) return null

  const url = buildGoogleMapsUrl('/maps/api/geocode/json', {
    address: normalized,
    key: getApiKey(),
    language: 'ko'
  })
  const res = await fetch(url, { referrerPolicy: 'no-referrer' })
  let data: { status?: string; results?: Array<{ formatted_address?: string; geometry?: { location?: { lat: number; lng: number } } }>; error_message?: string }
  try {
    data = await res.json()
  } catch {
    throw new Error('주소 검색 응답을 처리할 수 없습니다. 네트워크를 확인하세요.')
  }

  if (data.status === 'OK' && data.results?.[0]) {
    const r = data.results[0]
    const loc = r.geometry?.location
    return {
      name: r.formatted_address || normalized,
      address: r.formatted_address || normalized,
      lat: loc?.lat ?? 0,
      lng: loc?.lng ?? 0
    }
  }

  if (data.status === 'ZERO_RESULTS') return null
  if (data.status === 'REQUEST_DENIED') {
    throw new Error(data.error_message || 'Geocoding API 접근이 거부되었습니다. API 키와 Geocoding API 사용 설정을 확인하세요.')
  }
  if (data.status === 'OVER_QUERY_LIMIT') {
    throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도하세요.')
  }
  if (!res.ok) {
    throw new Error(data.error_message || `서버 오류 (${res.status})`)
  }
  return null
}
