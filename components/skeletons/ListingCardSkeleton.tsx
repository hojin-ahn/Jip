export function ListingCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 bg-gray-200 rounded w-24" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
      </div>
    </div>
  )
}

export function ListingCardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}
