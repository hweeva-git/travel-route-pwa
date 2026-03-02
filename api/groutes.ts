import type { IncomingMessage, ServerResponse } from 'http'

/** Vercel의 자동 body 파싱 비활성화 — 스트림으로 직접 읽기 위해 필요 */
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
 * Google Routes API POST 프록시.
 * 고정 엔드포인트 — URL에 콜론(:)이 포함된 경로를 Vercel 라우터가 오인식하는 문제 방지.
 * 클라이언트: POST /api/groutes → 서버: POST routes.googleapis.com/directions/v2:computeRoutes
 */
export default async function handler(
  req: IncomingMessage & { query: Record<string, string | string[]> },
  res: ServerResponse
) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Goog-FieldMask')
    res.statusCode = 204
    res.end()
    return
  }

  const fieldMask = req.headers['x-goog-fieldmask'] as string | undefined

  try {
    const body = await readBody(req)

    const apiRes = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
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
    res.end(JSON.stringify({ error: 'Routes API proxy error', detail: String(err) }))
  }
}
