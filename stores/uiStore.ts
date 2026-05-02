import { create } from 'zustand'
import { ListingFilter } from '../types'

type UIStore = {
  hoveredListingId: string | null
  selectedListingId: string | null
  filter: ListingFilter
  mobileView: 'list' | 'map'
  setHoveredListingId: (id: string | null) => void
  setSelectedListingId: (id: string | null) => void
  setFilter: (filter: ListingFilter) => void
  mergeFilter: (partial: Partial<ListingFilter>) => void
  resetFilter: () => void
  setMobileView: (view: 'list' | 'map') => void
}

const defaultFilter: ListingFilter = {}

export const useUIStore = create<UIStore>((set) => ({
  hoveredListingId: null,
  selectedListingId: null,
  filter: defaultFilter,
  mobileView: 'list',
  setHoveredListingId: (id) => set({ hoveredListingId: id }),
  setSelectedListingId: (id) => set({ selectedListingId: id }),
  setFilter: (filter) => set({ filter }),
  mergeFilter: (partial) =>
    set((state) => ({ filter: { ...state.filter, ...partial } })),
  resetFilter: () => set({ filter: defaultFilter }),
  setMobileView: (view) => set({ mobileView: view }),
}))
