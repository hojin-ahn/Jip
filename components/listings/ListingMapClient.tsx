'use client'

import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { useUIStore } from '@/stores/uiStore'
import { ListingMap } from './ListingMap'
import { Listing, ListingPage } from '@/types'

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
  const { filter } = useUIStore()
  const { data } = useQuery<{ listings: Pick<ListingPage, 'listings'> }>(MAP_LISTINGS_QUERY, {
    variables: { filter },
  })

  const listings: Listing[] = data?.listings?.listings ?? initialListings

  return <ListingMap listings={listings} />
}
