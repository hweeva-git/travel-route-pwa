import type { Place } from '../types'

function haversineDistance( LatLng1: { lat: number; lng: number }, LatLng2: { lat: number; lng: number }): number {
  const R = 6371 // km
  const dLat = (LatLng2.lat - LatLng1.lat) * Math.PI / 180
  const dLng = (LatLng2.lng - LatLng1.lng) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(LatLng1.lat * Math.PI / 180) * Math.cos(LatLng2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function totalDistance(places: Place[], order: number[]): number {
  let sum = 0
  for (let i = 0; i < order.length - 1; i++) {
    const a = places[order[i]]
    const b = places[order[i + 1]]
    sum += haversineDistance({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng })
  }
  return sum
}

function twoOpt(places: Place[], order: number[]): number[] {
  let improved = true
  let bestOrder = [...order]

  while (improved) {
    improved = false
    for (let i = 0; i < bestOrder.length - 1; i++) {
      for (let j = i + 2; j < bestOrder.length; j++) {
        const newOrder = [...bestOrder]
        for (let k = 0; k <= j - i - 1; k++) {
          newOrder[i + 1 + k] = bestOrder[j - k]
        }
        if (totalDistance(places, newOrder) < totalDistance(places, bestOrder)) {
          bestOrder = newOrder
          improved = true
        }
      }
    }
  }

  return bestOrder
}

export function optimizeRoute(places: Place[]): Place[] {
  if (places.length <= 1) return [...places]

  const indices = places.map((_, i) => i)
  let order: number[] = [0]
  const remaining = new Set(indices.slice(1))

  while (remaining.size > 0) {
    const last = order[order.length - 1]
    const lastPlace = places[last]
    let nearest = -1
    let minDist = Infinity
    for (const i of remaining) {
      const d = haversineDistance(
        { lat: lastPlace.lat, lng: lastPlace.lng },
        { lat: places[i].lat, lng: places[i].lng }
      )
      if (d < minDist) {
        minDist = d
        nearest = i
      }
    }
    if (nearest >= 0) {
      order.push(nearest)
      remaining.delete(nearest)
    }
  }

  order = twoOpt(places, order)
  return order.map((i) => places[i])
}
