import { buildGoogleMapsUrl, getApiKey } from './client'

export interface DirectionsLeg {
  distanceMeters: number
  durationMinutes: number
  steps?: Array<{ instruction: string; transitLine?: string }>
}

/**
 * 대중교통 departure_time 계산.
 * 9 AM JST = 0 AM UTC (JST = UTC+9).
 * 새벽(JST 0~5시)에는 전철이 없으므로 다음 "0:00 UTC"(= 9:00 JST)를 반환.
 */
function getDepartureTimestamp(): string {
  const nowMs = Date.now()
  const jstHour = (new Date().getUTCHours() + 9) % 24

  if (jstHour >= 5) {
    return String(Math.floor(nowMs / 1000))
  }

  // 새벽: 다음 0:00 UTC(= 9:00 JST)를 찾는다
  const utcMidnight = new Date(nowMs)
  utcMidnight.setUTCHours(0, 0, 0, 0)
  const midnightMs = utcMidnight.getTime()

  // 오늘 0:00 UTC가 이미 지났으면 내일 0:00 UTC 사용
  const targetMs = midnightMs > nowMs ? midnightMs : midnightMs + 86400000
  return String(Math.floor(targetMs / 1000))
}

export async function fetchTransitDirections(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<DirectionsLeg | null> {
  if (!getApiKey()) return null

  const url = buildGoogleMapsUrl('/maps/api/directions/json', {
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: 'transit',
    departure_time: getDepartureTimestamp(),
    key: getApiKey(),
    language: 'ko'
  })
  const res = await fetch(url, { referrerPolicy: 'no-referrer' })
  let data: { status?: string; error_message?: string; routes?: unknown[] }
  try {
    data = await res.json()
  } catch {
    console.warn('[Directions API transit] JSON 파싱 실패, status:', res.status)
    return null
  }

  if (data.status !== 'OK') {
    console.warn('[Directions API transit] status:', data.status, data.error_message ?? '')
    return null
  }
  const routes = data.routes as Array<{ legs?: Array<{ distance?: { value: number }; duration?: { value: number }; steps?: unknown[] }> }>
  if (!routes?.[0]?.legs?.[0]) return null

  const leg = routes[0].legs![0]
  const steps = ((leg.steps ?? []) as Array<{ html_instructions?: string; transit_details?: { line?: { short_name?: string; name?: string } } }>).map((s) => ({
    instruction: (s.html_instructions || '').replace(/<[^>]*>/g, '').trim(),
    transitLine: s.transit_details?.line?.short_name || s.transit_details?.line?.name
  }))

  return {
    distanceMeters: leg.distance?.value ?? 0,
    durationMinutes: Math.round((leg.duration?.value ?? 0) / 60),
    steps
  }
}

export async function fetchDrivingDirections(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<DirectionsLeg | null> {
  if (!getApiKey()) return null

  try {
    const url = buildGoogleMapsUrl('/maps/api/directions/json', {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: 'driving',
      key: getApiKey(),
      language: 'ko'
    })
    const res = await fetch(url, { referrerPolicy: 'no-referrer' })
    const data = await res.json()
    if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]) return null

    const leg = data.routes[0].legs[0]
    return {
      distanceMeters: leg.distance?.value ?? 0,
      durationMinutes: Math.round((leg.duration?.value ?? 0) / 60),
      steps: (leg.steps || []).map((s: { html_instructions?: string }) => ({
        instruction: (s.html_instructions || '').replace(/<[^>]*>/g, '').trim(),
        transitLine: undefined
      }))
    }
  } catch (e) {
    console.warn('[Directions API driving] 요청 실패:', e)
    return null
  }
}

export async function fetchWalkingDirections(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<DirectionsLeg | null> {
  if (!getApiKey()) return null

  try {
    const url = buildGoogleMapsUrl('/maps/api/directions/json', {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: 'walking',
      key: getApiKey(),
      language: 'ko'
    })
    const res = await fetch(url, { referrerPolicy: 'no-referrer' })
    const data = await res.json()
    if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]) return null

    const leg = data.routes[0].legs[0]
    return {
      distanceMeters: leg.distance?.value ?? 0,
      durationMinutes: Math.round((leg.duration?.value ?? 0) / 60),
      steps: (leg.steps || []).map((s: { html_instructions?: string }) => ({
        instruction: (s.html_instructions || '').replace(/<[^>]*>/g, '').trim(),
        transitLine: undefined
      }))
    }
  } catch (e) {
    console.warn('[Directions API walking] 요청 실패:', e)
    return null
  }
}
