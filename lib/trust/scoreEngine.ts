import type { Listing, Photo, Review } from '../generated/prisma/client'

export type ListingWithRelations = Listing & {
  photos: Photo[]
  reviews: Review[]
}

export type TrustSignal = {
  label: string
  passed: boolean
  points: number
}

export type TrustResult = {
  score: number
  signals: TrustSignal[]
  tier: 'high' | 'moderate' | 'low'
  tierLabel: string
}

type DuplicateCheckFn = (listing: ListingWithRelations) => boolean

function freshnessPoints(updatedAt: Date): { points: number; passed: boolean } {
  const now = Date.now()
  const diffMs = now - updatedAt.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays <= 3) return { points: 25, passed: true }
  if (diffDays <= 7) return { points: 15, passed: true }
  return { points: 0, passed: false }
}

function photoRecencyPoints(photos: Photo[]): { points: number; passed: boolean } {
  if (photos.length === 0) return { points: 0, passed: false }
  const now = Date.now()
  const hasRecent = photos.some((p) => {
    const diffDays = (now - p.uploadedAt.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 30
  })
  return hasRecent ? { points: 15, passed: true } : { points: 0, passed: false }
}

function reviewPresencePoints(reviews: Review[]): { points: number; passed: boolean } {
  return reviews.length > 0 ? { points: 25, passed: true } : { points: 0, passed: false }
}

function marketFitPoints(
  price: number,
  dong: string,
  propertyType: string,
  allListings: ListingWithRelations[]
): { points: number; passed: boolean } {
  const peers = allListings.filter(
    (l) => l.dong === dong && l.propertyType === propertyType
  )
  if (peers.length < 3) return { points: 10, passed: true } // Not enough data — give benefit of doubt
  const prices = peers.map((l) => l.price).sort((a, b) => a - b)
  const median = prices[Math.floor(prices.length / 2)]
  const within = Math.abs(price - median) / median <= 0.25
  return within ? { points: 10, passed: true } : { points: 0, passed: false }
}

export function computeTrustScore(
  listing: ListingWithRelations,
  allListings: ListingWithRelations[],
  isDuplicate: DuplicateCheckFn
): TrustResult {
  const freshness = freshnessPoints(listing.updatedAt)
  const duplicateCheck = isDuplicate(listing)
  const reviews = reviewPresencePoints(listing.reviews)
  const photos = photoRecencyPoints(listing.photos)
  const marketFit = marketFitPoints(
    listing.price,
    listing.dong,
    listing.propertyType,
    allListings
  )

  const signals: TrustSignal[] = [
    {
      label: '최근 업데이트',
      passed: freshness.passed,
      points: freshness.points,
    },
    {
      label: '동일 위치 매물 없음',
      passed: !duplicateCheck,
      points: duplicateCheck ? 0 : 25,
    },
    {
      label: '거주 후기 있음',
      passed: reviews.passed,
      points: reviews.points,
    },
    {
      label: '최근 사진 업로드',
      passed: photos.passed,
      points: photos.points,
    },
    {
      label: '시세 범위 내',
      passed: marketFit.passed,
      points: marketFit.points,
    },
  ]

  const score = signals.reduce((sum, s) => sum + s.points, 0)

  let tier: TrustResult['tier']
  let tierLabel: string
  if (score >= 80) {
    tier = 'high'
    tierLabel = '높음'
  } else if (score >= 50) {
    tier = 'moderate'
    tierLabel = '보통'
  } else {
    tier = 'low'
    tierLabel = '낮음'
  }

  return { score, signals, tier, tierLabel }
}

export function detectDuplicate(
  listing: ListingWithRelations,
  allListings: ListingWithRelations[]
): boolean {
  return allListings.some((other) => {
    if (other.id === listing.id) return false
    if (other.address !== listing.address) return false
    const priceDiff = Math.abs(other.price - listing.price) / listing.price
    return priceDiff <= 0.1
  })
}
