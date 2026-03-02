const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export function ApiKeyBanner() {
  if (API_KEY) return null

  return (
    <div
      style={{
        padding: '12px 16px',
        background: '#7f1d1d',
        color: '#fecaca',
        fontSize: 14,
        textAlign: 'center'
      }}
    >
      Google Maps API 키가 설정되지 않았습니다. .env에 VITE_GOOGLE_MAPS_API_KEY를 추가하고 Places API, Directions API, Geocoding API를 활성화하세요.
    </div>
  )
}
