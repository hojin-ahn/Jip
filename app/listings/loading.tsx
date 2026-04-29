import { ListingCardSkeletonGrid } from '@/components/skeletons/ListingCardSkeleton'

export default function Loading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex items-center gap-4 px-6 py-3 border-b border-gray-200 bg-white">
        <div className="text-xl font-bold text-gray-900">집</div>
        <div className="h-11 w-96 bg-gray-200 rounded-md animate-pulse" />
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* Filter skeleton */}
        <aside className="w-64 shrink-0 p-4 border-r border-gray-200 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </aside>
        {/* Card list skeleton */}
        <div className="w-80 p-4 border-r border-gray-200 overflow-y-auto">
          <ListingCardSkeletonGrid />
        </div>
        {/* Map skeleton */}
        <div className="flex-1 bg-gray-100 animate-pulse" />
      </div>
    </div>
  )
}
