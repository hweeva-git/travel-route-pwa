import { useState } from 'react'
import { PlaceSearch } from '../components/PlaceSearch'
import { PlaceCard } from '../components/PlaceCard'
import { geocodeAddress } from '../api/geocode'
import type { Place } from '../types'

interface PlaceListPageProps {
  places: Place[]
  onPlacesChange: (places: Place[]) => void
  onNext: () => void
}

export function PlaceListPage({ places, onPlacesChange, onNext }: PlaceListPageProps) {
  const [manualAddress, setManualAddress] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)

  const addPlace = (p: Place) => {
    if (places.some((x) => x.id === p.id)) return
    onPlacesChange([...places, p])
  }

  const addByAddress = async () => {
    if (!manualAddress.trim()) return
    setManualLoading(true)
    setManualError(null)
    try {
      const result = await geocodeAddress(manualAddress)
      if (result) {
        const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`
        addPlace({
          id,
          name: result.name,
          address: result.address,
          lat: result.lat,
          lng: result.lng
        })
        setManualAddress('')
      } else {
        setManualError('입력한 주소로 검색 결과가 없습니다. 주소를 짧게(예: 도로명+번호, 지역명) 입력해 보세요.')
      }
    } catch (e) {
      setManualError(e instanceof Error ? e.message : '검색 중 오류가 발생했습니다.')
    } finally {
      setManualLoading(false)
    }
  }

  const removePlace = (id: string) => {
    onPlacesChange(places.filter((p) => p.id !== id))
  }

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✈️</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>여행 경로 플래너</h1>
        <p style={{ color: '#64748b', marginTop: 6, fontSize: 14 }}>가고 싶은 장소를 추가하면 최적 경로를 계산해 드립니다</p>
      </div>

      {/* 장소 검색 */}
      <div style={{ background: '#ffffff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>🔍 장소 검색</div>
        <PlaceSearch onAdd={addPlace} disabled={false} />
      </div>

      {/* 주소 직접 추가 */}
      <div style={{ background: '#ffffff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>📍 주소로 직접 추가</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => { setManualAddress(e.target.value); setManualError(null) }}
            onKeyDown={(e) => e.key === 'Enter' && addByAddress()}
            placeholder="예: 서울시 강남구 테헤란로 152"
            disabled={manualLoading}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: 15,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              outline: 'none'
            }}
          />
          <button
            type="button"
            onClick={addByAddress}
            disabled={manualLoading || !manualAddress.trim()}
            style={{
              padding: '12px 20px',
              background: manualAddress.trim() ? '#0ea5e9' : '#e2e8f0',
              color: manualAddress.trim() ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: manualAddress.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            {manualLoading ? '검색 중...' : '추가'}
          </button>
        </div>
        {manualError && <div style={{ marginTop: 6, fontSize: 12, color: '#dc2626' }}>{manualError}</div>}
      </div>

      {/* 장소 목록 */}
      {places.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
            📋 추가된 장소 ({places.length}개)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {places.map((p) => (
              <PlaceCard key={p.id} place={p} onRemove={() => removePlace(p.id)} />
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={places.length < 2}
        style={{
          width: '100%',
          padding: 16,
          fontSize: 16,
          fontWeight: 700,
          background: places.length >= 2 ? '#0ea5e9' : '#e2e8f0',
          color: places.length >= 2 ? '#fff' : '#94a3b8',
          border: 'none',
          borderRadius: 10,
          cursor: places.length >= 2 ? 'pointer' : 'not-allowed',
          boxShadow: places.length >= 2 ? '0 2px 8px rgba(14,165,233,0.3)' : 'none'
        }}
      >
        {places.length < 2 ? `장소를 ${2 - places.length}개 더 추가하세요` : `🗺️ 최적 경로 계산하기 (${places.length}개 장소)`}
      </button>
    </div>
  )
}
