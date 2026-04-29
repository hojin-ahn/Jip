import { prisma } from '../../lib/db/prisma'
import { parseSearchQuery } from '../../lib/ai/nlSearchParser'
import { summarizeReviews } from '../../lib/ai/reviewSummarizer'

export const aiResolvers = {
  Query: {
    async parseSearchQuery(_: unknown, { query }: { query: string }) {
      try {
        return await parseSearchQuery(query)
      } catch (err) {
        console.error('NL search parse error:', err)
        return {}
      }
    },

    async reviewSummary(_: unknown, { listingId }: { listingId: string }) {
      const reviews = await prisma.review.findMany({
        where: { listingId },
        orderBy: { createdAt: 'desc' },
      })
      try {
        return await summarizeReviews(listingId, reviews)
      } catch (err) {
        console.error('Review summary error:', err)
        return '후기 요약을 생성하는 중 오류가 발생했습니다.'
      }
    },
  },
}
