import { getApiKey } from './client'
import type { TransitOption } from '../types'

/** Routes API duration string "3600s" -> minutes */
function parseDurationStr(durationStr: string | undefined): number {
  if (!durationStr) return 0
  const sec = parseInt(durationStr, 10)
  return isNaN(sec) ? 0 : Math.round(sec / 60)
}

function buildSummary(
  steps: Array<{ transitLine?: string; travelMode?: string }>
): string {
  const lines = steps
    .filter((s) => s.travelMode === 'TRANSIT' && s.transitLine)
    .map((s) => s.transitLine!)
  return lines.length ? lines.join(' + ') : '대중교통'
}

/**
 * 대중교통 경로 조회 (Routes API).
 * Google 공식 예제 기반 최소 요청으로 안정성 확보.
 */
export async function fetchTransitRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<TransitOption[] | null> {
  const key = getApiKey()
  if (!key) return null

  const url = '/api/groutes'

  // 9 AM JST = 0 AM UTC. 새벽(JST 0~5시)에는 다음 0:00 UTC(= 9:00 JST)를 사용
  const nowMs = Date.now()
  const jstHour = (new Date().getUTCHours() + 9) % 24
  let departureTime: string
  if (jstHour >= 5) {
    departureTime = new Date(nowMs).toISOString()
  } else {
    const utcMidnight = new Date(nowMs)
    utcMidnight.setUTCHours(0, 0, 0, 0)
    const midnightMs = utcMidnight.getTime()
    const targetMs = midnightMs > nowMs ? midnightMs : midnightMs + 86400000
    departureTime = new Date(targetMs).toISOString()
  }

  const body = {
    origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
    destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
    travelMode: 'TRANSIT',
    departureTime: departureTime,
    languageCode: 'ko'
  }

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'routes.duration,routes.legs.duration,routes.legs.steps.travelMode,routes.legs.steps.transitDetails'
      },
      body: JSON.stringify(body),
      referrerPolicy: 'no-referrer'
    })
  } catch (err) {
    console.warn('[Routes API] fetch 실패:', err)
    return null
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    console.warn(`[Routes API] HTTP ${res.status} 오류:`, JSON.stringify(errBody, null, 2))
    return null
  }

  const data = await res.json()
  console.log('[Routes API] 응답 수신:', JSON.stringify(data).slice(0, 600))

  const routes = (data.routes ?? []) as Array<{
    duration?: string
    legs?: Array<{
      duration?: string
      steps?: Array<{
        travelMode?: string
        transitDetails?: {
          transitLine?: { nameShort?: string; name?: string }
          stopDetails?: {
            arrivalStop?: { name?: string }
            departureStop?: { name?: string }
          }
        }
      }>
    }>
  }>

  if (routes.length === 0) {
    console.warn('[Routes API] 경로 없음 (routes 배열 비어있음)')
    return null
  }

  const options: TransitOption[] = []

  for (const route of routes) {
    const leg = route.legs?.[0]
    if (!leg) continue

    const legSteps = leg.steps ?? []
    const steps: Array<{ instruction: string; transitLine?: string; travelMode?: string }> = []

    for (const step of legSteps) {
      const transitLine =
        step.transitDetails?.transitLine?.nameShort ||
        step.transitDetails?.transitLine?.name
      const depStop = step.transitDetails?.stopDetails?.departureStop?.name
      const arrStop = step.transitDetails?.stopDetails?.arrivalStop?.name

      steps.push({
        instruction: transitLine
          ? `${depStop ?? '출발'} → ${arrStop ?? '도착'} (${transitLine})`
          : step.travelMode === 'WALK'
            ? '도보 이동'
            : '이동',
        transitLine,
        travelMode: step.travelMode
      })
    }

    const durationMinutes =
      parseDurationStr(route.duration) || parseDurationStr(leg.duration)

    options.push({
      durationMinutes,
      summary: buildSummary(steps),
      steps: steps.map(({ instruction, transitLine }) => ({ instruction, transitLine }))
    })
  }

  return options.length ? options : null
}
