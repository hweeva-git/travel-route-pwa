import type { IncomingMessage, ServerResponse } from 'http'

export default async function handler(
  req: IncomingMessage & { query: Record<string, string | string[]> },
  res: ServerResponse
) {
  const pathSegments = req.query.path
  const pathStr = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments ?? ''

  const queryParams = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue
    if (key === 'key') continue // client key 제거, env에서 주입
    if (Array.isArray(value)) {
      value.forEach((v) => queryParams.append(key, v))
    } else {
      queryParams.set(key, value)
    }
  }
  queryParams.set('key', process.env.VITE_GOOGLE_MAPS_API_KEY ?? '')

  const targetUrl = `https://maps.googleapis.com/${pathStr}?${queryParams.toString()}`

  try {
    const apiRes = await fetch(targetUrl, { method: 'GET' })
    const data = await apiRes.json()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.statusCode = apiRes.status
    res.end(JSON.stringify(data))
  } catch (err) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Google Maps API proxy error', detail: String(err) }))
  }
}
