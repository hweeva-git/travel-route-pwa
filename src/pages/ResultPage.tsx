import { useState, useEffect } from 'react'
import { SegmentCard } from '../components/SegmentCard'
import { fetchTransitDirections, fetchDrivingDirections, fetchWalkingDirections } from '../api/directions'
import { fetchTransitRoute } from '../api/routes'
import { calculateTaxiFare } from '../lib/taxiFare'
import { optimizeRoute } from '../lib/tsp'
import { isKoreaCoordinate, estimateKoreaDrive, estimateKoreaWalk } from '../lib/distance'
import { fetchNaverDrivingDirections } from '../api/naverDirections'
import type { Place, SegmentInfo, TaxiRegion, TransitOption } from '../types'

interface ResultPageProps {
  places: Place[]
  onBack: () => void
}

function inferTaxiRegion(places: Place[]): TaxiRegion {
  // 좌표 기반 우선 감지 (텍스트 매칭보다 정확)
  if (places.some((p) => isKoreaCoordinate(p.lat, p.lng))) return 'kr'
  // 텍스트 보조 감지 (좌표 없는 수동 입력 장소 대비)
  const text = places.map((p) => `${p.name ?? ''} ${p.address ?? ''}`).join(' ').toLowerCase()
  if (/(japan|일본|tokyo|osaka|kyoto|나리타|간사이)/.test(text)) return 'jp'
  if (/(korea|한국|서울|부산|인천|대구|광주|대전|울산|제주)/.test(text)) return 'kr'
  return 'default'
}

function normalizeTransitOptions(
  res: TransitOption[] | import('../api/directions').DirectionsLeg | null
): { options: TransitOption[]; fare?: number } | null {
  if (!res) return null
  if (Array.isArray(res)) return { options: res }
  return {
    options: [{
      durationMinutes: res.durationMinutes,
      summary: '대중교통',
      steps: res.steps || []
    }]
  }
}

export function ResultPage({ places, onBack }: ResultPageProps) {
  const [ordered, setOrdered] = useState<Place[]>([])
  const [segments, setSegments] = useState<SegmentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [region, setRegion] = useState<TaxiRegion>(() => inferTaxiRegion(places))

  useEffect(() => {
    const orderedPlaces = optimizeRoute(places)
    setOrdered(orderedPlaces)
  }, [places])

  useEffect(() => {
    if (ordered.length < 2) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    async function load() {
      const results: SegmentInfo[] = []
      for (let i = 0; i < ordered.length - 1; i++) {
        if (cancelled) return
        const from = ordered[i]
        const to = ordered[i + 1]

        console.log(`[경로 계산] ${from.name}(${from.lat},${from.lng}) → ${to.name}(${to.lat},${to.lng})`)

        const isKorea = isKoreaCoordinate(from.lat, from.lng)

        const [transitRes, driveRes, walkRes] = await Promise.all([
          (async () => {
            const r = await fetchTransitRoute({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng })
            return r ?? await fetchTransitDirections({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng })
          })(),
          isKorea
            ? fetchNaverDrivingDirections({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng })
            : fetchDrivingDirections({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }),
          fetchWalkingDirections({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng })
        ])

        let drive: SegmentInfo['taxi']
        if (driveRes) {
          drive = {
            durationMinutes: driveRes.durationMinutes,
            distanceKm: driveRes.distanceMeters / 1000,
            fare: calculateTaxiFare({
              distanceKm: driveRes.distanceMeters / 1000,
              durationMinutes: driveRes.durationMinutes,
              region
            })
          }
        } else if (isKorea) {
          // 네이버 API 실패 시 Haversine fallback
          const est = estimateKoreaDrive(from, to)
          drive = {
            durationMinutes: est.durationMinutes,
            distanceKm: est.distanceKm,
            fare: calculateTaxiFare({
              distanceKm: est.distanceKm,
              durationMinutes: est.durationMinutes,
              region
            }),
            isEstimated: true
          }
        } else {
          drive = { durationMinutes: 0, distanceKm: 0, fare: 0 }
        }

        const walkData = walkRes
          ? { durationMinutes: walkRes.durationMinutes, distanceKm: walkRes.distanceMeters / 1000 }
          : isKorea
            ? { ...estimateKoreaWalk(from, to), isEstimated: true as const }
            : null

        results.push({
          from,
          to,
          transit: normalizeTransitOptions(transitRes),
          taxi: drive,
          walking: walkData
        })
      }
      if (!cancelled) setSegments(results)
      setLoading(false)
    }

    load().catch((err) => {
      console.error('[경로 계산 오류]', err)
      if (!cancelled) {
        setError('경로 계산 중 오류가 발생했습니다. 다시 시도해 주세요.')
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [ordered, region])

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 8 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '8px 16px',
            background: '#f1f5f9',
            color: '#374151',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          ← 뒤로
        </button>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as TaxiRegion)}
          title="택시 예상 요금 참고용"
          style={{
            padding: '8px 12px',
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 14
          }}
        >
          <option value="jp">🇯🇵 일본 (엔)</option>
          <option value="kr">🇰🇷 한국 (원)</option>
          <option value="default">🌏 기본 (참고용)</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>🗺️ 최적 경로</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          {ordered.map((p, i) => (
            <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                background: '#0ea5e9',
                color: '#fff',
                borderRadius: 20,
                padding: '2px 10px',
                fontSize: 13,
                fontWeight: 600
              }}>{i + 1}. {p.name}</span>
              {i < ordered.length - 1 && <span style={{ color: '#94a3b8', fontSize: 12 }}>→</span>}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✈️</div>
          <div>경로 계산 중...</div>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ color: '#ef4444', marginBottom: 16 }}>{error}</div>
          <button
            type="button"
            onClick={() => { setError(null); setLoading(true); setOrdered([...ordered]) }}
            style={{ padding: '10px 20px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {segments.map((seg, i) => (
            <SegmentCard key={`${seg.from.id}-${seg.to.id}`} segment={seg} index={i + 1} taxiRegion={region} />
          ))}
        </div>
      )}
    </div>
  )
}
