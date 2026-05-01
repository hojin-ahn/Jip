/**
 * MOLIT (국토교통부) Real Estate Transaction API client.
 *
 * Register for a free service key at: https://www.data.go.kr/
 * Search for "국토교통부 오피스텔 전월세 신고 조회" to find the relevant APIs.
 *
 * Rate limits: ~1000 req/day on the free tier. This client adds 300ms delay
 * between pages and 500ms between top-level calls (enforced by the caller).
 */

import type { MolitApiOptions, RawMolitItem } from './types'

const ENDPOINTS: Record<string, string> = {
  officetel:
    'https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent',
  multifamily:
    'https://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent',
  detached:
    'https://apis.data.go.kr/1613000/RTMSDataSvcSHRent/getRTMSDataSvcSHRent',
}

const PAGE_SIZE = 100

async function fetchPage(
  opts: MolitApiOptions,
  pageNo: number
): Promise<{ items: RawMolitItem[]; totalCount: number }> {
  const url = new URL(ENDPOINTS[opts.type])
  url.searchParams.set('serviceKey', opts.serviceKey)
  url.searchParams.set('LAWD_CD', opts.lawdCd)
  url.searchParams.set('DEAL_YMD', opts.dealYmd)
  url.searchParams.set('pageNo', String(pageNo))
  url.searchParams.set('numOfRows', String(PAGE_SIZE))

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/xml',
      'User-Agent': 'Mozilla/5.0',
    },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`MOLIT ${res.status} for ${opts.lawdCd}/${opts.dealYmd}`)

  const xml = await res.text()

  const resultCode = extractXml(xml, 'resultCode')
  // Accept "00" (old API) and "000" (new API v2) as success
  if (resultCode && !resultCode.match(/^0+$/)) {
    throw new Error(`MOLIT API error ${resultCode}: ${extractXml(xml, 'resultMsg')}`)
  }

  const totalCount = parseInt(extractXml(xml, 'totalCount') || '0', 10)
  return { items: parseItems(xml), totalCount }
}

export async function fetchMolitTransactions(
  opts: MolitApiOptions
): Promise<RawMolitItem[]> {
  const first = await fetchPage(opts, 1)
  const all = [...first.items]
  const totalPages = Math.ceil(first.totalCount / PAGE_SIZE)

  for (let page = 2; page <= totalPages; page++) {
    await sleep(300)
    const { items } = await fetchPage(opts, page)
    all.push(...items)
  }

  return all
}

// ── XML helpers ─────────────────────────────────────────────────────────────

function extractXml(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return m ? m[1].trim() : ''
}

function parseItems(xml: string): RawMolitItem[] {
  const itemsBlock = extractXml(xml, 'items')
  if (!itemsBlock) return []

  const items: RawMolitItem[] = []
  const re = /<item>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(itemsBlock)) !== null) {
    const b = m[1]
    items.push({
      umdNm: extractXml(b, 'umdNm'),
      offiNm: extractXml(b, 'offiNm'),
      deposit: extractXml(b, 'deposit'),
      monthlyRent: extractXml(b, 'monthlyRent'),
      excluUseAr: extractXml(b, 'excluUseAr'),
      floor: extractXml(b, 'floor'),
      dealYear: extractXml(b, 'dealYear'),
      dealMonth: extractXml(b, 'dealMonth'),
      dealDay: extractXml(b, 'dealDay'),
      sggCd: extractXml(b, 'sggCd'),
    })
  }
  return items
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
