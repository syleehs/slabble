import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchStatus } from '../lib/api'

export function IntroPage() {
  const navigate = useNavigate()
  const [puzzleNumber, setPuzzleNumber] = useState<number | null>(null)

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
      {/* Faded slab silhouette as ambient background */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute z-0 text-[var(--color-text)] opacity-[0.07]"
        width="420"
        height="600"
        viewBox="0 0 420 600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-6deg)',
        }}
      >
        {/* Outer slab case */}
        <rect x="8" y="8" width="404" height="584" rx="14" />
        {/* Divider between top label and card window */}
        <line x1="8" y1="92" x2="412" y2="92" />
        {/* Inner card window */}
        <rect x="32" y="120" width="356" height="448" rx="6" />
      </svg>

      {/* Foreground content */}
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
          {puzzleNumber !== null && <div className="mt-1">No. {puzzleNumber}</div>}
        </div>
      </div>
    </div>
  )
}
