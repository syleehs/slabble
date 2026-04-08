import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchStatus } from '../lib/api'
import { loadStats, isOnboarded, setOnboarded } from '../lib/storage'
import { GAMES, type GameSlug, type GameStatus } from '../lib/types'
import { Onboarding } from './Onboarding'

function LoadingSkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse border-b border-[var(--color-border)]"
        />
      ))}
    </div>
  )
}

export function Hub() {
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboarded())
  const [statusMap, setStatusMap] = useState<Record<string, GameStatus> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchStatus()
      .then(data => {
        if (!cancelled) setStatusMap(data)
      })
      .catch(() => {
        if (!cancelled) setStatusMap({})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  function handleDismissOnboarding() {
    setOnboarded()
    setShowOnboarding(false)
  }

  function hasGuessedToday(game: GameSlug, puzzleNumber: number | undefined): boolean {
    if (puzzleNumber == null) return false
    return localStorage.getItem(`gg-${game}-${puzzleNumber}`) !== null
  }

  const availableCount = statusMap
    ? GAMES.filter(g => statusMap[g.slug]?.available).length
    : 0

  const completedCount = statusMap
    ? GAMES.filter(g => {
        const status = statusMap[g.slug]
        return status?.available && hasGuessedToday(g.slug, status.puzzleNumber)
      }).length
    : 0

  return (
    <div className="mx-auto min-h-screen max-w-[500px]">
      {showOnboarding && <Onboarding onDismiss={handleDismissOnboarding} />}

      {/* Header bar */}
      <header className="flex h-[50px] items-center justify-between border-b border-[var(--color-border)] px-4">
        <button type="button" className="text-[var(--color-text)] text-xl leading-none" aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-[18px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]">
          GradeGuess
        </h1>
        <div className="flex items-center gap-3">
          <button type="button" className="text-[var(--color-text)]" aria-label="Help">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
          <button type="button" className="text-[var(--color-text)]" aria-label="Stats">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="12" width="4" height="8" />
              <rect x="10" y="8" width="4" height="12" />
              <rect x="16" y="4" width="4" height="16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Subtitle */}
      <div className="px-4 py-3 text-center text-[13px] uppercase tracking-wide text-[var(--color-text-secondary)]">
        Pick a game
      </div>

      {/* Game rows */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="border-t border-[var(--color-border)]">
          {GAMES.map(game => {
            const status = statusMap?.[game.slug]
            const available = status?.available ?? false
            const guessed = hasGuessedToday(game.slug, status?.puzzleNumber)
            const stats = loadStats(game.slug)

            if (!available) {
              return (
                <div
                  key={game.slug}
                  className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 opacity-40"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{game.emoji}</span>
                    <span className="text-[15px] text-[var(--color-text-muted)]">
                      {game.name}
                    </span>
                  </div>
                  <span className="text-[12px] text-[var(--color-text-muted)]">
                    No card today
                  </span>
                </div>
              )
            }

            return (
              <Link
                key={game.slug}
                to={`/${game.slug}`}
                className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 transition-colors hover:bg-[var(--color-surface-hover)]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{game.emoji}</span>
                  <span className="text-[15px] font-medium text-[var(--color-text)]">
                    {game.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {stats.streak > 0 && (
                    <span className="text-[12px] text-[var(--color-text-secondary)]">
                      {stats.streak} streak
                    </span>
                  )}
                  {guessed && (
                    <span className="text-[14px] text-[var(--color-green)]">
                      &#10003;
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Stats summary */}
      {!loading && statusMap && (
        <div className="py-4 text-center text-[13px] text-[var(--color-text-secondary)]">
          {completedCount}/{availableCount} today
        </div>
      )}

      {/* Share button */}
      {!loading && statusMap && completedCount > 0 && (
        <div className="px-4 pb-6">
          <button
            type="button"
            className="mx-auto block border border-[var(--color-border)] bg-transparent px-6 py-2 text-[13px] font-bold uppercase tracking-wider text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            Share
          </button>
        </div>
      )}
    </div>
  )
}
