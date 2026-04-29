import { LRUCache } from 'lru-cache'

export const reviewSummaryCache = new LRUCache<string, string>({
  max: 200,
  ttl: 1000 * 60 * 60, // 1 hour
})
