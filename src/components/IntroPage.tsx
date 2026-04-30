import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchStatus } from '../lib/api'

// Mirrors backend launchDate in hikokyu/api/daily.go.
// Puzzle #0 = this date. Update both sides if the launch is ever re-anchored.
const LAUNCH_DATE_UTC = Date.UTC(2026, 3, 10) // April 10, 2026 (months are 0-indexed)

function localPuzzleNumber(): number {
  const now = new Date()
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const days = Math.floor((todayUtc - LAUNCH_DATE_UTC) / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

export function IntroPage() {
  const navigate = useNavigate()
  // Compute locally for instant render; API resolves and corrects if drift.
  const [puzzleNumber, setPuzzleNumber] = useState<number>(() => localPuzzleNumber())

  useEffect(() => {
    fetchStatus()
      .then(s => {
        const pokemon = s.pokemon
        if (pokemon) setPuzzleNumber(pokemon.puzzleNumber)
      })
      .catch(() => {})
  }, [])

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--color-bg)] px-6 text-[var(--color-text)]">
      {/* Faded slab silhouette as ambient background.
          Grey case + red top label band = the iconic PSA look, muted. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute z-0"
        width="560"
        height="720"
        viewBox="0 0 560 720"
        fill="none"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-5deg)',
        }}
      >
        {/* Outer slab case — grey */}
        <rect
          x="8"
          y="8"
          width="544"
          height="704"
          rx="14"
          stroke="#a0a0a0"
          strokeOpacity="0.18"
          strokeWidth="2"
        />
        {/* Top label band — muted PSA red */}
        <rect
          x="9"
          y="9"
          width="542"
          height="92"
          rx="12"
          ry="12"
          fill="#b13a3a"
          fillOpacity="0.12"
        />
        {/* White "grade pip" on the right side of the red banner — the iconic PSA grade box */}
        <rect
          x="446"
          y="24"
          width="96"
          height="62"
          rx="4"
          fill="#ffffff"
          fillOpacity="0.22"
        />
        {/* Thin white text strips on the left side of the red banner, evoking
            the card name + set printed in white on a real slab */}
        <rect x="32" y="34" width="200" height="6" rx="1" fill="#ffffff" fillOpacity="0.18" />
        <rect x="32" y="50" width="160" height="6" rx="1" fill="#ffffff" fillOpacity="0.14" />
        <rect x="32" y="68" width="120" height="4" rx="1" fill="#ffffff" fillOpacity="0.10" />
        <line
          x1="8"
          y1="100"
          x2="552"
          y2="100"
          stroke="#a0a0a0"
          strokeOpacity="0.18"
          strokeWidth="2"
        />
        {/* Inner card window */}
        <rect
          x="30"
          y="128"
          width="500"
          height="560"
          rx="6"
          stroke="#a0a0a0"
          strokeOpacity="0.18"
          strokeWidth="2"
        />
      </svg>

      {/* Foreground content sits in the slab's card window area */}
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="font-serif text-[56px] font-bold leading-none tracking-tight sm:text-[80px]">
          Slabble
        </h1>

        <p className="mt-3 max-w-[420px] text-center font-serif text-[20px] leading-snug sm:text-[26px]">
          Guess the grade of today's card.
        </p>

        <button
          type="button"
          onClick={() => navigate('/pokemon')}
          className="mt-10 rounded-full bg-[var(--color-text)] px-14 py-3 text-[16px] font-semibold text-[var(--color-bg)] transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-text)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]"
        >
          Play
        </button>

        <div className="mt-10 text-center text-[14px] font-medium text-[var(--color-text-secondary)]">
          <div>{today}</div>
          <div className="mt-1">Slabble #{puzzleNumber}</div>
          <button
            type="button"
            onClick={() => navigate('/learn')}
            className="mt-3 text-[12px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] underline-offset-2 hover:text-[var(--color-text-secondary)] hover:underline"
          >
            Learn the grades →
          </button>
        </div>
      </div>
    </div>
  )
}
