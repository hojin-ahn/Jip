/**
 * Server-side data access — called directly from Server Components.
 * Bypasses the GraphQL HTTP layer to avoid internal network calls on Vercel.
 */
import { prisma } from '@/lib/db/prisma'
import { computeTrustScore, detectDuplicate, ListingWithRelations, PricePeer } from '@/lib/trust/scoreEngine'
import type { Listing, ListingPage } from '@/types'

function formatTenancyPeriod(start: Date, end: Date): string {
  const fmt = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
  return `${fmt(start)} – ${fmt(end)}`
}

async function getAllListings(): Promise<ListingWithRelations[]> {
  return prisma.listing.findMany({
    where: { isActive: true },
    include: { photos: true, reviews: true },
  })
}

/** Fetch the last 3 months of MOLIT transactions for a dong+propertyType combo. */
async function getMarketPeers(dong: string, propertyType: string): Promise<PricePeer[]> {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const year = threeMonthsAgo.getFullYear()
  const month = threeMonthsAgo.getMonth() + 1

  return prisma.marketTransaction.findMany({
    where: {
      dong,
      propertyType: propertyType as never,
      OR: [
        { dealYear: { gt: year } },
        { dealYear: year, dealMonth: { gte: month } },
      ],
    },
    select: { price: true },
  })
}

function mapToGQL(
  listing: ListingWithRelations,
  allListings: ListingWithRelations[],
  marketPeers?: PricePeer[]
): Listing {
  const trustResult = computeTrustScore(
    listing,
    allListings,
    (l) => detectDuplicate(l, allListings),
    marketPeers
  )
  return {
    id: listing.id,
    title: listing.title,
    address: { full: listing.address, dong: listing.dong, lat: listing.lat, lng: listing.lng },
    price: listing.price,
    deposit: listing.deposit,
    propertyType: listing.propertyType as Listing['propertyType'],
    area: listing.area,
    floor: listing.floor,
    totalFloors: listing.totalFloors,
    description: listing.description,
    photos: listing.photos.map((p) => ({ id: p.id, url: p.url, uploadedAt: p.uploadedAt.toISOString() })),
    reviews: listing.reviews.map((r) => ({
      id: r.id,
      listingId: r.listingId,
      tenancyPeriod: formatTenancyPeriod(r.tenancyStart, r.tenancyEnd),
      ratings: {
        noise: r.noise, pests: r.pests, winterCold: r.winterCold,
        summerHeat: r.summerHeat, landlordResponse: r.landlordResponse,
        overallSatisfaction: r.overallSatisfaction,
      },
      pros: r.pros,
      cons: r.cons,
      createdAt: r.createdAt.toISOString(),
    })),
    trustScore: trustResult.score,
    trustSignals: trustResult.signals,
    broker: null,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  }
}

export async function fetchListingsSSR(perPage = 20): Promise<ListingPage> {
  const allListings = await getAllListings()
  // Fetch market peers for all distinct dong+type combos in one pass
  const combos = [...new Set(allListings.map((l) => `${l.dong}|${l.propertyType}`))]
  const peersMap = new Map<string, PricePeer[]>()
  await Promise.all(
    combos.map(async (key) => {
      const [dong, propertyType] = key.split('|')
      const peers = await getMarketPeers(dong, propertyType)
      peersMap.set(key, peers)
    })
  )

  const mapped = allListings.map((l) =>
    mapToGQL(l, allListings, peersMap.get(`${l.dong}|${l.propertyType}`))
  )
  return {
    listings: mapped.slice(0, perPage),
    totalCount: mapped.length,
    hasNextPage: mapped.length > perPage,
  }
}

export async function fetchListingSSR(id: string): Promise<Listing | null> {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { photos: true, reviews: true, broker: true },
  })
  if (!listing) return null
  const allListings = await getAllListings()
  const marketPeers = await getMarketPeers(listing.dong, listing.propertyType)
  const result = mapToGQL(listing, allListings, marketPeers)
  if (listing.broker) {
    result.broker = { id: listing.broker.id, name: listing.broker.name, phone: listing.broker.phone ?? null }
  }
  return result
}
