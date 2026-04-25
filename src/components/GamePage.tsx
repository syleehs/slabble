import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { fetchDaily, submitGuess } from '../lib/api'
import { track } from '../lib/analytics'
import { loadGuess, saveGuess, loadStats, saveStats, updateStats, isOnboarded, setOnboarded } from '../lib/storage'
import { getGameInfo, type GameSlug, type DailyCard, type DailyReveal } from '../lib/types'
import { StatsPanel } from './StatsPanel'
import { Onboarding } from './Onboarding'
import { CardViewer } from './CardViewer'

type PageState = 'loading' | 'guessing' | 'revealed' | 'error' | 'not-found'

function feedbackColor(diff: number): string {
  if (diff === 0) return 'var(--color-green)'
  if (diff === 1) return 'var(--color-yellow)'
  return '#3a3a3c'
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
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboarded())
  const [showHelp, setShowHelp] = useState(false)
  const [shareText, setShareText] = useState('SHARE')
  const [animateReveal, setAnimateReveal] = useState(false)

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

        const stored = loadGuess(gameSlug, data.puzzleNumber)
        if (stored) {
          setGuess(stored.guess)
          setReveal(stored.reveal)
          setStats(loadStats(gameSlug))
          setState('revealed')
          track('card_viewed', { game: gameSlug, puzzleNumber: data.puzzleNumber }, { returning: true })
        } else {
          setState('guessing')
          track('card_viewed', { game: gameSlug, puzzleNumber: data.puzzleNumber }, { returning: false })
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
      setAnimateReveal(true)
      setState('revealed')
      track(
        'guess_submitted',
        { game: gameSlug, puzzleNumber: card.puzzleNumber },
        { guess: selectedGrade, actual_grade: result.actualGrade, diff: Math.abs(selectedGrade - result.actualGrade) },
      )
    } catch {
      setErrorMsg('Failed to submit guess. Try again.')
      setState('error')
    } finally {
      setSubmitting(false)
    }
  }, [gameSlug, card, selectedGrade, submitting])

  const handleShare = useCallback(() => {
    if (!gameInfo || !card || guess == null || !reveal || !gameSlug) return
    const diff = Math.abs(guess - reveal.actualGrade)
    const emoji = diff === 0 ? '\u{1F7E9}' : diff === 1 ? '\u{1F7E8}' : '\u{2B1B}'
    const text = `Slabble #${card.puzzleNumber} ${emoji}`
    navigator.clipboard.writeText(text).catch(() => {})
    setShareText('COPIED!')
    setTimeout(() => setShareText('SHARE'), 2000)
    track('share_clicked', { game: gameSlug, puzzleNumber: card.puzzleNumber }, { diff })
  }, [gameInfo, card, guess, reveal, gameSlug])

  function handleDismissOnboarding() {
    setOnboarded()
    setShowOnboarding(false)
  }

  const diff = guess != null && reveal ? Math.abs(guess - reveal.actualGrade) : null

  // Header
  const header = (
    <header className="flex h-[50px] items-center justify-between border-b border-[var(--color-border)] px-4">
      <div className="w-[44px]" />
      <h1 className="text-[16px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]">
        Slabble
      </h1>
      <div className="flex w-[44px] items-center justify-end gap-3">
        <button
          type="button"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          aria-label="Help"
          onClick={() => setShowHelp(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
      </div>
    </header>
  )

  // Not found
  if (state === 'not-found') {
    return (
      <div className="mx-auto min-h-screen max-w-[500px]">
        {header}
        <div className="px-4 py-16 text-center text-[14px] text-[var(--color-text-muted)]">
          Game not found
        </div>
      </div>
    )
  }

  // Error
  if (state === 'error') {
    return (
      <div className="mx-auto min-h-screen max-w-[500px]">
        {header}
        <div className="px-4 py-16 text-center">
          <div className="text-[14px] text-[var(--color-text-muted)]">
            {errorMsg || 'Something went wrong'}
          </div>
          <button
            onClick={() => {
              setErrorMsg('')
              setState('loading')
              fetchDaily(gameSlug!)
                .then(data => {
                  setCard(data)
                  const stored = loadGuess(gameSlug!, data.puzzleNumber)
                  if (stored) {
                    setGuess(stored.guess)
                    setReveal(stored.reveal)
                    setStats(loadStats(gameSlug!))
                    setState('revealed')
                  } else {
                    setState('guessing')
                  }
                })
                .catch(() => {
                  setErrorMsg('No card available today')
                  setState('error')
                })
            }}
            className="mt-4 border border-[var(--color-border)] bg-transparent px-6 py-2 text-[13px] font-bold uppercase tracking-[0.15em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Loading
  if (state === 'loading' || !card) {
    return (
      <div className="mx-auto min-h-screen max-w-[500px]">
        {header}
        <div className="flex justify-center px-4 pt-6">
          <div className="aspect-[63/88] w-[80%] max-w-[300px] animate-pulse bg-[#1a1a1b]" />
        </div>
      </div>
    )
  }

  return (
    <div className={`mx-auto flex min-h-screen flex-col ${state === 'revealed' ? 'max-w-[500px]' : 'max-w-[900px]'}`}>
      {showOnboarding && <Onboarding onDismiss={handleDismissOnboarding} />}
      {showHelp && <Onboarding onDismiss={() => setShowHelp(false)} />}

      {header}

      <div className="flex flex-1 flex-col px-4">
        {/* Card image - hero */}
        <CardViewer
          frontImageUrl={card.frontImageUrl ?? card.imageUrl}
          backImageUrl={card.backImageUrl ?? null}
          mode={state === 'revealed' ? 'revealed' : 'guessing'}
        />

        {/* Guessing state */}
        {state === 'guessing' && (
          <div className="mx-auto w-full max-w-[500px] pb-6">
            {/* Prompt */}
            <div className="mb-4 text-center text-[13px] uppercase tracking-wide text-[var(--color-text-secondary)]">
              What grade did this card receive?
            </div>

            {/* Grade tiles - horizontal strip */}
            <div className="mb-4 flex justify-center gap-[5px]">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(grade => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`flex h-[44px] w-[44px] items-center justify-center text-[15px] font-bold transition-colors ${
                    selectedGrade === grade
                      ? 'border-2 border-white bg-[var(--color-text-secondary)] text-white'
                      : 'bg-[#3a3a3c] text-white hover:bg-[#4a4a4c]'
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
              className={`mx-auto block w-full max-w-[300px] py-3 text-[13px] font-bold uppercase tracking-[0.15em] text-white transition-colors ${
                selectedGrade != null
                  ? 'bg-[var(--color-green)]'
                  : 'bg-[#3a3a3c]'
              } disabled:opacity-40`}
            >
              {submitting ? 'SUBMITTING...' : 'ENTER'}
            </button>
          </div>
        )}

        {/* Revealed state */}
        {state === 'revealed' && reveal && guess != null && diff != null && (
          <div className="pb-6">
            {/* Result tile + text */}
            <div className="mb-4 flex flex-col items-center">
              {/* Flipping grade tile */}
              <div
                className={animateReveal ? 'animate-flip' : ''}
                style={{ perspective: '600px' }}
              >
                <div
                  className="flex h-[56px] w-[56px] items-center justify-center text-[24px] font-bold text-white"
                  style={{ backgroundColor: feedbackColor(diff) }}
                >
                  {reveal.actualGrade}
                </div>
              </div>

              {/* Feedback text */}
              <div
                className={`mt-3 text-[22px] font-bold uppercase tracking-wide ${animateReveal ? 'animate-fade' : ''}`}
                style={{
                  color: feedbackColor(diff),
                  animationDelay: animateReveal ? '0.3s' : undefined,
                  opacity: animateReveal ? 0 : 1,
                  animationFillMode: 'forwards',
                }}
              >
                {feedbackText(diff)}
              </div>

              <div
                className={`mt-1 text-[13px] text-[var(--color-text-secondary)] ${animateReveal ? 'animate-fade' : ''}`}
                style={{
                  animationDelay: animateReveal ? '0.4s' : undefined,
                  opacity: animateReveal ? 0 : 1,
                  animationFillMode: 'forwards',
                }}
              >
                You guessed{' '}
                <span className="font-bold text-[var(--color-text)]">{guess}</span>
                {' '}&mdash; actual grade{' '}
                <span className="font-bold text-[var(--color-text)]">{reveal.actualGrade}</span>
              </div>
            </div>

            {/* Stats panel - slides up */}
            <div
              className={animateReveal ? 'animate-slide-up' : ''}
              style={{
                animationDelay: animateReveal ? '0.8s' : undefined,
                opacity: animateReveal ? 0 : 1,
                animationFillMode: 'forwards',
              }}
            >
              {stats && <StatsPanel stats={stats} todayDiff={diff} />}
            </div>

            {/* Share button */}
            <div
              className={`mt-4 flex justify-center ${animateReveal ? 'animate-fade' : ''}`}
              style={{
                animationDelay: animateReveal ? '1.0s' : undefined,
                opacity: animateReveal ? 0 : 1,
                animationFillMode: 'forwards',
              }}
            >
              <button
                onClick={handleShare}
                className="w-full max-w-[300px] border border-[var(--color-border)] bg-transparent py-3 text-[13px] font-bold uppercase tracking-[0.15em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
              >
                {shareText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
