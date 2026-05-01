import { computeTrustScore, detectDuplicate, ListingWithRelations } from './scoreEngine'

function makeDate(daysAgo: number): Date {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
}

function makeListing(overrides: Partial<ListingWithRelations> = {}): ListingWithRelations {
  return {
    id: 'test-id',
    title: '테스트 매물',
    dong: '합정동',
    address: '서울시 마포구 합정동 123-4',
    lat: 37.549,
    lng: 126.914,
    price: 500000,
    deposit: 5000000,
    propertyType: 'STUDIO',
    area: 20,
    floor: 3,
    totalFloors: 5,
    description: null,
    source: 'MANUAL',
    externalId: null,
    isActive: true,
    lastSyncedAt: null,
    brokerId: null,
    photos: [],
    reviews: [],
    createdAt: makeDate(10),
    updatedAt: makeDate(1),
    ...overrides,
  }
}

function makePhoto(daysAgo: number) {
  return {
    id: 'photo-1',
    listingId: 'test-id',
    url: 'https://example.com/photo.jpg',
    uploadedAt: makeDate(daysAgo),
  }
}

function makeReview() {
  return {
    id: 'review-1',
    listingId: 'test-id',
    tenancyStart: makeDate(730),
    tenancyEnd: makeDate(30),
    noise: 4,
    pests: 5,
    winterCold: 3,
    summerHeat: 3,
    landlordResponse: 4,
    overallSatisfaction: 4,
    pros: '조용하고 교통이 편리합니다',
    cons: '여름에 덥습니다',
    createdAt: makeDate(30),
  }
}

describe('computeTrustScore', () => {
  test('perfect score listing (updated 1 day ago, recent photo, review, no duplicate, market fit)', () => {
    const listing = makeListing({
      updatedAt: makeDate(1),
      photos: [makePhoto(5)],
      reviews: [makeReview()],
    })
    const result = computeTrustScore(listing, [listing], () => false)
    expect(result.score).toBe(100)
    expect(result.tier).toBe('high')
    expect(result.tierLabel).toBe('높음')
    expect(result.signals.every((s) => s.passed)).toBe(true)
  })

  test('no reviews → loses 25 points', () => {
    const listing = makeListing({
      updatedAt: makeDate(1),
      photos: [makePhoto(5)],
      reviews: [],
    })
    const result = computeTrustScore(listing, [listing], () => false)
    const reviewSignal = result.signals.find((s) => s.label === '거주 후기 있음')
    expect(reviewSignal?.passed).toBe(false)
    expect(reviewSignal?.points).toBe(0)
    expect(result.score).toBe(75)
  })

  test('stale listing (updated 10 days ago) → freshness = 0', () => {
    const listing = makeListing({
      updatedAt: makeDate(10),
      photos: [makePhoto(5)],
      reviews: [makeReview()],
    })
    const result = computeTrustScore(listing, [listing], () => false)
    const freshnessSignal = result.signals.find((s) => s.label === '최근 업데이트')
    expect(freshnessSignal?.passed).toBe(false)
    expect(freshnessSignal?.points).toBe(0)
    expect(result.score).toBe(75)
  })

  test('duplicate detected → loses 25 points', () => {
    const listing = makeListing({
      updatedAt: makeDate(1),
      photos: [makePhoto(5)],
      reviews: [makeReview()],
    })
    const result = computeTrustScore(listing, [listing], () => true)
    const dupSignal = result.signals.find((s) => s.label === '동일 위치 매물 없음')
    expect(dupSignal?.passed).toBe(false)
    expect(dupSignal?.points).toBe(0)
    expect(result.score).toBe(75)
  })

  test('no photos → photo recency = 0', () => {
    const listing = makeListing({
      updatedAt: makeDate(1),
      photos: [],
      reviews: [makeReview()],
    })
    const result = computeTrustScore(listing, [listing], () => false)
    const photoSignal = result.signals.find((s) => s.label === '최근 사진 업로드')
    expect(photoSignal?.passed).toBe(false)
    expect(result.score).toBe(85)
  })

  test('low trust listing (stale, no photo, no review, duplicate) → tier = low', () => {
    const listing = makeListing({
      updatedAt: makeDate(30),
      photos: [],
      reviews: [],
    })
    const result = computeTrustScore(listing, [listing], () => true)
    expect(result.score).toBeLessThan(50)
    expect(result.tier).toBe('low')
    expect(result.tierLabel).toBe('낮음')
  })

  test('moderate trust listing → tier = moderate', () => {
    const listing = makeListing({
      updatedAt: makeDate(5), // 15 pts
      photos: [makePhoto(5)], // 15 pts
      reviews: [makeReview()], // 25 pts
    })
    // no duplicate: +25, total 80 — add duplicate to reduce
    // market fit gives +10 (benefit of doubt when <3 peers) → 15+15+25+0+10 = 65
    const result = computeTrustScore(listing, [listing], () => true) // -25 for dup → 65
    expect(result.score).toBe(65)
    expect(result.tier).toBe('moderate')
  })

  test('detectDuplicate returns true when same address and price within 10%', () => {
    const original = makeListing({ id: 'a', price: 500000 })
    const duplicate = makeListing({ id: 'b', price: 520000 }) // 4% diff
    expect(detectDuplicate(original, [original, duplicate])).toBe(true)
  })

  test('detectDuplicate returns false when price differs > 10%', () => {
    const original = makeListing({ id: 'a', price: 500000 })
    const other = makeListing({ id: 'b', price: 650000 }) // 30% diff
    expect(detectDuplicate(original, [original, other])).toBe(false)
  })
})
