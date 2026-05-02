'use client'

import { useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { FilterContent } from './ListingFilter'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/** Visible only on mobile (md:hidden). View toggle + filter dialog trigger. */
export function MobileControls() {
  const { mobileView, setMobileView } = useUIStore()
  const [filterOpen, setFilterOpen] = useState(false)

  return (
    <>
      <div className="flex md:hidden items-center gap-2 shrink-0">
        {/* List / Map toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
          <button
            onClick={() => setMobileView('list')}
            className={`px-3 py-1.5 transition-colors ${
              mobileView === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            목록
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={`px-3 py-1.5 transition-colors ${
              mobileView === 'map'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            지도
          </button>
        </div>

        {/* Filter dialog trigger */}
        <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)}>
          필터
        </Button>
      </div>

      {/* Filter dialog — full-height sheet on mobile */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">필터</DialogTitle>
          </DialogHeader>
          <FilterContent />
        </DialogContent>
      </Dialog>
    </>
  )
}
