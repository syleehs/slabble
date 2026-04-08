interface OnboardingProps {
  onDismiss: () => void
}

export function Onboarding({ onDismiss }: OnboardingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-[380px] border border-[var(--color-border)] bg-[var(--color-bg)] px-8 py-8">
        {/* Close button */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="mb-5 text-center text-[16px] font-bold uppercase tracking-wider text-[var(--color-text)]">
          How To Play
        </h2>

        <p className="mb-4 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          Every day, we show you a professionally graded card. Can you guess
          the grade?
        </p>

        <p className="mb-6 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          Look at the card's corners, edges, centering, and surface. Then pick
          a grade from 1 to 10.
        </p>

        {/* Examples */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-[32px] w-[32px] items-center justify-center bg-[var(--color-green)] text-[14px] font-bold text-white">
              8
            </span>
            <span className="text-[13px] text-[var(--color-text-secondary)]">
              Exact match — you nailed it
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-[32px] w-[32px] items-center justify-center bg-[var(--color-yellow)] text-[14px] font-bold text-white">
              7
            </span>
            <span className="text-[13px] text-[var(--color-text-secondary)]">
              Off by 1 — close call
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-[32px] w-[32px] items-center justify-center bg-[var(--color-red)] text-[14px] font-bold text-white">
              5
            </span>
            <span className="text-[13px] text-[var(--color-text-secondary)]">
              Off by 2+ — way off
            </span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full bg-[var(--color-green)] py-3 text-[13px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
