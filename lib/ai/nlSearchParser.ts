import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type ListingFilterInput = {
  dong?: string
  propertyType?: 'STUDIO' | 'ONE_ROOM' | 'TWO_ROOM' | 'OFFICE_TEL'
  minPrice?: number
  maxPrice?: number
  minArea?: number
  trustScoreMin?: number
  keywords?: string
}

const SYSTEM_PROMPT = `You are a Korean real estate search parser. The user provides a natural language query in Korean or English.
Extract a structured filter object with these fields:
- dong: neighborhood name (string, optional)
- propertyType: one of STUDIO | ONE_ROOM | TWO_ROOM | OFFICE_TEL (optional)
- minPrice / maxPrice: monthly rent in KRW (optional). Convert "50만원" to 500000.
- minArea: minimum m² (optional)
- trustScoreMin: if user says "믿을 수 있는" or "검증된", set to 70 (optional)
- keywords: any qualitative terms not captured above (e.g. "quiet", "no bugs") — pass through as-is

Return JSON only. No prose. No markdown fences.`

export async function parseSearchQuery(query: string): Promise<ListingFilterInput> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: query },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  })

  const content = response.choices[0].message.content
  if (!content) return {}

  try {
    const parsed = JSON.parse(content)
    // Clean up any null/undefined values
    return Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => v !== null && v !== undefined)
    ) as ListingFilterInput
  } catch {
    return {}
  }
}
