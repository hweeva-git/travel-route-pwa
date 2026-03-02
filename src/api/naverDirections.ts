export interface NaverDrivingResult {
  distanceMeters: number
  durationMinutes: number
  taxiFare?: number  // 네이버 API가 직접 제공하는 실제 택시 요금 (원)
}

/**
 * 네이버 Directions 15 API — 자동차 경로 (한국 전용).
 * Google Directions API가 한국 driving을 법적으로 지원하지 않으므로 대체 사용.
 * 참고: https://api.ncloud-docs.com/docs/ai-naver-mapsdirections15-driving
 */
export async function fetchNaverDrivingDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<NaverDrivingResult | null> {
  // 네이버 API는 경도,위도 순서 (lng,lat)
  const params = new URLSearchParams({
    start: `${origin.lng},${origin.lat}`,
    goal: `${destination.lng},${destination.lat}`,
    option: 'traoptimal'
  })

  const url = `/api/naver-drive?${params}`

  try {
    const res = await fetch(url)

    if (!res.ok) {
      console.warn('[Naver Directions] HTTP 오류:', res.status, await res.text().catch(() => ''))
      return null
    }

    const data = await res.json()
    const route = data?.route?.traoptimal?.[0]
    if (!route?.summary) {
      console.warn('[Naver Directions] 경로 없음:', JSON.stringify(data?.message ?? data?.code ?? ''))
      return null
    }

    return {
      distanceMeters: route.summary.distance,                     // 단위: m
      durationMinutes: Math.round(route.summary.duration / 60000),// 단위: ms → 분
      taxiFare: route.summary.taxiFare ?? undefined               // 네이버 제공 실제 택시 요금
    }
  } catch (e) {
    console.warn('[Naver Directions] 요청 실패:', e)
    return null
  }
}
