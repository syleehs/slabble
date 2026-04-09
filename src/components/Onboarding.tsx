interface OnboardingProps {
  onDismiss: () => void
}

export function Onboarding({ onDismiss }: OnboardingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-[340px] border border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-8">
        <h2 className="mb-6 text-center text-[15px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]">
          How To Play
        </h2>

        <p className="mb-5 text-center text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          Guess the grade of a professionally graded card. One guess per day.
        </p>

        {/* Color legend */}
        <div className="mb-6 flex justify-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <span className="flex h-[36px] w-[36px] items-center justify-center bg-[var(--color-green)] text-[14px] font-bold text-white">
              8
            </span>
            <span className="text-[11px] text-[var(--color-text-secondary)]">Exact</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="flex h-[36px] w-[36px] items-center justify-center bg-[var(--color-yellow)] text-[14px] font-bold text-white">
              7
            </span>
            <span className="text-[11px] text-[var(--color-text-secondary)]">Close</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="flex h-[36px] w-[36px] items-center justify-center bg-[#3a3a3c] text-[14px] font-bold text-white">
              5
            </span>
            <span className="text-[11px] text-[var(--color-text-secondary)]">Off</span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full bg-[var(--color-green)] py-3 text-[13px] font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
        >
          Play
        </button>
      </div>
    </div>
  )
}
