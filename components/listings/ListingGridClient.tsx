'use client'

import { useUIStore } from '@/stores/uiStore'
import { ListingGrid } from './ListingGrid'
import { Listing } from '@/types'
import { cn } from '@/lib/utils'

type Props = { initialListings: Listing[]; initialTotalCount: number }

export function ListingGridClient({ initialListings, initialTotalCount }: Props) {
  const { filter, mobileView } = useUIStore()
  return (
    <div
      className={cn(
        // Desktop: fixed 320px column
        'md:w-80 md:shrink-0 md:block overflow-y-auto border-r border-gray-200 p-4',
        // Mobile: full-width when list view, hidden when map view
        mobileView === 'list' ? 'flex-1' : 'hidden'
      )}
    >
      <ListingGrid
        initialListings={initialListings}
        initialTotalCount={initialTotalCount}
        filter={filter}
      />
    </div>
  )
}
