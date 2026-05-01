import { prisma } from '@/lib/db/prisma'
import type { NormalizedTransaction } from '../sources/types'

export interface UpsertResult {
  upserted: number
  skipped: number
}

/**
 * Upserts a batch of normalized transactions into MarketTransaction.
 * Uses @@unique([source, externalId]) for conflict detection.
 * Runs in parallel chunks of 50 to balance throughput vs connection pressure.
 */
export async function upsertTransactions(
  transactions: NormalizedTransaction[]
): Promise<UpsertResult> {
  let upserted = 0
  let skipped = 0

  const CHUNK = 50
  for (let i = 0; i < transactions.length; i += CHUNK) {
    const chunk = transactions.slice(i, i + CHUNK)
    const results = await Promise.allSettled(
      chunk.map((tx) =>
        prisma.marketTransaction.upsert({
          where: {
            source_externalId: { source: tx.source, externalId: tx.externalId },
          },
          create: {
            source: tx.source,
            externalId: tx.externalId,
            dong: tx.dong,
            lat: tx.lat,
            lng: tx.lng,
            price: tx.price,
            deposit: tx.deposit,
            area: tx.area,
            floor: tx.floor,
            propertyType: tx.propertyType,
            dealYear: tx.dealYear,
            dealMonth: tx.dealMonth,
          },
          update: {
            // Update price/deposit in case of late correction by MOLIT
            price: tx.price,
            deposit: tx.deposit,
          },
          select: { id: true },
        })
      )
    )
    for (const r of results) {
      if (r.status === 'fulfilled') upserted++
      else skipped++
    }
  }

  return { upserted, skipped }
}
