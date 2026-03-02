import { getApiKey } from './client'
import { geocodeAddress } from './geocode'

export interface PlacePrediction {
  placeId: string
  description: string
  mainText: string
  secondaryText?: string
}

export interface PlaceDetails {
  placeId: string
  name: string
  address?: string
  lat: number
  lng: number
}

export async function fetchAutocomplete(input: string): Promise<PlacePrediction[]> {
  if (!input.trim()) {
    return []
  }
  const key = getApiKey()
  if (!key) {
    console.warn('VITE_GOOGLE_MAPS_API_KEY not set')
    return []
  }

  const url = '/api/gplaces-autocomplete'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat'
    },
    body: JSON.stringify({
      input: input.trim(),
      languageCode: 'ko'
    }),
    referrerPolicy: 'no-referrer'
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `HTTP ${res.status}`)
  }

  const data = await res.json()
  const suggestions = data.suggestions || []
  return suggestions
    .filter((s: { placePrediction?: unknown }) => s.placePrediction)
    .map((s: {
      placePrediction: {
        placeId: string
        text?: { text?: string }
        structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } }
      }
    }) => {
      const p = s.placePrediction
      const mainText = p.structuredFormat?.mainText?.text ?? p.text?.text ?? ''
      const secondaryText = p.structuredFormat?.secondaryText?.text
      return {
        placeId: p.placeId,
        description: p.text?.text ?? mainText,
        mainText,
        secondaryText
      }
    })
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!getApiKey()) return null

  const url = `/api/gplaces-details?id=${encodeURIComponent(placeId)}&languageCode=ko`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location'
    }
  })

  if (!res.ok) return null

  const data = await res.json()
  const name = data.displayName?.text ?? data.id ?? 'Unknown'
  const loc = data.location
  return {
    placeId: data.id ?? placeId,
    name,
    address: data.formattedAddress,
    lat: loc?.latitude ?? 0,
    lng: loc?.longitude ?? 0
  }
}

/**
 * Place Details를 시도하고, 403 등으로 실패하면 Geocoding API로 주소→좌표 조회 후 반환.
 */
export async function fetchPlaceDetailsWithFallback(prediction: PlacePrediction): Promise<PlaceDetails | null> {
  const details = await fetchPlaceDetails(prediction.placeId)
  if (details) return details

  const addressToTry = prediction.description.trim()
  let geocode = await geocodeAddress(addressToTry)
  if (!geocode && prediction.secondaryText) {
    const altAddress = `${prediction.mainText}, ${prediction.secondaryText}`.trim()
    if (altAddress !== addressToTry) geocode = await geocodeAddress(altAddress)
  }
  if (!geocode) return null

  return {
    placeId: prediction.placeId,
    name: prediction.mainText,
    address: prediction.description,
    lat: geocode.lat,
    lng: geocode.lng
  }
}
