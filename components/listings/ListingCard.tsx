'use client'

import Link from 'next/link'
import { Listing } from '@/types'
import { TrustBadge } from '@/components/trust/TrustBadge'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

type Props = { listing: Listing; innerRef?: React.Ref<HTMLDivElement> }

const propertyTypeLabels: Record<string, string> = {
  STUDIO: '스튜디오',
  ONE_ROOM: '원룸',
  TWO_ROOM: '투룸',
  OFFICE_TEL: '오피스텔',
}

export function ListingCard({ listing, innerRef }: Props) {
  const { hoveredListingId, selectedListingId, setHoveredListingId } = useUIStore()
  const isHighlighted =
    hoveredListingId === listing.id || selectedListingId === listing.id

  return (
    <div
      ref={innerRef}
      data-listing-id={listing.id}
      onMouseEnter={() => setHoveredListingId(listing.id)}
      onMouseLeave={() => setHoveredListingId(null)}
      className={cn(
        'rounded-lg border overflow-hidden transition-all duration-150 cursor-pointer',
        isHighlighted
          ? 'border-blue-400 shadow-md ring-2 ring-blue-200'
          : 'border-gray-200 hover:shadow-sm'
      )}
    >
      <Link href={`/listings/${listing.id}`} className="block">
        {/* Photo */}
        <div className="relative h-44 bg-gray-100 overflow-hidden">
          {listing.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.photos[0].url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              사진 없음
            </div>
          )}
          <div className="absolute bottom-2 left-2">
            <TrustBadge score={listing.trustScore} size="sm" />
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-1">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{listing.title}</h3>
          <p className="text-xs text-gray-500">
            {listing.address.dong} · {propertyTypeLabels[listing.propertyType]} · {listing.area}㎡
          </p>
          <p className="text-base font-bold text-gray-900">
            월세 {(listing.price / 10000).toFixed(0)}만원
            <span className="text-xs font-normal text-gray-500 ml-1">
              / 보증금 {(listing.deposit / 10000).toFixed(0)}만원
            </span>
          </p>
          {listing.reviews.length > 0 && (
            <p className="text-xs text-blue-600">후기 {listing.reviews.length}개</p>
          )}
        </div>
      </Link>
    </div>
  )
}
