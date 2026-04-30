import { useNavigate } from 'react-router-dom'
import { CriteriaCard } from './CriteriaCard'
import { PSA_REFERENCE_URL } from '../lib/grading'

export function LearnPage() {
  const navigate = useNavigate()
  const goBack = () => navigate(-1)

  return (
    <div className="mx-auto flex min-h-screen max-w-[560px] flex-col bg-[var(--color-bg)] px-4 text-[var(--color-text)]">
      {/* Header */}
      <header className="flex h-[50px] items-center justify-between border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="flex h-[44px] w-[44px] items-center justify-center text-[20px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          &larr;
        </button>
        <h1 className="text-[16px] font-bold uppercase tracking-[0.2em]">
          Grading Criteria
        </h1>
        <button
          type="button"
          onClick={goBack}
          aria-label="Close"
          className="flex h-[44px] w-[44px] items-center justify-center text-[20px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          &times;
        </button>
      </header>

      {/* Subtitle */}
      <p className="mt-6 text-center text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        PSA grades 7-10 are the range slabble's daily puzzles fall in. Below is
        a short summary of each. The full PSA scale is at psacard.com.
      </p>

      {/* Cards */}
      <div className="mt-6 flex flex-col gap-3 pb-6">
        <CriteriaCard grade={10} />
        <CriteriaCard grade={9} />
        <CriteriaCard grade={8} />
        <CriteriaCard grade={7} />
      </div>

      {/* Footer attribution */}
      <div className="mt-auto border-t border-[var(--color-border)] py-4 text-center text-[11px] text-[var(--color-text-muted)]">
        Source: PSA ·{' '}
        <a
          href={PSA_REFERENCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[var(--color-text-secondary)]"
        >
          psacard.com/grades
        </a>
      </div>
    </div>
  )
}
