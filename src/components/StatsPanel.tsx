import type { DailyStats } from '../lib/types'

interface StatsPanelProps {
  stats: DailyStats
  todayDiff: number
}

const DIFF_LABELS: Record<number, string> = {
  0: 'EXACT',
  1: 'OFF 1',
  2: 'OFF 2',
  3: 'OFF 3',
  4: 'OFF 4+',
}

function diffLabel(diff: number): string {
  if (diff >= 4) return 'OFF 4+'
  return DIFF_LABELS[diff] ?? `OFF ${diff}`
}

export function StatsPanel({ stats, todayDiff }: StatsPanelProps) {
  const played = stats.history.length
  const exactCount = stats.distribution[0] ?? 0
  const exactPct = played > 0 ? Math.round((exactCount / played) * 100) : 0

  // Build histogram buckets: 0, 1, 2, 3, 4+
  const buckets = [0, 1, 2, 3, 4]
  const bucketCounts = buckets.map(b => {
    if (b < 4) return stats.distribution[b] ?? 0
    // 4+ bucket: sum all diffs >= 4
    return Object.entries(stats.distribution)
      .filter(([k]) => Number(k) >= 4)
      .reduce((sum, [, v]) => sum + v, 0)
  })
  const maxCount = Math.max(...bucketCounts, 1)

  return (
    <div className="w-full py-2">
      {/* Summary row - Wordle 4-column stats */}
      <div className="mb-4 grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-[28px] font-light text-[var(--color-text)]">
            {played}
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)]">Played</div>
        </div>
        <div>
          <div className="text-[28px] font-light text-[var(--color-text)]">
            {exactPct}
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)]">Exact %</div>
        </div>
        <div>
          <div className="text-[28px] font-light text-[var(--color-text)]">
            {stats.streak}
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)]">Current<br />Streak</div>
        </div>
        <div>
          <div className="text-[28px] font-light text-[var(--color-text)]">
            {stats.maxStreak}
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)]">Max<br />Streak</div>
        </div>
      </div>

      {/* Distribution heading */}
      <div className="mb-2 text-center text-[12px] font-bold uppercase tracking-wider text-[var(--color-text)]">
        Guess Distribution
      </div>

      {/* Distribution histogram - Wordle style horizontal bars */}
      <div className="space-y-[3px]">
        {buckets.map((b, i) => {
          const count = bucketCounts[i]
          const widthPct = maxCount > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 8 : 4) : 4
          const isToday = todayDiff >= 4 ? b === 4 : b === todayDiff

          return (
            <div key={b} className="flex items-center gap-1">
              <span className="w-10 shrink-0 text-right text-[12px] font-bold text-[var(--color-text)]">
                {diffLabel(b)}
              </span>
              <div className="relative flex-1">
                <div
                  className="flex h-5 items-center justify-end px-1 text-[11px] font-bold text-white"
                  style={{
                    width: `${widthPct}%`,
                    minWidth: '20px',
                    backgroundColor: isToday ? 'var(--color-green)' : 'var(--color-border)',
                  }}
                >
                  {count}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
