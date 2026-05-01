/**
 * Vercel Cron handler — syncs the current month's MOLIT transactions.
 *
 * Vercel calls this with Authorization: Bearer <CRON_SECRET>.
 * Set CRON_SECRET in Vercel env vars to lock it down.
 * If CRON_SECRET is not set, any GET request can trigger it (dev-only default).
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchMolitTransactions } from '@/lib/ingestion/sources/molit'
import { mapMolitItem } from '@/lib/ingestion/normalize/mapper'
import { upsertTransactions } from '@/lib/ingestion/persist/upsert'
import type { MolitApiType, NormalizedTransaction } from '@/lib/ingestion/sources/types'

// Sync a focused subset on each cron run to stay within the 300s function limit.
// The CLI script (scripts/syncListings.ts) handles the initial bulk load.
const CRON_DISTRICTS = [
  { name: '마포구', code: '11440' },
  { name: '강남구', code: '11680' },
  { name: '성동구', code: '11200' },
] as const

const CRON_TYPES: MolitApiType[] = ['officetel']

function currentDealYmd(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Also sync the previous month: MOLIT data has a ~2-week reporting lag.
function previousDealYmd(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const serviceKey = process.env.MOLIT_SERVICE_KEY
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'MOLIT_SERVICE_KEY not configured' },
      { status: 503 }
    )
  }

  const dealYmds = [currentDealYmd(), previousDealYmd()]
  const startedAt = Date.now()
  let totalUpserted = 0
  let totalSkipped = 0
  const errors: string[] = []

  console.log('[sync-listings] starting', { dealYmds, districts: CRON_DISTRICTS.length })

  for (const district of CRON_DISTRICTS) {
    for (const apiType of CRON_TYPES) {
      for (const dealYmd of dealYmds) {
        const label = `${district.name}/${apiType}/${dealYmd}`
        try {
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
          console.log(`[sync-listings] ${label} → ${upserted} upserted, ${skipped} skipped`)
        } catch (err) {
          const msg = `${label}: ${(err as Error).message}`
          errors.push(msg)
          console.error(`[sync-listings] error ${msg}`)
        }
      }
    }
  }

  const durationMs = Date.now() - startedAt
  console.log('[sync-listings] done', { upserted: totalUpserted, skipped: totalSkipped, errors: errors.length, durationMs })

  const status = errors.length === 0 ? 200 : 207
  return NextResponse.json(
    {
      ok: errors.length === 0,
      dealYmds,
      upserted: totalUpserted,
      skipped: totalSkipped,
      durationMs,
      ...(errors.length > 0 && { errors }),
    },
    { status }
  )
}
