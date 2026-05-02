'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@apollo/client/react'
import { gql, NetworkStatus } from '@apollo/client'
import { useInView } from 'react-intersection-observer'
import { Listing, ListingFilter, ListingPage } from '@/types'
import { ListingCard } from './ListingCard'
import { ListingCardSkeletonGrid } from '@/components/skeletons/ListingCardSkeleton'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/uiStore'

const LISTINGS_QUERY = gql`
  query Listings($filter: ListingFilter, $page: Int, $perPage: Int) {
    listings(filter: $filter, page: $page, perPage: $perPage) {
      listings {
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
        photos {
          id
          url
          uploadedAt
        }
        reviews {
          id
        }
        trustScore
        trustSignals {
          label
          passed
          points
        }
        createdAt
        updatedAt
      }
      totalCount
      hasNextPage
    }
  }
`

type Props = {
  initialListings?: Listing[]
  initialTotalCount?: number
  filter: ListingFilter
}

export function ListingGrid({ initialListings, initialTotalCount, filter }: Props) {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const { selectedListingId, resetFilter } = useUIStore()

  const { data, loading, error, fetchMore, networkStatus } = useQuery<{ listings: ListingPage }>(LISTINGS_QUERY, {
    variables: { filter, page: 1, perPage: 20 },
    notifyOnNetworkStatusChange: true,
  })

  // Scroll selected card into view when clicked from map
  useEffect(() => {
    if (!selectedListingId) return
    const el = cardRefs.current.get(selectedListingId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedListingId])

  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 })

  useEffect(() => {
    if (!inView || !data?.listings?.hasNextPage || networkStatus !== NetworkStatus.ready) return
    const currentPage = Math.ceil(data.listings.listings.length / 20)
    fetchMore({
      variables: { filter, page: currentPage + 1, perPage: 20 },
      updateQuery: (prev: { listings: ListingPage }, { fetchMoreResult }: { fetchMoreResult?: { listings: ListingPage } }) => {
        if (!fetchMoreResult) return prev
        return {
          listings: {
            ...fetchMoreResult.listings,
            listings: [
              ...prev.listings.listings,
              ...fetchMoreResult.listings.listings,
            ],
          },
        }
      },
    })
  }, [inView, data, networkStatus, filter, fetchMore])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-gray-500">데이터를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-xs text-red-400 max-w-xs text-center break-all">{error.message}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          다시 시도
        </Button>
      </div>
    )
  }

  const listings: Listing[] = data?.listings?.listings ?? initialListings ?? []
  const totalCount: number = data?.listings?.totalCount ?? initialTotalCount ?? 0

  if (!loading && listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-xl text-gray-400">매물이 없습니다</p>
        <p className="text-sm text-gray-500">필터를 바꿔보세요</p>
        <Button onClick={resetFilter} variant="outline">
          필터 초기화
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{totalCount}개 매물</p>
      <div className="space-y-3">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            innerRef={(el) => {
              if (el) cardRefs.current.set(listing.id, el)
              else cardRefs.current.delete(listing.id)
            }}
          />
        ))}
      </div>
      {loading && <ListingCardSkeletonGrid />}
      {data?.listings?.hasNextPage && (
        <div ref={sentinelRef} className="h-8" />
      )}
    </div>
  )
}
