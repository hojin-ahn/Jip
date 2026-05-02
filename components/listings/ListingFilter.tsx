'use client'

import { useUIStore } from '@/stores/uiStore'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { PropertyType } from '@/types'

const dongs = ['전체', '합정동', '연남동', '성수동', '마포구', '강남구']
const propertyTypes: { value: PropertyType | ''; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'STUDIO', label: '스튜디오' },
  { value: 'ONE_ROOM', label: '원룸' },
  { value: 'TWO_ROOM', label: '투룸' },
  { value: 'OFFICE_TEL', label: '오피스텔' },
]

/** Inner filter controls — usable inside either the sidebar or a mobile dialog. */
export function FilterContent() {
  const { filter, mergeFilter, resetFilter } = useUIStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">필터</h2>
        <button
          onClick={resetFilter}
          className="text-xs text-gray-500 underline hover:text-gray-700"
        >
          초기화
        </button>
      </div>

      {/* Dong */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">동네</Label>
        <div className="flex flex-wrap gap-1.5">
          {dongs.map((dong) => (
            <button
              key={dong}
              onClick={() => mergeFilter({ dong: dong === '전체' ? undefined : dong })}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                (dong === '전체' && !filter.dong) || filter.dong === dong
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
              }`}
            >
              {dong}
            </button>
          ))}
        </div>
      </div>

      {/* Property type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">매물 종류</Label>
        <div className="flex flex-wrap gap-1.5">
          {propertyTypes.map(({ value, label }) => (
            <button
              key={label}
              onClick={() => mergeFilter({ propertyType: value || undefined })}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                (value === '' && !filter.propertyType) || filter.propertyType === value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          월세 최대{' '}
          <span className="text-blue-600 font-bold">
            {filter.maxPrice ? `${filter.maxPrice / 10000}만원` : '제한 없음'}
          </span>
        </Label>
        <Slider
          min={0}
          max={2000000}
          step={100000}
          value={[filter.maxPrice ?? 2000000]}
          onValueChange={(v) => {
            const val = Array.isArray(v) ? v[0] : (v as number)
            mergeFilter({ maxPrice: val === 2000000 ? undefined : val })
          }}
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0</span>
          <span>200만원</span>
        </div>
      </div>

      {/* Trust score minimum */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          최소 신뢰도{' '}
          <span className="text-blue-600 font-bold">{filter.trustScoreMin ?? 0}점</span>
        </Label>
        <Slider
          min={0}
          max={100}
          step={10}
          value={[filter.trustScoreMin ?? 0]}
          onValueChange={(v) => {
            const val = Array.isArray(v) ? v[0] : (v as number)
            mergeFilter({ trustScoreMin: val === 0 ? undefined : val })
          }}
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      {/* Min area */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          최소 면적{' '}
          <span className="text-blue-600 font-bold">
            {filter.minArea ? `${filter.minArea}㎡` : '제한 없음'}
          </span>
        </Label>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[filter.minArea ?? 0]}
          onValueChange={(v) => {
            const val = Array.isArray(v) ? v[0] : (v as number)
            mergeFilter({ minArea: val === 0 ? undefined : val })
          }}
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0㎡</span>
          <span>100㎡</span>
        </div>
      </div>
    </div>
  )
}

/** Desktop sidebar — hidden on mobile. */
export function ListingFilterPanel() {
  return (
    <aside className="hidden md:block w-64 shrink-0 p-4 border-r border-gray-200 h-full overflow-y-auto">
      <FilterContent />
    </aside>
  )
}
