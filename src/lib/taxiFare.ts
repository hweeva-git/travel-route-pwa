import type { TaxiRegion } from '../types'

export interface TaxiFareParams {
  distanceKm: number
  durationMinutes: number
  region?: TaxiRegion
}

/**
 * 도쿄 택시 요금 계산 (2023년 기준).
 * 初乗り: 500円 / 1.052km
 * 加算:  100円 / 233m (≈ 429円/km)
 * 時間制: 100円 / 90초 (低速時, 전체 시간의 약 20% 가정)
 */
function calculateTokyoFare(distanceKm: number, durationMinutes: number): number {
  const BASE_FARE = 500
  const BASE_KM = 1.052
  const PER_KM = 429        // 100円 / 0.233km
  const TIME_RATE = 67 * 0.2 // 100円/90sec ≈ 67円/min, 저속 구간 20% 가정

  if (distanceKm <= BASE_KM) return BASE_FARE
  return Math.round(BASE_FARE + (distanceKm - BASE_KM) * PER_KM + durationMinutes * TIME_RATE)
}

/** 기본/글로벌 단순 추정 요금 */
const DEFAULT_RATES = { base: 500, perKm: 150, perMin: 30 }

export function calculateTaxiFare(params: TaxiFareParams): number {
  const { distanceKm, durationMinutes, region = 'default' } = params

  if (region === 'jp') {
    return calculateTokyoFare(distanceKm, durationMinutes)
  }

  const fare = DEFAULT_RATES.base + distanceKm * DEFAULT_RATES.perKm + DEFAULT_RATES.perMin * durationMinutes
  return Math.round(Math.max(0, fare))
}
