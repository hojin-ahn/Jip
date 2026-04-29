import { ReviewForm } from '@/components/reviews/ReviewForm'
import Link from 'next/link'

type Props = { params: Promise<{ id: string }> }

export default async function NewReviewPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href={`/listings/${id}`}
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
      >
        ← 매물로 돌아가기
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">후기 작성</h1>
      <ReviewForm listingId={id} />
    </div>
  )
}
