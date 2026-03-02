import { useState, useCallback, useRef, useEffect } from 'react'
import { fetchAutocomplete, fetchPlaceDetailsWithFallback, type PlacePrediction } from '../api/places'
import type { Place } from '../types'

interface PlaceSearchProps {
  onAdd: (place: Place) => void
  disabled?: boolean
}

export function PlaceSearch({ onAdd, disabled }: PlaceSearchProps) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const list = await fetchAutocomplete(q)
      setSuggestions(list)
      setOpen(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(`검색 오류: ${msg}`)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(input), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [input, search])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const select = async (p: PlacePrediction) => {
    setInput('')
    setSuggestions([])
    setOpen(false)
    setError(null)
    setAdding(true)
    try {
      const details = await fetchPlaceDetailsWithFallback(p)
      if (details) {
        onAdd({
          id: details.placeId,
          name: details.name,
          address: details.address,
          lat: details.lat,
          lng: details.lng
        })
      } else {
        setError('장소를 추가할 수 없습니다. "주소로 직접 추가"를 사용하거나, API 키에 Geocoding API가 허용되어 있는지 확인하세요.')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(`추가 오류: ${msg}`)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="장소 검색 (예: Tokyo Tower)"
        disabled={disabled}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '16px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#0f172a',
          outline: 'none'
        }}
      />
      {loading && (
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 12 }}>
          검색 중...
        </span>
      )}
      {adding && (
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 12 }}>
          추가 중...
        </span>
      )}
      {error && (
        <div style={{ marginTop: 4, padding: '8px 12px', background: '#fee2e2', color: '#dc2626', fontSize: 13, borderRadius: 6 }}>
          {error}
        </div>
      )}
      {open && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            marginTop: 4,
            maxHeight: 240,
            overflowY: 'auto',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {suggestions.map((s) => (
            <li
              key={s.placeId}
              onClick={() => select(s)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f1f5f9',
                color: '#0f172a'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{ fontWeight: 600 }}>{s.mainText}</div>
              {s.secondaryText && <div style={{ fontSize: 12, color: '#64748b' }}>{s.secondaryText}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
