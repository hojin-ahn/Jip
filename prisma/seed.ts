import { PrismaClient, PropertyType } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

const UNSPLASH_APARTMENT_PHOTOS = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
]

type DongConfig = {
  dong: string
  prefix: string
  lat: number
  lng: number
  latSpread: number
  lngSpread: number
}

const DONGS: DongConfig[] = [
  { dong: '합정동', prefix: '서울시 마포구 합정동', lat: 37.549, lng: 126.914, latSpread: 0.008, lngSpread: 0.010 },
  { dong: '연남동', prefix: '서울시 마포구 연남동', lat: 37.562, lng: 126.922, latSpread: 0.007, lngSpread: 0.009 },
  { dong: '성수동', prefix: '서울시 성동구 성수동', lat: 37.544, lng: 127.056, latSpread: 0.010, lngSpread: 0.012 },
  { dong: '마포구', prefix: '서울시 마포구 공덕동', lat: 37.543, lng: 126.950, latSpread: 0.012, lngSpread: 0.014 },
  { dong: '강남구', prefix: '서울시 강남구 역삼동', lat: 37.499, lng: 127.028, latSpread: 0.015, lngSpread: 0.015 },
]

const PROPERTY_TYPES: PropertyType[] = ['STUDIO', 'ONE_ROOM', 'TWO_ROOM', 'OFFICE_TEL']

// Base prices per dong per type (monthly rent in KRW)
const BASE_PRICES: Record<string, Record<string, number>> = {
  합정동: { STUDIO: 500000, ONE_ROOM: 650000, TWO_ROOM: 900000, OFFICE_TEL: 750000 },
  연남동: { STUDIO: 520000, ONE_ROOM: 700000, TWO_ROOM: 950000, OFFICE_TEL: 780000 },
  성수동: { STUDIO: 600000, ONE_ROOM: 800000, TWO_ROOM: 1100000, OFFICE_TEL: 900000 },
  마포구: { STUDIO: 480000, ONE_ROOM: 630000, TWO_ROOM: 850000, OFFICE_TEL: 720000 },
  강남구: { STUDIO: 900000, ONE_ROOM: 1200000, TWO_ROOM: 1800000, OFFICE_TEL: 1400000 },
}

const PROS_OPTIONS = [
  '교통이 매우 편리하고 지하철역과 가깝습니다. 편의시설도 풍부합니다.',
  '조용한 주거 환경으로 공부나 재택근무에 적합합니다.',
  '햇빛이 잘 들어오고 환기가 잘 됩니다. 낮에는 매우 쾌적합니다.',
  '집주인이 매우 친절하고 문제 발생 시 빠르게 해결해 주십니다.',
  '건물 관리가 잘 되어 있고 공용 공간도 깨끗합니다.',
  '인근 카페와 식당이 많아 생활이 편리합니다.',
  '방음이 잘 되어 있어 층간소음 걱정이 없습니다.',
  '리모델링이 최근에 되어 내부가 깔끔하고 현대적입니다.',
]

const CONS_OPTIONS = [
  '주차 공간이 협소하여 차가 있는 경우 불편할 수 있습니다.',
  '여름에 다소 덥지만 에어컨으로 충분히 해결 가능합니다.',
  '엘리베이터가 없어 높은 층 거주 시 불편할 수 있습니다.',
  '건물이 오래되어 겨울에 단열이 조금 아쉽습니다.',
  '주변 식당들이 일찍 문을 닫아 밤늦게 식사하기 불편합니다.',
  '수납 공간이 다소 부족하여 추가 가구가 필요합니다.',
  '창문이 작아 채광이 아쉽지만 생활에 큰 불편은 없습니다.',
  '근처 공사 소음이 평일 낮에 발생합니다.',
]

