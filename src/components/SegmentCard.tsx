import { useState } from 'react'
import type { SegmentInfo, TaxiRegion } from '../types'

interface SegmentCardProps {
  segment: SegmentInfo
  index: number
  taxiRegion?: TaxiRegion
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  const min = m % 60
  return min ? `${h}시간 ${min}분` : `${h}시간`
}

export function SegmentCard({ segment, index, taxiRegion = 'default' }: SegmentCardProps) {
  const [tab, setTab] = useState<'transit' | 'taxi' | 'walking'>('transit')
  const [transitOptionIndex, setTransitOptionIndex] = useState(0)

  const isManualId = (id: string) => id.startsWith('manual-')
  const originParam = isManualId(segment.from.id)
    ? `origin=${encodeURIComponent(segment.from.name)}`
    : `origin=${encodeURIComponent(segment.from.name)}&origin_place_id=${segment.from.id}`
  const destParam = isManualId(segment.to.id)
    ? `destination=${encodeURIComponent(segment.to.name)}`
    : `destination=${encodeURIComponent(segment.to.name)}&destination_place_id=${segment.to.id}`

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&${originParam}&${destParam}`
  const mapsTransitUrl = `${mapsUrl}&travelmode=transit`

  const tabs: { key: 'transit' | 'taxi' | 'walking'; label: string }[] = [
    { key: 'transit', label: '🚇 대중교통' },
    { key: 'taxi', label: '🚕 택시' },
    { key: 'walking', label: '🚶 도보' },
  ]

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
      }}
    >
      {/* 구간 헤더 */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        <span style={{ color: '#0ea5e9', fontWeight: 700, fontSize: 13 }}>구간 {index}</span>
        <span style={{ margin: '0 4px', color: '#cbd5e1' }}>›</span>
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{segment.from.name}</span>
        <span style={{ margin: '0 4px', color: '#94a3b8' }}>→</span>
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{segment.to.name}</span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: '#0ea5e9',
            textDecoration: 'none',
            fontWeight: 600,
            background: '#e0f2fe',
            padding: '3px 8px',
            borderRadius: 4
          }}
        >
          경로 보기 ↗
        </a>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: 'none',
              borderBottom: tab === key ? '2px solid #0ea5e9' : '2px solid transparent',
              background: 'transparent',
              color: tab === key ? '#0ea5e9' : '#64748b',
              fontWeight: tab === key ? 700 : 400,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div style={{ padding: 16 }}>
        {tab === 'transit' && (
          <div>
            {segment.transit && segment.transit.options.length > 0 ? (
              <>
                {segment.transit.options.length > 1 ? (
                  <select
                    value={transitOptionIndex}
                    onChange={(e) => setTransitOptionIndex(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: 12,
                      background: '#f8fafc',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  >
                    {segment.transit.options.map((opt, i) => (
                      <option key={i} value={i}>
                        경로 {i + 1}: {opt.summary} ({formatMinutes(opt.durationMinutes)})
                      </option>
                    ))}
                  </select>
                ) : null}
                {(() => {
                  const opt = segment.transit!.options[transitOptionIndex] ?? segment.transit!.options[0]
                  return (
                    <>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#0ea5e9' }}>
                        {formatMinutes(opt.durationMinutes)}
                      </div>
                      {segment.transit!.options.length === 1 && opt.summary !== '대중교통' && (
                        <div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>{opt.summary}</div>
                      )}
                      {segment.transit!.fare != null && (
                        <div style={{ marginTop: 4, color: '#64748b' }}>
                          예상 요금: 약 {segment.transit!.fare.toLocaleString()}원
                        </div>
                      )}
                      {segment.transit!.fare == null && (
                        <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
                          요금 정보 없음 (지역별 차이 있음)
                        </div>
                      )}
                      {opt.steps && opt.steps.length > 0 && (
                        <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 13, color: '#374151' }}>
                          {opt.steps.slice(0, 8).map((s, i) => (
                            <li key={i}>
                              {s.transitLine ? `[${s.transitLine}] ` : ''}
                              {s.instruction}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )
                })()}
              </>
            ) : (
              <div>
                <a
                  href={mapsTransitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px 20px',
                    background: '#0ea5e9',
                    color: '#fff',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 15
                  }}
                >
                  <span style={{ fontSize: 20 }}>🗺️</span>
                  Google Maps에서 대중교통 경로 보기
                </a>
                <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                  일본 대중교통 데이터는 Google Maps 앱에서 확인할 수 있습니다
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'taxi' && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0ea5e9' }}>
              {formatMinutes(segment.taxi.durationMinutes)}
            </div>
            <div style={{ marginTop: 6, color: '#64748b' }}>
              거리: {segment.taxi.distanceKm.toFixed(1)}km
            </div>
            <div style={{ marginTop: 6, fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
              예상 요금: 약{' '}
              {taxiRegion === 'jp'
                ? `¥${segment.taxi.fare.toLocaleString()}`
                : taxiRegion === 'kr'
                  ? `${segment.taxi.fare.toLocaleString()}원`
                  : `${segment.taxi.fare.toLocaleString()} (참고)`}
            </div>
            {segment.taxi.isEstimated && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#f59e0b', background: '#fffbeb', padding: '4px 8px', borderRadius: 4 }}>
                ※ 직선거리 기준 추정값 (Google Maps 한국 자동차 경로 미지원)
              </div>
            )}
            <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
              참고용이며, 실제 요금은 도시·시간대에 따라 다를 수 있습니다.
            </div>
          </div>
        )}

        {tab === 'walking' && (
          <div>
            {segment.walking ? (
              <>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0ea5e9' }}>
                  {formatMinutes(segment.walking.durationMinutes)}
                </div>
                <div style={{ marginTop: 6, color: '#64748b' }}>
                  거리: 약 {segment.walking.distanceKm.toFixed(1)}km
                </div>
                {segment.walking.isEstimated && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#f59e0b', background: '#fffbeb', padding: '4px 8px', borderRadius: 4 }}>
                    ※ 직선거리 기준 추정값 (한국 도보 경로 API 미지원)
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: '#94a3b8' }}>도보 경로 없음</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
