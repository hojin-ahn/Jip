export const dynamic = 'force-dynamic'

import { Listing } from '@/types'
import { fetchListingsSSR } from '@/lib/queries/serverListings'
import { ListingGridClient } from '@/components/listings/ListingGridClient'
import { ListingMapClient } from '@/components/listings/ListingMapClient'
import { ListingFilterPanel } from '@/components/listings/ListingFilter'
import { NLSearchBar } from '@/components/search/NLSearchBar'

export default async function ListingsPage() {
  let initialListings: Listing[] = []
  let initialTotalCount = 0

  try {
    const result = await fetchListingsSSR(20)
    initialListings = result.listings
    initialTotalCount = result.totalCount
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
