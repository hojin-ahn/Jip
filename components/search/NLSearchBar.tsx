'use client'

import { useState, useRef, useEffect } from 'react'
import { useLazyQuery } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { Input } from '@/components/ui/input'
import { useUIStore } from '@/stores/uiStore'
import { ListingFilter } from '@/types'

const PARSE_SEARCH_QUERY = gql`
  query ParseSearchQuery($query: String!) {
    parseSearchQuery(query: $query) {
      dong
      propertyType
      minPrice
      maxPrice
      minArea
      trustScoreMin
      keywords
    }
  }
`

type ParseResult = {
  parseSearchQuery: Partial<ListingFilter>
}

export function NLSearchBar() {
  const [input, setInput] = useState('')
  const [parsedIntent, setParsedIntent] = useState<string | null>(null)
  const [nlError, setNlError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { mergeFilter } = useUIStore()

  const [parseQuery, { loading, data, error }] = useLazyQuery<ParseResult>(PARSE_SEARCH_QUERY)

  useEffect(() => {
    if (!data?.parseSearchQuery) return
    // Strip __typename that Apollo Client adds to query results — it's not
    // a valid field on the ListingFilter input type and causes a 400.
    const { __typename: _, ...rest } = data.parseSearchQuery as typeof data.parseSearchQuery & { __typename?: string }
    const filter: ListingFilter = rest
    mergeFilter(filter)
    setNlError(null)

    const labels: Record<string, string> = {
      STUDIO: '스튜디오', ONE_ROOM: '원룸', TWO_ROOM: '투룸', OFFICE_TEL: '오피스텔',
    }
    const parts: string[] = []
    if (filter.dong) parts.push(filter.dong)
    if (filter.propertyType) parts.push(labels[filter.propertyType] ?? filter.propertyType)
    if (filter.maxPrice) parts.push(`₩${(filter.maxPrice / 10000).toFixed(0)}만원 이하`)
    if (filter.keywords) parts.push(filter.keywords)
    setParsedIntent(parts.length > 0 ? parts.join(', ') + '으로 검색합니다' : null)
  }, [data, mergeFilter])

  useEffect(() => {
    if (error) {
      setNlError('검색 파싱에 실패했습니다. 직접 필터를 사용해주세요.')
      setParsedIntent(null)
    }
  }, [error])

  function handleChange(value: string) {
    setInput(value)
    setParsedIntent(null)
    setNlError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 3) return
    debounceRef.current = setTimeout(() => {
      parseQuery({ variables: { query: value } })
    }, 600)
  }

  return (
    <div className="relative w-full max-w-lg">
      <div className="relative">
        <Input
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="예: 마포구 조용한 원룸 60만원 이하"
          className="pr-10 h-11"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {parsedIntent && (
        <p className="mt-1.5 text-xs text-blue-600 italic">{parsedIntent}</p>
      )}
      {nlError && (
        <p className="mt-1.5 text-xs text-red-500">{nlError}</p>
      )}
    </div>
  )
}
