import { getCriteriaFor } from '../lib/grading'

interface CriteriaCardProps {
  grade: number
  /** Optional small label shown above the card (e.g. "Actual", "Your guess"). */
  eyebrow?: string
}

export function CriteriaCard({ grade, eyebrow }: CriteriaCardProps) {
  const c = getCriteriaFor(grade)
  const isBelow7 = c.label === 'Below 7'

  return (
    <div className="flex flex-col">
      {eyebrow && (
        <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          {eyebrow}
        </div>
      )}
      <div
        className={`flex gap-3 border ${
          isBelow7 ? 'border-[var(--color-border)] opacity-70' : 'border-[var(--color-border)]'
        } bg-[var(--color-surface)] p-3`}
      >
        <div
          className={`flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center text-[18px] font-bold text-white ${
            isBelow7 ? 'bg-[#3a3a3c]' : 'bg-[var(--color-green)]'
          }`}
          aria-hidden="true"
        >
          {isBelow7 ? '<7' : c.grade}
        </div>
        <div className="flex flex-1 flex-col">
          <div className="text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--color-text)]">
            {isBelow7 ? c.label : `${c.label} · PSA ${c.grade}`}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            {c.summary}
          </p>
          <div className="mt-2 text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            Source: {c.source}
          </div>
        </div>
      </div>
    </div>
  )
}
