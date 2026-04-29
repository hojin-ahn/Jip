'use client'

import { useRef, useCallback } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Listing } from '@/types'
import { useUIStore } from '@/stores/uiStore'

type Props = { listings: Listing[] }

function pinColor(score: number): string {
  if (score >= 80) return '#16a34a' // green
  if (score >= 50) return '#ca8a04' // yellow
  return '#dc2626' // red
}

export function ListingMap({ listings }: Props) {
  const { hoveredListingId, selectedListingId, setHoveredListingId, setSelectedListingId } =
    useUIStore()

  const handlePinClick = useCallback(
    (id: string) => {
      setSelectedListingId(id)
    },
    [setSelectedListingId]
  )

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!token || token === 'pk.placeholder') {
    return (
      <div className="flex-1 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
        지도를 표시하려면 NEXT_PUBLIC_MAPBOX_TOKEN을 설정해주세요
      </div>
    )
  }

  return (
    <div className="flex-1 h-full">
      <Map
        mapboxAccessToken={token}
        initialViewState={{
          longitude: 126.9785,
          latitude: 37.566,
          zoom: 12,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        <NavigationControl position="top-right" />
        {listings.map((listing) => {
          const isActive =
            hoveredListingId === listing.id || selectedListingId === listing.id
          return (
            <Marker
              key={listing.id}
              longitude={listing.address.lng}
              latitude={listing.address.lat}
              anchor="bottom"
              onClick={() => handlePinClick(listing.id)}
            >
              <div
                onMouseEnter={() => setHoveredListingId(listing.id)}
                onMouseLeave={() => setHoveredListingId(null)}
                title={listing.title}
                style={{
                  width: isActive ? 18 : 14,
                  height: isActive ? 18 : 14,
                  borderRadius: '50%',
                  backgroundColor: pinColor(listing.trustScore),
                  border: isActive ? '3px solid white' : '2px solid white',
                  boxShadow: isActive
                    ? '0 0 0 3px rgba(59,130,246,0.6)'
                    : '0 1px 4px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              />
            </Marker>
          )
        })}
      </Map>
    </div>
  )
}
