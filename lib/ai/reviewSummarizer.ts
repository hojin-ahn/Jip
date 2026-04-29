import OpenAI from 'openai'
import type { Review } from '../generated/prisma/client'
import { reviewSummaryCache } from '../cache/lru'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function summarizeReviews(
  listingId: string,
  reviews: Review[]
): Promise<string> {
  const cached = reviewSummaryCache.get(listingId)
  if (cached) return cached

  if (reviews.length === 0) {
    return '아직 등록된 후기가 없습니다.'
  }

  const reviewText = reviews
    .map((r, i) => {
      return `후기 ${i + 1}:
- 층간소음: ${r.noise}/5, 벌레: ${r.pests}/5, 겨울 단열: ${r.winterCold}/5, 여름 더위: ${r.summerHeat}/5, 집주인 응답: ${r.landlordResponse}/5, 전반적 만족도: ${r.overallSatisfaction}/5
- 좋았던 점: ${r.pros}
- 아쉬운 점: ${r.cons}`
    })
    .join('\n\n')

  const prompt = `다음은 이 매물에 대한 실제 거주자 후기입니다. 2~3문장으로 주요 장점과 단점을 한국어로 요약해주세요. 구체적이고 솔직하게 작성하세요.

${reviewText}`

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: 0.3,
  })

  const summary = response.choices[0].message.content ?? '요약을 생성할 수 없습니다.'
  reviewSummaryCache.set(listingId, summary)
  return summary
}
