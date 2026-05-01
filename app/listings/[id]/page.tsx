export const dynamic = 'force-dynamic'

import { getClient } from '@/graphql/apolloClient'
import { gql } from '@apollo/client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Listing } from '@/types'
import { TrustBadge } from '@/components/trust/TrustBadge'
import { TrustSignalList } from '@/components/trust/TrustSignalList'
import { ReviewList } from '@/components/reviews/ReviewList'
import { ReviewSummary } from '@/components/reviews/ReviewSummary'
import Link from 'next/link'

const LISTING_QUERY = gql`
  query Listing($id: ID!) {
    listing(id: $id) {
      id
      title
      address {
        full
        dong
        lat
        lng
      }
      price
      deposit
      propertyType
      area
      floor
      totalFloors
      description
      photos {
        id
        url
        uploadedAt
      }
      reviews {
        id
        listingId
        tenancyPeriod
        ratings {
          noise
          pests
          winterCold
          summerHeat
          landlordResponse
          overallSatisfaction
        }
        pros
        cons
        createdAt
      }
      trustScore
      trustSignals {
        label
        passed
        points
      }
      broker {
        id
        name
        phone
      }
      createdAt
      updatedAt
    }
  }
`

const propertyTypeLabels: Record<string, string> = {
  STUDIO: '스튜디오',
  ONE_ROOM: '원룸',
  TWO_ROOM: '투룸',
  OFFICE_TEL: '오피스텔',
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const { data } = await getClient().query<{ listing: Listing | null }>({ query: LISTING_QUERY, variables: { id } })
    const listing = data?.listing
    if (!listing) return { title: '매물을 찾을 수 없습니다' }
    return {
      title: `${listing.title} — 집`,
      description: `${listing.address.dong} ${propertyTypeLabels[listing.propertyType]} 월세 ${(listing.price / 10000).toFixed(0)}만원. 신뢰도 ${listing.trustScore}점.`,
      openGraph: {
        title: listing.title,
        description: `신뢰도 ${listing.trustScore}점 | ${listing.address.dong} | 월세 ${(listing.price / 10000).toFixed(0)}만원`,
        images: listing.photos[0] ? [{ url: listing.photos[0].url }] : [],
      },
    }
  } catch {
    return { title: '집 — 매물 상세' }
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params

  let listing: Listing | null = null
  try {
    const { data } = await getClient().query<{ listing: Listing | null }>({ query: LISTING_QUERY, variables: { id } })
    listing = data?.listing ?? null
  } catch (err) {
    console.error('Listing fetch error:', err)
  }

  if (!listing) notFound()

  const isLowTrust = listing.trustScore < 50

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/listings" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        ← 목록으로
      </Link>

      {/* Low trust warning */}
      {isLowTrust && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <p className="font-semibold">⚠ 이 매물은 신뢰도가 낮습니다.</p>
          <p className="text-sm mt-1">직접 방문을 권장합니다.</p>
        </div>
      )}

      {/* Hero photo */}
      <div className="relative h-72 bg-gray-100 rounded-xl overflow-hidden mb-6">
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photos[0].url}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            사진 없음
          </div>
        )}
      </div>

      {/* Title + trust */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
        <TrustBadge score={listing.trustScore} />
      </div>

      <p className="text-gray-500 text-sm mb-6">{listing.address.full}</p>

      {/* Trust signals */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3 text-sm">신뢰도 분석</h2>
        <TrustSignalList signals={listing.trustSignals} />
      </div>

      {/* Listing details */}
      <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
        <div>
          <span className="text-gray-500">월세</span>
          <p className="font-bold text-lg">{(listing.price / 10000).toFixed(0)}만원</p>
        </div>
        <div>
          <span className="text-gray-500">보증금</span>
          <p className="font-semibold">{(listing.deposit / 10000).toFixed(0)}만원</p>
        </div>
        <div>
          <span className="text-gray-500">면적</span>
          <p className="font-semibold">{listing.area}㎡</p>
        </div>
        <div>
          <span className="text-gray-500">층수</span>
          <p className="font-semibold">
            {listing.floor ? `${listing.floor}층` : '정보 없음'}
            {listing.totalFloors ? ` / ${listing.totalFloors}층` : ''}
          </p>
        </div>
        <div>
          <span className="text-gray-500">매물 종류</span>
          <p className="font-semibold">{propertyTypeLabels[listing.propertyType]}</p>
        </div>
        <div>
          <span className="text-gray-500">동네</span>
          <p className="font-semibold">{listing.address.dong}</p>
        </div>
      </div>

      {listing.description && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-2">설명</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{listing.description}</p>
        </div>
      )}

      {/* Reviews section */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-xl text-gray-900">
            거주자 후기 ({listing.reviews.length})
          </h2>
          <Link
            href={`/listings/${listing.id}/review/new`}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            후기 작성
          </Link>
        </div>

        <ReviewSummary listingId={listing.id} reviewCount={listing.reviews.length} />
        <ReviewList reviews={listing.reviews} listingId={listing.id} />
      </div>
    </div>
  )
}
