import type { TaxiRegion } from '../types'

export interface TaxiFareParams {
  distanceKm: number
  durationMinutes: number
  region?: TaxiRegion
}

/** 지역별 택시 요금 단가 (한국: 원, 일본: 엔, 기본: 참고용 단위) */
const TAXI_RATES: Record<TaxiRegion, { base: number; perKm: number; perMin?: number }> = {
  kr: { base: 3800, perKm: 120, perMin: 33 },
  jp: { base: 420, perKm: 80, perMin: 45 },
  default: { base: 500, perKm: 100, perMin: 30 }
}

export function calculateTaxiFare(params: TaxiFareParams): number {
  const { distanceKm, durationMinutes, region = 'default' } = params
  const rates = TAXI_RATES[region]
  const fare = rates.base + distanceKm * rates.perKm + (rates.perMin ?? 0) * durationMinutes
  return Math.round(Math.max(0, fare))
}
