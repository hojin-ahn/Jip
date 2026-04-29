import { prisma } from '../../lib/db/prisma'
import { reviewSummaryCache } from '../../lib/cache/lru'

type CreateReviewInput = {
  listingId: string
  tenancyStart: string
  tenancyEnd: string
  noise: number
  pests: number
  winterCold: number
  summerHeat: number
  landlordResponse: number
  overallSatisfaction: number
  pros: string
  cons: string
}

function formatTenancyPeriod(start: Date, end: Date): string {
  const fmt = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
  return `${fmt(start)} – ${fmt(end)}`
}

export const reviewResolvers = {
  Mutation: {
    async createReview(_: unknown, { input }: { input: CreateReviewInput }) {
      const review = await prisma.review.create({
        data: {
          listingId: input.listingId,
          tenancyStart: new Date(input.tenancyStart),
          tenancyEnd: new Date(input.tenancyEnd),
          noise: input.noise,
          pests: input.pests,
          winterCold: input.winterCold,
          summerHeat: input.summerHeat,
          landlordResponse: input.landlordResponse,
          overallSatisfaction: input.overallSatisfaction,
          pros: input.pros,
          cons: input.cons,
        },
      })

      // Invalidate summary cache for this listing
      reviewSummaryCache.delete(input.listingId)

      const start = new Date(input.tenancyStart)
      const end = new Date(input.tenancyEnd)

      return {
        id: review.id,
        listingId: review.listingId,
        tenancyPeriod: formatTenancyPeriod(start, end),
        ratings: {
          noise: review.noise,
          pests: review.pests,
          winterCold: review.winterCold,
          summerHeat: review.summerHeat,
          landlordResponse: review.landlordResponse,
          overallSatisfaction: review.overallSatisfaction,
        },
        pros: review.pros,
        cons: review.cons,
        createdAt: review.createdAt,
      }
    },
  },
}
