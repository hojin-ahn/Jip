/**
 * Bulk ingestion script for MOLIT real estate transaction data.
 *
 * Usage:
 *   MOLIT_SERVICE_KEY=<key> npx tsx scripts/syncListings.ts
 *   MOLIT_SERVICE_KEY=<key> SYNC_MONTHS=12 npx tsx scripts/syncListings.ts
 *
 * Get a free service key at: https://www.data.go.kr/
 * Search: "국토교통부 오피스텔 전월세 신고 조회"
 */

import 'dotenv/config'
import { fetchMolitTransactions } from '../lib/ingestion/sources/molit'
import { mapMolitItem } from '../lib/ingestion/normalize/mapper'
import { upsertTransactions } from '../lib/ingestion/persist/upsert'
import type { MolitApiType, NormalizedTransaction } from '../lib/ingestion/sources/types'

// Seoul districts most relevant to the app's current coverage.
// Add more from the full list at: https://www.code.go.kr/stdcode/regCodeL.do
const DISTRICTS = [
  { name: '마포구', code: '11440' },
  { name: '성동구', code: '11200' },
  { name: '강남구', code: '11680' },
  { name: '서초구', code: '11650' },
  { name: '용산구', code: '11170' },
  { name: '영등포구', code: '11560' },
  { name: '송파구', code: '11710' },
] as const

// Only APIs you've applied for on data.go.kr. Add 'multifamily'/'detached' if you apply for those too.
const API_TYPES: MolitApiType[] = ['officetel']

function recentMonths(count: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

async function main() {
  const serviceKey = process.env.MOLIT_SERVICE_KEY
  if (!serviceKey) {
    console.error('Error: MOLIT_SERVICE_KEY env var not set.')
    console.error('Register at https://www.data.go.kr/ to get a free key.')
    process.exit(1)
  }

  const monthCount = parseInt(process.env.SYNC_MONTHS ?? '3', 10)
  const months = recentMonths(monthCount)

  const total = DISTRICTS.length * API_TYPES.length * months.length
  console.log(
    `Starting sync: ${DISTRICTS.length} districts × ${API_TYPES.length} types × ${months.length} months = ${total} requests\n`
  )

  let totalUpserted = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const district of DISTRICTS) {
    for (const apiType of API_TYPES) {
      for (const dealYmd of months) {
        const label = `${district.name}/${apiType}/${dealYmd}`
        try {
          process.stdout.write(`  ${label} ... `)
          const rawItems = await fetchMolitTransactions({
            lawdCd: district.code,
            dealYmd,
            serviceKey,
            type: apiType,
          })

          const normalized: NormalizedTransaction[] = rawItems
            .map((item) => mapMolitItem(item, district.code, apiType))
            .filter((x): x is NormalizedTransaction => x !== null)

          const { upserted, skipped } = await upsertTransactions(normalized)
          totalUpserted += upserted
          totalSkipped += skipped
          console.log(`${normalized.length} normalized → ${upserted} upserted, ${skipped} skipped`)
        } catch (err) {
          console.log(`ERROR: ${(err as Error).message}`)
          totalErrors++
        }

        // Polite rate limiting between API calls
        await sleep(500)
      }
    }
  }

  console.log(`\n─────────────────────────────────────────`)
  console.log(`Sync complete`)
  console.log(`  Upserted : ${totalUpserted}`)
  console.log(`  Skipped  : ${totalSkipped}`)
  console.log(`  Errors   : ${totalErrors}`)
  process.exit(totalErrors > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
