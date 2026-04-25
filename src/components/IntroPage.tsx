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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-[var(--color-text)]">
      {/* Icon: a stylized graded card pip */}
      <div
        aria-hidden="true"
        className="mb-6 flex h-[80px] w-[80px] items-center justify-center border-2 border-[var(--color-text)] bg-[var(--color-green)] text-[34px] font-bold text-white"
      >
        10
      </div>

      {/* Wordmark */}
      <h1 className="font-serif text-[56px] font-bold leading-none tracking-tight text-[var(--color-text)] sm:text-[72px]">
        Slabble
      </h1>

      {/* Tagline */}
      <p className="mt-3 max-w-[420px] text-center font-serif text-[20px] leading-snug text-[var(--color-text)] sm:text-[26px]">
        Guess the PSA grade of today's card.
      </p>

      {/* Play CTA */}
      <button
        type="button"
        onClick={() => navigate('/pokemon')}
        className="mt-10 rounded-full bg-[var(--color-text)] px-14 py-3 text-[16px] font-semibold text-[var(--color-bg)] transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-text)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]"
      >
        Play
      </button>

      {/* Footer */}
      <div className="mt-10 text-center text-[14px] font-medium text-[var(--color-text-secondary)]">
        <div>{today}</div>
        {puzzleNumber !== null && <div className="mt-1">No. {puzzleNumber}</div>}
      </div>
    </div>
  )
}
