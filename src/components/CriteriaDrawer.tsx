import { useEffect, useRef } from 'react'
import { CriteriaCard } from './CriteriaCard'
import { PSA_REFERENCE_URL } from '../lib/grading'

interface CriteriaDrawerProps {
  open: boolean
  onClose: () => void
}

export function CriteriaDrawer({ open, onClose }: CriteriaDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Escape closes; focus moves to close button on open.
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop above the drawer. Tap to close. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-x-0 top-0 z-40 transition-opacity duration-[250ms] ease-out ${
          open ? 'pointer-events-auto bg-black/30 opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ height: '40vh' }}
      />
      {/* Drawer sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="criteria-drawer-title"
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col border-t border-[var(--color-border)] bg-[var(--color-bg)] transition-transform duration-[250ms] ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '60vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <h2
            id="criteria-drawer-title"
            className="text-[13px] font-bold uppercase tracking-[0.15em] text-[var(--color-text)]"
          >
            PSA Grading Criteria · Pokemon TCG
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center text-[20px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
          >
            &times;
          </button>
        </div>
        {/* Cards (scrollable) */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <CriteriaCard grade={10} />
          <CriteriaCard grade={9} />
          <CriteriaCard grade={8} />
          <CriteriaCard grade={7} />
        </div>
        {/* Footer attribution */}
        <div className="border-t border-[var(--color-border)] px-4 py-3 text-center text-[11px] text-[var(--color-text-muted)]">
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
    </>
  )
}
