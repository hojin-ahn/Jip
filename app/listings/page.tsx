import { getClient } from '@/graphql/apolloClient'
import { gql } from '@apollo/client'
import { Listing } from '@/types'
import { ListingGridClient } from '@/components/listings/ListingGridClient'
import { ListingMapClient } from '@/components/listings/ListingMapClient'
import { ListingFilterPanel } from '@/components/listings/ListingFilter'
import { NLSearchBar } from '@/components/search/NLSearchBar'

const LISTINGS_QUERY = gql`
  query ListingsSSR {
    listings(page: 1, perPage: 20) {
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

export default async function ListingsPage() {
  let initialListings: Listing[] = []
  let initialTotalCount = 0

  try {
    const result = await getClient().query<{ listings: { listings: Listing[]; totalCount: number } }>({ query: LISTINGS_QUERY })
    initialListings = result.data?.listings.listings ?? []
    initialTotalCount = result.data?.listings.totalCount ?? 0
  } catch (err) {
    console.error('SSR listings fetch failed:', err)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-gray-200 bg-white z-10">
        <a href="/listings" className="text-xl font-bold text-gray-900">
          집
        </a>
        <NLSearchBar />
      </header>

      {/* Body: filter | list | map */}
      <div className="flex flex-1 overflow-hidden">
        <ListingFilterPanel />
        <ListingGridClient
          initialListings={initialListings}
          initialTotalCount={initialTotalCount}
        />
        <ListingMapClient initialListings={initialListings} />
      </div>
    </div>
  )
}
