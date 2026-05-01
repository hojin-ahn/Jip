import type { RawMolitItem, NormalizedTransaction, MolitApiType } from '../sources/types'
import { getDongCoords } from './dongCoords'

/** MOLIT amounts are in 만원 and may contain commas: "1,000" → 10_000_000 KRW */
function parseManwon(raw: string): number {
  if (!raw || !raw.trim()) return 0
  return Math.round(parseFloat(raw.replace(/,/g, '')) * 10_000)
}

function parseArea(raw: string): number {
  return Math.round(parseFloat(raw) * 100) / 100
}

function parseFloor(raw: string): number | null {
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

/** All records from the officetel endpoint are OFFICE_TEL regardless of area. */
function inferPropertyType(
  area: number,
  apiType: MolitApiType
): NormalizedTransaction['propertyType'] {
  if (apiType === 'officetel') return 'OFFICE_TEL'
  if (area < 20) return 'STUDIO'
  if (area < 40) return 'ONE_ROOM'
  return 'TWO_ROOM'
}

/**
 * Deterministic externalId — MOLIT provides no transaction ID.
 * Two records with the same date/dong/area/floor are treated as one.
 */
function buildExternalId(item: RawMolitItem, apiType: MolitApiType): string {
  return [
    item.sggCd,
    item.dealYear,
    item.dealMonth.padStart(2, '0'),
    item.dealDay.padStart(2, '0'),
    item.umdNm.trim().replace(/\s+/g, ''),
    item.excluUseAr,
    item.floor || 'x',
    apiType,
  ].join('_')
}

export function mapMolitItem(
  item: RawMolitItem,
  lawdCd: string,
  apiType: MolitApiType
): NormalizedTransaction | null {
  const dong = item.umdNm?.trim()
  const dealYear = parseInt(item.dealYear, 10)
  const dealMonth = parseInt(item.dealMonth, 10)
  const area = parseArea(item.excluUseAr)

  if (!dong || !dealYear || !dealMonth || Number.isNaN(area) || area <= 0) return null

  const deposit = parseManwon(item.deposit)
  const price = parseManwon(item.monthlyRent)
  const floor = parseFloor(item.floor)
  const coords = getDongCoords(dong)

  return {
    source: 'MOLIT',
    externalId: buildExternalId(item, apiType),
    dong,
    lawdCd,
    price,
    deposit,
    area,
    floor,
    propertyType: inferPropertyType(area, apiType),
    dealYear,
    dealMonth,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  }
}
