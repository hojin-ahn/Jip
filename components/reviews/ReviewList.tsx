import { Review } from '@/types'
import { ReviewCard } from './ReviewCard'

type Props = { reviews: Review[]; listingId: string }

export function ReviewList({ reviews, listingId }: Props) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-base">아직 등록된 후기가 없습니다.</p>
        <a
          href={`/listings/${listingId}/review/new`}
          className="mt-3 inline-block text-sm text-blue-600 underline"
        >
          첫 번째 후기를 작성해보세요
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}