async function main() {
  // Clear existing data
  await prisma.review.deleteMany()
  await prisma.photo.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.broker.deleteMany()

  // Create brokers
  const brokers = await Promise.all([
    prisma.broker.create({ data: { name: '김민준 공인중개사', phone: '010-1234-5678' } }),
    prisma.broker.create({ data: { name: '이서연 부동산', phone: '010-9876-5432' } }),
    prisma.broker.create({ data: { name: '박도현 공인중개사', phone: '010-5555-7777' } }),
  ])

  const listings: { id: string; dong: string; propertyType: string; price: number }[] = []

  // Generate 50+ listings across 5 dongs
  let listingIndex = 0
  for (const dongConfig of DONGS) {
    const countPerDong = dongConfig.dong === '강남구' ? 12 : 10

    for (let i = 0; i < countPerDong; i++) {
      const propertyType = PROPERTY_TYPES[listingIndex % PROPERTY_TYPES.length]
      const basePrice = BASE_PRICES[dongConfig.dong][propertyType]
      // Most within ±25% of base, a few outliers
      const isOutlier = listingIndex % 15 === 0
      const priceMultiplier = isOutlier
        ? Math.random() > 0.5 ? 1.4 : 0.5 // outliers
        : 0.85 + Math.random() * 0.3 // ±15%
      const price = Math.round((basePrice * priceMultiplier) / 10000) * 10000

      const deposit = price * randomBetween(5, 15)
      const area = propertyType === 'STUDIO' ? randomBetween(15, 30) :
                   propertyType === 'ONE_ROOM' ? randomBetween(25, 45) :
                   propertyType === 'TWO_ROOM' ? randomBetween(45, 75) :
                   randomBetween(30, 60)

      // Varied updatedAt to exercise trust score
      const updatedDaysAgo = listingIndex % 5 === 0 ? randomBetween(8, 30) : // stale
                             listingIndex % 3 === 0 ? randomBetween(4, 7) :   // moderate
                             randomBetween(0, 3)                              // fresh

      const streetNum = randomBetween(1, 999)
      const address = `${dongConfig.prefix} ${streetNum}-${randomBetween(1, 20)}`
      const lat = dongConfig.lat + (Math.random() - 0.5) * dongConfig.latSpread
      const lng = dongConfig.lng + (Math.random() - 0.5) * dongConfig.lngSpread

      const floorNum = randomBetween(1, 10)
      const totalFloors = floorNum + randomBetween(0, 5)

      const titlePrefixes = ['깔끔한', '조용한', '햇살 좋은', '교통 편리한', '리모델링 완료']
      const titlePrefix = titlePrefixes[listingIndex % titlePrefixes.length]
      const typeLabel = propertyType === 'STUDIO' ? '스튜디오' :
                        propertyType === 'ONE_ROOM' ? '원룸' :
                        propertyType === 'TWO_ROOM' ? '투룸' : '오피스텔'
      const title = `${titlePrefix} ${dongConfig.dong} ${typeLabel}`

      const broker = listingIndex % 4 === 0 ? null : brokers[listingIndex % brokers.length]

      const listing = await prisma.listing.create({
        data: {
          title,
          dong: dongConfig.dong,
          address,
          lat,
          lng,
          price,
          deposit,
          propertyType,
          area,
          floor: floorNum,
          totalFloors,
          description: `${dongConfig.dong}에 위치한 ${typeLabel}입니다. 관리비 별도. 주변에 편의시설이 풍부합니다.`,
          brokerId: broker?.id ?? null,
          updatedAt: daysAgo(updatedDaysAgo),
          createdAt: daysAgo(updatedDaysAgo + randomBetween(5, 60)),
        },
      })

      listings.push({
        id: listing.id,
        dong: dongConfig.dong,
        propertyType,
        price,
      })
      listingIndex++
    }
  }

  // Create duplicate listings (same address, similar price) — 5 pairs
  const duplicateAddresses = [
    '서울시 마포구 합정동 123-5',
    '서울시 마포구 연남동 456-3',
    '서울시 성동구 성수동 789-1',
    '서울시 마포구 공덕동 234-7',
    '서울시 강남구 역삼동 567-2',
  ]
  const dupDongs = ['합정동', '연남동', '성수동', '마포구', '강남구']
  const dupLats = [37.549, 37.562, 37.544, 37.543, 37.499]
  const dupLngs = [126.914, 126.922, 127.056, 126.950, 127.028]

  for (let i = 0; i < 5; i++) {
    const basePrice = 600000 + i * 100000
    for (let j = 0; j < 2; j++) {
      const price = basePrice + randomBetween(-30000, 30000) // within 10%
      await prisma.listing.create({
        data: {
          title: `중복 매물 테스트 ${i + 1}-${j + 1}`,
          dong: dupDongs[i],
          address: duplicateAddresses[i],
          lat: dupLats[i] + (Math.random() - 0.5) * 0.001,
          lng: dupLngs[i] + (Math.random() - 0.5) * 0.001,
          price,
          deposit: price * 8,
          propertyType: 'ONE_ROOM',
          area: 30,
          floor: 2,
          totalFloors: 5,
          updatedAt: daysAgo(randomBetween(1, 5)),
          createdAt: daysAgo(randomBetween(10, 30)),
        },
      })
    }
  }

  // Add photos to all listings (varied uploadedAt)
  const allListings = await prisma.listing.findMany()
  for (let i = 0; i < allListings.length; i++) {
    const l = allListings[i]
    const photoCount = randomBetween(1, 4)
    const photoUploadedDaysAgo = i % 6 === 0 ? randomBetween(31, 60) : randomBetween(0, 25) // some old

    for (let p = 0; p < photoCount; p++) {
      await prisma.photo.create({
        data: {
          listingId: l.id,
          url: UNSPLASH_APARTMENT_PHOTOS[(i + p) % UNSPLASH_APARTMENT_PHOTOS.length],
          uploadedAt: daysAgo(photoUploadedDaysAgo),
        },
      })
    }
  }

  // Add reviews to 15+ listings
  const listingsForReview = allListings.slice(0, 20)
  for (let i = 0; i < listingsForReview.length; i++) {
    const l = listingsForReview[i]
    const reviewCount = i < 5 ? 3 : i < 12 ? 2 : 1

    for (let r = 0; r < reviewCount; r++) {
      const tenancyStartDays = randomBetween(365, 1095)
      const tenancyEndDays = randomBetween(30, tenancyStartDays - 30)

      await prisma.review.create({
        data: {
          listingId: l.id,
          tenancyStart: daysAgo(tenancyStartDays),
          tenancyEnd: daysAgo(tenancyEndDays),
          noise: randomBetween(2, 5),
          pests: randomBetween(3, 5),
          winterCold: randomBetween(2, 5),
          summerHeat: randomBetween(2, 5),
          landlordResponse: randomBetween(3, 5),
          overallSatisfaction: randomBetween(3, 5),
          pros: PROS_OPTIONS[(i + r) % PROS_OPTIONS.length],
          cons: CONS_OPTIONS[(i + r) % CONS_OPTIONS.length],
          createdAt: daysAgo(tenancyEndDays - randomBetween(1, 30)),
        },
      })
    }
  }

  const finalCount = await prisma.listing.count()
  const reviewCount = await prisma.review.count()
  const photoCount = await prisma.photo.count()
  console.log(`Seed complete: ${finalCount} listings, ${reviewCount} reviews, ${photoCount} photos`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
