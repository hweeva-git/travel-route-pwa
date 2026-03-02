import type { IncomingMessage, ServerResponse } from 'http'

export default async function handler(req: IncomingMessage & { query: Record<string, string | string[]> }, res: ServerResponse) {
  // path 배열을 경로 문자열로 재조립
  const pathSegments = req.query.path
  const pathStr = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments ?? ''

  // path 파라미터를 제외한 나머지 쿼리스트링 재조립
  const queryParams = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue
    if (Array.isArray(value)) {
      value.forEach((v) => queryParams.append(key, v))
    } else {
      queryParams.set(key, value)
    }
  }

  const targetUrl = `https://maps.apigw.ntruss.com/${pathStr}?${queryParams.toString()}`

  try {
    const naverRes = await fetch(targetUrl, {
      method: req.method ?? 'GET',
      headers: {
        'x-ncp-apigw-api-key-id': process.env.VITE_NAVER_CLIENT_ID ?? '',
        'x-ncp-apigw-api-key': process.env.VITE_NAVER_CLIENT_SECRET ?? '',
        'Content-Type': 'application/json',
      },
    })

    const data = await naverRes.json()
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = naverRes.status
    res.end(JSON.stringify(data))
  } catch (err) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Naver API proxy error', detail: String(err) }))
  }
}
