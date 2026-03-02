import type { Place } from '../types'

interface PlaceCardProps {
  place: Place
  index?: number
  onRemove: () => void
}

export function PlaceCard({ place, index, onRemove }: PlaceCardProps) {
  const isManual = place.id.startsWith('manual-')
  const mapsUrl = isManual
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.id}`

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {index != null && (
          <span style={{ marginRight: 8, color: '#0ea5e9', fontWeight: 700 }}>{index}.</span>
        )}
        <span style={{ fontWeight: 600, color: '#0f172a' }}>{place.name}</span>
        {place.address && (
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{place.address}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '6px 12px',
            fontSize: 12,
            background: '#0ea5e9',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          지도
        </a>
        <button
          type="button"
          onClick={onRemove}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            background: '#f1f5f9',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          삭제
        </button>
      </div>
    </div>
  )
}
