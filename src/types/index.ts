export interface Place {
  id: string
  name: string
  address?: string
  lat: number
  lng: number
}

/** 대중교통 경로 한 가지 옵션 (도보+대중교통+도보 등) */
export interface TransitOption {
  durationMinutes: number
  summary: string
  steps: Array<{ instruction: string; transitLine?: string }>
}

export interface SegmentInfo {
  from: Place
  to: Place
  transit: {
    options: TransitOption[]
    fare?: number
  } | null
  taxi: {
    durationMinutes: number
    distanceKm: number
    fare: number
    isEstimated?: boolean
  }
  walking: {
    durationMinutes: number
    distanceKm: number
    isEstimated?: boolean
  } | null
}

export type TaxiRegion = 'kr' | 'jp' | 'default'
