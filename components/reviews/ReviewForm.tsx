'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const CREATE_REVIEW = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      listingId
      tenancyPeriod
      ratings {
        noise
        pests
        winterCold
        summerHeat
        landlordResponse
        overallSatisfaction
      }
      pros
      cons
      createdAt
    }
  }
`

type Props = { listingId: string }

const ratingFields = [
  { key: 'noise', label: '층간소음 (1=심함, 5=없음)' },
  { key: 'pests', label: '벌레 출몰 (1=심함, 5=없음)' },
  { key: 'winterCold', label: '겨울 단열 (1=추움, 5=따뜻함)' },
  { key: 'summerHeat', label: '여름 더위 (1=더움, 5=시원함)' },
  { key: 'landlordResponse', label: '집주인 응답 (1=불량, 5=우수)' },
  { key: 'overallSatisfaction', label: '전반적 만족도' },
] as const

type RatingKey = (typeof ratingFields)[number]['key']

type FormState = {
  ratings: Record<RatingKey, number>
  tenancyStart: string
  tenancyEnd: string
  pros: string
  cons: string
}

export function ReviewForm({ listingId }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    ratings: {
      noise: 3,
      pests: 3,
      winterCold: 3,
      summerHeat: 3,
      landlordResponse: 3,
      overallSatisfaction: 3,
    },
    tenancyStart: '',
    tenancyEnd: '',
    pros: '',
    cons: '',
  })
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  const [createReview, { loading }] = useMutation(CREATE_REVIEW, {
    onCompleted: () => {
      toast.success('후기가 등록되었습니다.')
      router.push(`/listings/${listingId}`)
      router.refresh()
    },
    onError: (err) => {
      toast.error(`후기 등록에 실패했습니다: ${err.message}`)
    },
  })

  function validate(): boolean {
    const errs: Partial<Record<string, string>> = {}
    if (!form.tenancyStart) errs.tenancyStart = '입주 시작일을 선택해주세요'
    if (!form.tenancyEnd) errs.tenancyEnd = '퇴거일을 선택해주세요'
    if (form.pros.length < 20) errs.pros = '좋았던 점을 20자 이상 작성해주세요'
    if (form.cons.length < 20) errs.cons = '아쉬운 점을 20자 이상 작성해주세요'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    createReview({
      variables: {
        input: {
          listingId,
          tenancyStart: new Date(form.tenancyStart).toISOString(),
          tenancyEnd: new Date(form.tenancyEnd).toISOString(),
          ...form.ratings,
          pros: form.pros,
          cons: form.cons,
        },
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-xl">
      {/* Rating sliders */}
      <div className="space-y-6">
        <h2 className="font-semibold text-gray-900">평점</h2>
        {ratingFields.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <Label className="text-sm">
              {label}
              <span className="ml-2 font-bold text-blue-600">{form.ratings[key]}</span>
            </Label>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[form.ratings[key]]}
              onValueChange={(v) => {
                const val = Array.isArray(v) ? v[0] : (v as number)
                setForm((prev) => ({
                  ...prev,
                  ratings: { ...prev.ratings, [key]: val },
                }))
              }}
            />
          </div>
        ))}
      </div>

      {/* Tenancy period */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900">입주 기간</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>입주 시작일</Label>
            <input
              type="date"
              value={form.tenancyStart}
              onChange={(e) => setForm((prev) => ({ ...prev, tenancyStart: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            {errors.tenancyStart && (
              <p className="text-xs text-red-500">{errors.tenancyStart}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>퇴거일</Label>
            <input
              type="date"
              value={form.tenancyEnd}
              onChange={(e) => setForm((prev) => ({ ...prev, tenancyEnd: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            {errors.tenancyEnd && (
              <p className="text-xs text-red-500">{errors.tenancyEnd}</p>
            )}
          </div>
        </div>
      </div>

      {/* Freeform */}
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>좋았던 점 (20자 이상)</Label>
          <Textarea
            value={form.pros}
            onChange={(e) => setForm((prev) => ({ ...prev, pros: e.target.value }))}
            placeholder="이 매물의 장점을 자세히 알려주세요"
            rows={3}
          />
          <p className="text-xs text-gray-400 text-right">{form.pros.length}자</p>
          {errors.pros && <p className="text-xs text-red-500">{errors.pros}</p>}
        </div>

        <div className="space-y-1">
          <Label>아쉬운 점 (20자 이상)</Label>
          <Textarea
            value={form.cons}
            onChange={(e) => setForm((prev) => ({ ...prev, cons: e.target.value }))}
            placeholder="개선이 필요한 점이나 불편했던 점을 알려주세요"
            rows={3}
          />
          <p className="text-xs text-gray-400 text-right">{form.cons.length}자</p>
          {errors.cons && <p className="text-xs text-red-500">{errors.cons}</p>}
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '등록 중...' : '후기 등록하기'}
      </Button>
    </form>
  )
}
