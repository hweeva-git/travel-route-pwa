import { useState } from 'react'
import { ApiKeyBanner } from './components/ApiKeyBanner'
import { PlaceListPage } from './pages/PlaceListPage'
import { ResultPage } from './pages/ResultPage'
import type { Place } from './types'

const STORAGE_KEY = 'travel-route-places'

function loadPlaces(): Place[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function savePlaces(places: Place[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places))
}

function App() {
  const [places, setPlaces] = useState<Place[]>(loadPlaces)
  const [step, setStep] = useState<'list' | 'result'>('list')

  const handlePlacesChange = (next: Place[]) => {
    setPlaces(next)
    savePlaces(next)
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 24 }}>
      <ApiKeyBanner />
      {step === 'list' && (
        <PlaceListPage
          places={places}
          onPlacesChange={handlePlacesChange}
          onNext={() => setStep('result')}
        />
      )}
      {step === 'result' && (
        <ResultPage places={places} onBack={() => setStep('list')} />
      )}
    </div>
  )
}

export default App
