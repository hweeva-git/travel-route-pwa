import type { IncomingMessage, ServerResponse } from 'http'

export const config = { api: { bodyParser: false } }

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

/**
 * Places API autocomplete POST 프록시.
 * 고정 엔드포인트 — URL 콜론(:autocomplete) 라우팅 문제 방지.
 */
export default async function handler(
  req: IncomingMessage & { query: Record<string, string | string[]> },
  res: ServerResponse
) {
  const fieldMask = req.headers['x-goog-fieldmask'] as string | undefined

  try {
    const body = await readBody(req)

    const apiRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
        ...(fieldMask ? { 'X-Goog-FieldMask': fieldMask } : {})
      },
      body: body.length > 0 ? body : undefined
    })

    const data = await apiRes.json()
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = apiRes.status
    res.end(JSON.stringify(data))
  } catch (err) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Places autocomplete proxy error', detail: String(err) }))
  }
}
