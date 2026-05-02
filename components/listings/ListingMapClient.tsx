'use client'

import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { useUIStore } from '@/stores/uiStore'
import { ListingMap } from './ListingMap'
import { Listing, ListingPage } from '@/types'
import { cn } from '@/lib/utils'

const MAP_LISTINGS_QUERY = gql`
  query MapListings($filter: ListingFilter) {
    listings(filter: $filter, page: 1, perPage: 200) {
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
        trustScore
        photos {
          id
          url
          uploadedAt
        }
        reviews {
          id
        }
        deposit
        propertyType
        area
        floor
        totalFloors
        trustSignals {
          label
          passed
          points
        }
        createdAt
        updatedAt
      }
    }
  }
`

type Props = { initialListings: Listing[] }

export function ListingMapClient({ initialListings }: Props) {
  const { filter, mobileView } = useUIStore()
  const { data } = useQuery<{ listings: Pick<ListingPage, 'listings'> }>(MAP_LISTINGS_QUERY, {
    variables: { filter },
  })

  const listings: Listing[] = data?.listings?.listings ?? initialListings

  return (
    <div
      className={cn(
        'flex-1 overflow-hidden',
        // Mobile: only visible in map view
        mobileView === 'map' ? 'flex' : 'hidden md:flex'
      )}
    >
      <ListingMap listings={listings} />
    </div>
  )
}
