import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchDaily, submitGuess } from '../lib/api'
import { loadGuess, saveGuess, loadStats, saveStats, updateStats } from '../lib/storage'
import { getGameInfo, type GameSlug, type DailyCard, type DailyReveal } from '../lib/types'
import { StatsPanel } from './StatsPanel'

type PageState = 'loading' | 'guessing' | 'revealed' | 'error' | 'not-found'

function feedbackColor(diff: number): string {
  if (diff === 0) return 'var(--color-green)'
  if (diff === 1) return 'var(--color-yellow)'
  return 'var(--color-red)'
}

function feedbackText(diff: number): string {
  if (diff === 0) return 'PERFECT'
  if (diff === 1) return 'CLOSE'
  return `OFF BY ${diff}`
}

export function GamePage() {
  const { game: gameParam } = useParams<{ game: string }>()
  const gameInfo = gameParam ? getGameInfo(gameParam) : undefined
  const gameSlug = gameInfo?.slug as GameSlug | undefined

  const [state, setState] = useState<PageState>('loading')
  const [card, setCard] = useState<DailyCard | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [reveal, setReveal] = useState<DailyReveal | null>(null)
  const [guess, setGuess] = useState<number | null>(null)
  const [stats, setStats] = useState(gameSlug ? loadStats(gameSlug) : null)
  const [zoomed, setZoomed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!gameInfo || !gameSlug) {
      setState('not-found')
      return
    }

    let cancelled = false

    fetchDaily(gameSlug)
      .then(data => {
        if (cancelled) return
        setCard(data)

        // Check if already guessed
        const stored = loadGuess(gameSlug, data.puzzleNumber)
        if (stored) {
          setGuess(stored.guess)
          setReveal(stored.reveal)
          setStats(loadStats(gameSlug))
          setState('revealed')
        } else {
          setState('guessing')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg('No card available today')
          setState('error')
        }
      })

    return () => { cancelled = true }
  }, [gameSlug, gameInfo])

  const handleSubmit = useCallback(async () => {
    if (!gameSlug || !card || selectedGrade == null || submitting) return

    setSubmitting(true)
    try {
      const result = await submitGuess(gameSlug, card.puzzleNumber, selectedGrade)
      saveGuess(gameSlug, card.puzzleNumber, selectedGrade, result)
      const currentStats = loadStats(gameSlug)
      const updated = updateStats(currentStats, card.puzzleNumber, selectedGrade, result.actualGrade)
      saveStats(gameSlug, updated)

      setGuess(selectedGrade)
      setReveal(result)
      setStats(updated)
      setState('revealed')
    } catch {
      setErrorMsg('Failed to submit guess. Try again.')
      setState('error')
    } finally {
      setSubmitting(false)
    }
  }, [gameSlug, card, selectedGrade, submitting])

  const handleShare = useCallback(() => {
    if (!gameInfo || !card || guess == null || !reveal) return
    const diff = Math.abs(guess - reveal.actualGrade)
    const emoji = diff === 0 ? '\u{1F7E9}' : diff === 1 ? '\u{1F7E8}' : '\u{1F7E5}'
    const text = `GradeGuess ${gameInfo.name} #${card.puzzleNumber} ${emoji} ${guess}`
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback: ignore clipboard errors
    })
  }, [gameInfo, card, guess, reveal])

  // Header component shared across states
  const headerBar = (
    <header className="flex h-[50px] items-center justify-between border-b border-[var(--color-border)] px-4">
      <Link
        to="/"
        className="text-[var(--color-text)] hover:text-[var(--color-text-secondary)]"
        aria-label="Back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Link>
      <h1 className="text-[16px] font-bold uppercase tracking-[0.15em] text-[var(--color-text)]">
        {gameInfo?.name ?? 'Game'}
      </h1>
      <button type="button" className="text-[var(--color-text)]" aria-label="Stats">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="12" width="4" height="8" />
          <rect x="10" y="8" width="4" height="12" />
          <rect x="16" y="4" width="4" height="16" />
        </svg>
      </button>
    </header>
  )

  // Not found state
  if (state === 'not-found') {
    return (
      <div className="mx-auto min-h-screen max-w-[500px]">
        {headerBar}
        <div className="px-4 py-16 text-center text-[var(--color-text-muted)]">
          Game not found
        </div>
      </div>
    )
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="mx-auto min-h-screen max-w-[500px]">
        {headerBar}
        <div className="px-4 py-16 text-center text-[var(--color-text-muted)]">
          {errorMsg || 'Something went wrong'}
        </div>
      </div>
    )
  }

  // Loading state
  if (state === 'loading' || !card) {
    return (
      <div className="mx-auto min-h-screen max-w-[500px]">
        {headerBar}
        <div className="px-4 py-6">
          <div className="mx-auto aspect-[63/88] w-full max-w-[300px] animate-pulse bg-[var(--color-border)]" />
        </div>
      </div>
    )
  }

  const diff = guess != null && reveal ? Math.abs(guess - reveal.actualGrade) : null

  return (
    <div className="mx-auto min-h-screen max-w-[500px]">
      {headerBar}

      <div className="px-4 py-4">
        {/* Card image */}
        <div className="mb-4 flex justify-center">
          <button
            type="button"
            onClick={() => setZoomed(prev => !prev)}
            className={`overflow-hidden border border-[var(--color-border)] transition-all ${
              zoomed ? 'max-w-full' : 'max-w-[280px]'
            }`}
          >
            <img
              src={card.imageUrl}
              alt="Card scan"
              className="w-full"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
              draggable={false}
            />
          </button>
        </div>

        {/* Guessing state */}
        {state === 'guessing' && (
          <>
            {/* Subtitle */}
            <div className="mb-4 text-center text-[13px] uppercase tracking-wide text-[var(--color-text-secondary)]">
              Guess the grade
            </div>

            {/* Grade buttons - Wordle keyboard tile style */}
            <div className="mb-4 flex justify-center gap-[6px]">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(grade => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`flex h-[45px] w-[45px] items-center justify-center text-[15px] font-bold transition-colors ${
                    selectedGrade === grade
                      ? 'bg-[var(--color-green)] text-white'
                      : 'bg-[var(--color-key-bg)] text-white hover:opacity-80'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>

            {/* Enter button */}
            <button
              onClick={handleSubmit}
              disabled={selectedGrade == null || submitting}
              className={`mx-auto block px-12 py-3 text-[13px] font-bold uppercase tracking-[0.15em] text-white transition-opacity ${
                selectedGrade != null
                  ? 'bg-[var(--color-green)]'
                  : 'bg-[var(--color-key-bg)]'
              } disabled:opacity-40`}
            >
              {submitting ? 'SUBMITTING...' : 'ENTER'}
            </button>
          </>
        )}

        {/* Revealed state */}
        {state === 'revealed' && reveal && guess != null && diff != null && (
          <div className="space-y-4">
            {/* Result feedback */}
            <div className="py-3 text-center">
              <div
                className="text-[28px] font-bold uppercase tracking-wide"
                style={{ color: feedbackColor(diff) }}
              >
                {feedbackText(diff)}
              </div>
              <div className="mt-1 text-[14px] text-[var(--color-text-secondary)]">
                You guessed{' '}
                <span className="font-bold text-[var(--color-text)]">
                  {guess}
                </span>
                {' '}&mdash; actual grade{' '}
                <span className="font-bold text-[var(--color-text)]">
                  {reveal.actualGrade}
                </span>
              </div>
            </div>

            {/* Card details */}
            <div className="border-t border-b border-[var(--color-border)] py-3">
              <div className="text-[14px] font-semibold text-[var(--color-text)]">
                {reveal.cardName}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--color-text-muted)]">
                <span className="font-bold uppercase text-[var(--color-text-secondary)]">
                  {reveal.company}
                </span>
                {reveal.certUrl && (
                  <>
                    <span className="text-[var(--color-border)]">&middot;</span>
                    <a
                      href={reveal.certUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                    >
                      Cert #{reveal.certNumber}
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            {stats && <StatsPanel stats={stats} todayDiff={diff} />}

            {/* Share button */}
            <div className="flex justify-center pb-4">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 border border-[var(--color-border)] bg-transparent px-6 py-2 text-[13px] font-bold uppercase tracking-wider text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="0" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
