import type { IncomingMessage, ServerResponse } from 'http'

/**
 * Google Maps API GET 프록시 (Directions, Geocoding).
 * 경로를 URL path가 아닌 ?p= 쿼리 파라미터로 받아 Vercel 라우팅 충돌 방지.
 * 예: /api/gmap?p=maps/api/directions/json&origin=...&mode=driving
 */
export default async function handler(
  req: IncomingMessage & { query: Record<string, string | string[]> },
  res: ServerResponse
) {
  const p = (Array.isArray(req.query.p) ? req.query.p[0] : req.query.p) ?? ''

  const queryParams = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'p') continue
    if (key === 'key') continue // 클라이언트 key 제거, 서버에서 주입
    const v = Array.isArray(value) ? value[0] : value
    queryParams.set(key, v)
  }
  queryParams.set('key', process.env.VITE_GOOGLE_MAPS_API_KEY ?? '')

  const targetUrl = `https://maps.googleapis.com/${p}?${queryParams}`

  try {
    const apiRes = await fetch(targetUrl)
    const data = await apiRes.json()
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = apiRes.status
    res.end(JSON.stringify(data))
  } catch (err) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Google Maps proxy error', detail: String(err) }))
  }
}
