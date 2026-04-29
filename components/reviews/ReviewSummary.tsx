'use client'

import { useQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { Badge } from '@/components/ui/badge'

const REVIEW_SUMMARY_QUERY = gql`
  query ReviewSummary($listingId: ID!) {
    reviewSummary(listingId: $listingId)
  }
`

type Props = { listingId: string; reviewCount: number }

export function ReviewSummary({ listingId, reviewCount }: Props) {
  const { data, loading, error } = useQuery<{ reviewSummary: string }>(REVIEW_SUMMARY_QUERY, {
    variables: { listingId },
    skip: reviewCount === 0,
  })

  if (reviewCount === 0) return null

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
          AI 요약
        </Badge>
        <span className="text-sm font-semibold text-blue-900">거주자 후기 요약</span>
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-blue-200 rounded w-full" />
          <div className="h-3 bg-blue-200 rounded w-4/5" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">후기 요약을 불러오는 중 오류가 발생했습니다.</p>
      ) : (
        <p className="text-sm text-blue-800 leading-relaxed">{data?.reviewSummary}</p>
      )}
    </div>
  )
}
