export type PropertyType = 'STUDIO' | 'ONE_ROOM' | 'TWO_ROOM' | 'OFFICE_TEL'

export type TrustSignal = {
  label: string
  passed: boolean
  points: number
}

export type ReviewRatings = {
  noise: number
  pests: number
  winterCold: number
  summerHeat: number
  landlordResponse: number
  overallSatisfaction: number
}

export type Review = {
  id: string
  listingId: string
  tenancyPeriod: string
  ratings: ReviewRatings
  pros: string
  cons: string
  createdAt: string
}

export type Photo = {
  id: string
  url: string
  uploadedAt: string
}

export type Address = {
  full: string
  dong: string
  lat: number
  lng: number
}

export type Broker = {
  id: string
  name: string
  phone: string | null
}

export type Listing = {
  id: string
  title: string
  address: Address
  price: number
  deposit: number
  propertyType: PropertyType
  area: number
  floor: number | null
  totalFloors: number | null
  description: string | null
  photos: Photo[]
  reviews: Review[]
  trustScore: number
  trustSignals: TrustSignal[]
  broker: Broker | null
  createdAt: string
  updatedAt: string
}

export type ListingFilter = {
  dong?: string
  propertyType?: PropertyType
  minPrice?: number
  maxPrice?: number
  minArea?: number
  trustScoreMin?: number
  keywords?: string
}

export type ListingPage = {
  listings: Listing[]
  totalCount: number
  hasNextPage: boolean
}
