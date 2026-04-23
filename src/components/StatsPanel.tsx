import { useState, useEffect } from 'react'
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

function getNextResetTime(): Date {
  const now = new Date()
  const next = new Date(now)
  next.setUTCDate(next.getUTCDate() + (now.getUTCHours() >= 5 ? 1 : 0))
  next.setUTCHours(5, 0, 0, 0)
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function StatsPanel({ stats, todayDiff }: StatsPanelProps) {
  const [countdown, setCountdown] = useState(() => {
    const ms = getNextResetTime().getTime() - Date.now()
    return formatCountdown(ms)
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = getNextResetTime().getTime() - Date.now()
      setCountdown(formatCountdown(ms))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const played = stats.history.length
  const exactCount = stats.distribution[0] ?? 0
  const exactPct = played > 0 ? Math.round((exactCount / played) * 100) : 0

  // Build histogram buckets: 0, 1, 2, 3, 4+
  const buckets = [0, 1, 2, 3, 4]
  const bucketCounts = buckets.map(b => {
    if (b < 4) return stats.distribution[b] ?? 0
    return Object.entries(stats.distribution)
      .filter(([k]) => Number(k) >= 4)
      .reduce((sum, [, v]) => sum + v, 0)
  })
  const maxCount = Math.max(...bucketCounts, 1)

  return (
    <div className="w-full">
      {/* Stat summary rows */}
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[28px] font-light leading-none text-[var(--color-text)]">
            {played}
          </div>
          <div className="mt-1 text-[10px] text-[var(--color-text-secondary)]">Played</div>
        </div>
        <div>
          <div className="text-[28px] font-light leading-none text-[var(--color-text)]">
            {exactPct}
          </div>
          <div className="mt-1 text-[10px] text-[var(--color-text-secondary)]">Exact %</div>
        </div>
        <div>
          <div className="text-[28px] font-light leading-none text-[var(--color-text)]">
            {stats.playStreak ?? 0}/{stats.maxPlayStreak ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-[var(--color-text-secondary)]">Daily Streak</div>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="text-[28px] font-light leading-none text-[var(--color-green)]">
            {stats.streak}
          </div>
          <div className="mt-1 text-[10px] text-[var(--color-text-secondary)]">Perfect Streak</div>
        </div>
        <div>
          <div className="text-[28px] font-light leading-none text-[var(--color-text)]">
            {stats.maxStreak}
          </div>
          <div className="mt-1 text-[10px] text-[var(--color-text-secondary)]">Best Perfect</div>
        </div>
      </div>

      {/* Distribution heading */}
      <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.15em] text-[var(--color-text)]">
        Guess Distribution
      </div>

      {/* Horizontal bar chart */}
      <div className="space-y-[4px]">
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
                  className="flex h-5 items-center justify-end px-2 text-[11px] font-bold text-white"
                  style={{
                    width: `${widthPct}%`,
                    minWidth: '20px',
                    backgroundColor: isToday ? 'var(--color-green)' : '#3a3a3c',
                  }}
                >
                  {count}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Countdown */}
      <div className="mt-6 border-t border-[var(--color-border)] pt-4 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
          Next Slabble
        </div>
        <div className="mt-1 text-[28px] font-light tabular-nums text-[var(--color-text)]">
          {countdown}
        </div>
      </div>
    </div>
  )
}
