import type { IncomingMessage, ServerResponse } from 'http'

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(
  req: IncomingMessage & { query: Record<string, string | string[]> },
  res: ServerResponse
) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Goog-Api-Key, X-Goog-FieldMask')
    res.statusCode = 204
    res.end()
    return
  }

  const pathSegments = req.query.path
  const pathStr = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments ?? ''

  const targetUrl = `https://routes.googleapis.com/${pathStr}`

  try {
    const body = req.method === 'POST' ? await readBody(req) : undefined
    const fieldMask = req.headers['x-goog-fieldmask'] as string | undefined

    const apiRes = await fetch(targetUrl, {
      method: req.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
        ...(fieldMask ? { 'X-Goog-FieldMask': fieldMask } : {})
      },
      body: body && body.length > 0 ? body : undefined
    })

    const data = await apiRes.json()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.statusCode = apiRes.status
    res.end(JSON.stringify(data))
  } catch (err) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Routes API proxy error', detail: String(err) }))
  }
}
