export type IngestionSource = 'MOLIT'

export type MolitApiType = 'officetel' | 'multifamily' | 'detached'

export interface MolitApiOptions {
  /** 5-digit LAWD_CD, e.g. "11440" for Mapo-gu */
  lawdCd: string
  /** YYYYMM, e.g. "202503" */
  dealYmd: string
  serviceKey: string
  type: MolitApiType
}

/** Raw field names from MOLIT XML response (API v2 — English tags, registered 2024-01-25) */
export interface RawMolitItem {
  umdNm: string        // 읍면동명 (dong name)
  offiNm: string       // 오피스텔명
  deposit: string      // 보증금 in 만원, may contain commas e.g. "1,000"
  monthlyRent: string  // 월세 in 만원
  excluUseAr: string   // 전용면적 ㎡
  floor: string        // 층
  dealYear: string     // 거래년
  dealMonth: string    // 거래월
  dealDay: string      // 거래일
  sggCd: string        // 시군구 코드 (5-digit LAWD_CD)
}

export interface NormalizedTransaction {
  source: IngestionSource
  externalId: string       // deterministic, no MOLIT-provided ID exists
  dong: string
  lawdCd: string
  price: number            // KRW monthly rent (0 for 전세)
  deposit: number          // KRW
  area: number             // ㎡
  floor: number | null
  propertyType: 'STUDIO' | 'ONE_ROOM' | 'TWO_ROOM' | 'OFFICE_TEL'
  dealYear: number
  dealMonth: number
  lat: number | null
  lng: number | null
}
