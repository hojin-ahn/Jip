'use client'

import { useUIStore } from '@/stores/uiStore'
import { ListingGrid } from './ListingGrid'
import { Listing } from '@/types'

type Props = { initialListings: Listing[]; initialTotalCount: number }

export function ListingGridClient({ initialListings, initialTotalCount }: Props) {
  const { filter } = useUIStore()
  return (
    <div className="w-80 shrink-0 overflow-y-auto border-r border-gray-200 p-4">
      <ListingGrid
        initialListings={initialListings}
        initialTotalCount={initialTotalCount}
        filter={filter}
      />
    </div>
  )
}
