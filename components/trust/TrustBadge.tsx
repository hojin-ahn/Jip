import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Props = {
  score: number
  size?: 'sm' | 'md'
}

function getTier(score: number): { label: string; className: string } {
  if (score >= 80) return { label: '높음', className: 'bg-green-100 text-green-800 border-green-200' }
  if (score >= 50) return { label: '보통', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  return { label: '낮음', className: 'bg-red-100 text-red-800 border-red-200' }
}

export function TrustBadge({ score, size = 'md' }: Props) {
  const { label, className } = getTier(score)
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold border',
        className,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      )}
    >
      신뢰도 {score}점 ({label})
    </Badge>
  )
}
