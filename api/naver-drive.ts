import type { IncomingMessage, ServerResponse } from 'http'

/**
 * 네이버 Directions 15 API 프록시 (한국 자동차 경로).
 * 고정 엔드포인트 — [...]path catch-all 라우팅 불안정 문제 방지.
 * 클라이언트: GET /api/naver-drive?start=lng,lat&goal=lng,lat&option=traoptimal
 */
export default async function handler(
  req: IncomingMessage & { query: Record<string, string | string[]> },
  res: ServerResponse
) {
  const queryParams = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    const v = Array.isArray(value) ? value[0] : value
    queryParams.set(key, v)
  }

  const targetUrl = `https://maps.apigw.ntruss.com/map-direction-15/v1/driving?${queryParams}`

  try {
    const naverRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'x-ncp-apigw-api-key-id': process.env.NAVER_CLIENT_ID ?? process.env.VITE_NAVER_CLIENT_ID ?? '',
        'x-ncp-apigw-api-key': process.env.NAVER_CLIENT_SECRET ?? process.env.VITE_NAVER_CLIENT_SECRET ?? '',
        'Content-Type': 'application/json'
      }
    })

    const data = await naverRes.json()
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = naverRes.status
    res.end(JSON.stringify(data))
  } catch (err) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Naver Directions proxy error', detail: String(err) }))
  }
}
