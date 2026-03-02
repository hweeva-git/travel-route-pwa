import type { IncomingMessage, ServerResponse } from 'http'

/**
 * Places API place details GET 프록시.
 * placeId를 ?id= 쿼리 파라미터로 받아 places.googleapis.com/v1/places/{placeId} 호출.
 */
export default async function handler(
  req: IncomingMessage & { query: Record<string, string | string[]> },
  res: ServerResponse
) {
  const placeId = (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id) ?? ''
  const fieldMask = req.headers['x-goog-fieldmask'] as string | undefined

  if (!placeId) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'placeId required (?id=...)' }))
    return
  }

  try {
    const apiRes = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
        ...(fieldMask ? { 'X-Goog-FieldMask': fieldMask } : {})
      }
    })

    const data = await apiRes.json()
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = apiRes.status
    res.end(JSON.stringify(data))
  } catch (err) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Places details proxy error', detail: String(err) }))
  }
}
