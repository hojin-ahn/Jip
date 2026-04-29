import { Review } from '@/types'

type Props = { review: Review }

const ratingLabels: Record<keyof Review['ratings'], string> = {
  noise: '층간소음',
  pests: '벌레',
  winterCold: '겨울 단열',
  summerHeat: '여름 더위',
  landlordResponse: '집주인 응답',
  overallSatisfaction: '전반 만족도',
}

function RatingDots({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${i < value ? 'bg-blue-500' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

export function ReviewCard({ review }: Props) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">{review.tenancyPeriod}</span>
        <span className="text-xs text-gray-400">
          전반 만족도 {review.ratings.overallSatisfaction}/5
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(ratingLabels) as Array<keyof Review['ratings']>).map((key) => (
          <div key={key} className="space-y-1">
            <span className="text-xs text-gray-500">{ratingLabels[key]}</span>
            <RatingDots value={review.ratings[key]} />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-xs font-semibold text-green-700">좋았던 점</span>
          <p className="text-sm text-gray-700 mt-0.5">{review.pros}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-red-600">아쉬운 점</span>
          <p className="text-sm text-gray-700 mt-0.5">{review.cons}</p>
        </div>
      </div>
    </div>
  )
}
