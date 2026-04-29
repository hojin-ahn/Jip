import { TrustSignal } from '@/types'

type Props = { signals: TrustSignal[] }

export function TrustSignalList({ signals }: Props) {
  return (
    <ul className="space-y-1.5">
      {signals.map((signal) => (
        <li key={signal.label} className="flex items-center gap-2 text-sm">
          <span className={signal.passed ? 'text-green-600' : 'text-yellow-600'}>
            {signal.passed ? '✔' : '⚠'}
          </span>
          <span className={signal.passed ? 'text-gray-800' : 'text-gray-500'}>
            {signal.label}
          </span>
          <span className="ml-auto text-xs text-gray-400">+{signal.points}점</span>
        </li>
      ))}
    </ul>
  )
}
