import { prisma } from '../../lib/db/prisma'
import { computeTrustScore, detectDuplicate, ListingWithRelations } from '../../lib/trust/scoreEngine'
import type { Review } from '../../lib/generated/prisma/client'

type ListingFilter = {
  dong?: string
  propertyType?: 'STUDIO' | 'ONE_ROOM' | 'TWO_ROOM' | 'OFFICE_TEL'
  minPrice?: number
  maxPrice?: number
  minArea?: number
  trustScoreMin?: number
  keywords?: string
}

// Cache all listings for duplicate detection and market fit (refreshed per request batch)
let allListingsCache: ListingWithRelations[] = []
let allListingsCacheTime = 0
const CACHE_TTL = 60 * 1000 // 1 minute

async function getAllListings(): Promise<ListingWithRelations[]> {
  if (allListingsCache.length > 0 && Date.now() - allListingsCacheTime < CACHE_TTL) {
    return allListingsCache
  }
  allListingsCache = await prisma.listing.findMany({
    include: { photos: true, reviews: true },
  })
  allListingsCacheTime = Date.now()
  return allListingsCache
}

function formatTenancyPeriod(start: Date, end: Date): string {
  const fmt = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
  return `${fmt(start)} – ${fmt(end)}`
}

function mapListingToGQL(
  listing: ListingWithRelations,
  allListings: ListingWithRelations[]
) {
  const trustResult = computeTrustScore(
    listing,
    allListings,
    (l) => detectDuplicate(l, allListings)
  )

  return {
    id: listing.id,
    title: listing.title,
    address: {
      full: listing.address,
      dong: listing.dong,
      lat: listing.lat,
      lng: listing.lng,
    },
    price: listing.price,
    deposit: listing.deposit,
    propertyType: listing.propertyType,
    area: listing.area,
    floor: listing.floor,
    totalFloors: listing.totalFloors,
    description: listing.description,
    photos: listing.photos,
    reviews: listing.reviews.map((r: Review) => ({
      id: r.id,
      listingId: r.listingId,
      tenancyPeriod: formatTenancyPeriod(r.tenancyStart, r.tenancyEnd),
      ratings: {
        noise: r.noise,
        pests: r.pests,
        winterCold: r.winterCold,
        summerHeat: r.summerHeat,
        landlordResponse: r.landlordResponse,
        overallSatisfaction: r.overallSatisfaction,
      },
      pros: r.pros,
      cons: r.cons,
      createdAt: r.createdAt,
    })),
    trustScore: trustResult.score,
    trustSignals: trustResult.signals,
    broker: listing.brokerId
      ? { id: listing.brokerId, name: '', phone: null as string | null }
      : null,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  }
}

export const listingResolvers = {
  Query: {
    async listings(
      _: unknown,
      {
        filter,
        page = 1,
        perPage = 20,
      }: { filter?: ListingFilter; page?: number; perPage?: number }
    ) {
      const where: Record<string, unknown> = {}

      if (filter?.dong) where.dong = { contains: filter.dong, mode: 'insensitive' }
      if (filter?.propertyType) where.propertyType = filter.propertyType
      if (filter?.minPrice || filter?.maxPrice) {
        where.price = {
          ...(filter.minPrice ? { gte: filter.minPrice } : {}),
          ...(filter.maxPrice ? { lte: filter.maxPrice } : {}),
        }
      }
      if (filter?.minArea) where.area = { gte: filter.minArea }
      if (filter?.keywords) {
        where.OR = [
          { title: { contains: filter.keywords, mode: 'insensitive' } },
          { description: { contains: filter.keywords, mode: 'insensitive' } },
        ]
      }

      const allListings = await getAllListings()

      const rawListings = await prisma.listing.findMany({
        where,
        include: { photos: true, reviews: true },
        orderBy: { updatedAt: 'desc' },
      })

      // Apply trustScoreMin filter post-query (computed field)
      const mapped = rawListings.map((l: ListingWithRelations) => mapListingToGQL(l, allListings))
      const filtered = filter?.trustScoreMin
        ? mapped.filter((l: ReturnType<typeof mapListingToGQL>) => l.trustScore >= filter.trustScoreMin!)
        : mapped

      const totalCount = filtered.length
      const start = (page - 1) * perPage
      const paginated = filtered.slice(start, start + perPage)

      return {
        listings: paginated,
        totalCount,
        hasNextPage: start + perPage < totalCount,
      }
    },

    async listing(_: unknown, { id }: { id: string }) {
      const listing = await prisma.listing.findUnique({
        where: { id },
        include: { photos: true, reviews: true, broker: true },
      })
      if (!listing) return null

      const allListings = await getAllListings()
      const result = mapListingToGQL(listing, allListings)

      // Override broker with full data if present
      if (listing.broker) {
        result.broker = {
          id: listing.broker.id,
          name: listing.broker.name,
          phone: listing.broker.phone ?? null,
        }
      }

      return result
    },
  },
}
