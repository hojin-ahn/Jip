export function DetailPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      {/* Hero photo */}
      <div className="h-72 bg-gray-200 rounded-xl mb-6" />
      {/* Title */}
      <div className="h-7 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-6" />
      {/* Trust signals */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 bg-gray-200 rounded-full w-24" />
        ))}
      </div>
      {/* Details */}
      <div className="space-y-2 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded w-1/2" />
        ))}
      </div>
      {/* Reviews */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="flex gap-1">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-4 w-4 bg-gray-200 rounded-full" />
              ))}
            </div>
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
