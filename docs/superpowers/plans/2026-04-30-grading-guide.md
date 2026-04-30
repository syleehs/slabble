# Grading Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PSA 7-10 grading criteria as a learning resource across three slabble surfaces — an in-game slide-up drawer, a post-guess inline comparison, and a `/learn` read-mode page.

**Architecture:** A typed constant in `src/lib/grading.ts` is the single source of truth. A pure presentational `CriteriaCard` is reused by all three surfaces. The drawer and the `/learn` page are thin shells around stacks of `CriteriaCard`s. The post-guess comparison composes two cards inline inside the existing GamePage reveal section. Out-of-range grades (`< 7`) render a placeholder card pointing at psacard.com.

**Tech Stack:** React 19, Vite 8, TypeScript, Tailwind CSS 4, react-router-dom 7. Tests use Vitest + @testing-library/react (added in Task 1 — slabble has no test framework today).

**Spec:** `docs/superpowers/specs/2026-04-29-grading-guide-design.md`

---

## File map

| Path | Created by | Responsibility |
|---|---|---|
| `vitest.config.ts` | Task 1 | Vitest config (jsdom env, RTL setup file). |
| `src/test/setup.ts` | Task 1 | `@testing-library/jest-dom` matchers + cleanup. |
| `src/lib/grading.ts` | Task 2 | `GradeCriteria` type, `PSA_CRITERIA` constant, `getCriteriaFor(grade)` helper, `PSA_REFERENCE_URL`. |
| `src/lib/grading.test.ts` | Task 2 | Unit tests for the data shape and the `<7` fallback. |
| `src/components/CriteriaCard.tsx` | Task 3 | Presentational card. Renders one grade or the "Below 7" placeholder. |
| `src/components/CriteriaCard.test.tsx` | Task 3 | Component tests. |
| `src/components/CriteriaDrawer.tsx` | Task 4 | Slide-up bottom sheet holding all four cards. |
| `src/components/GamePage.tsx` | Tasks 5, 6, 10 | Drawer trigger + mount (Task 5); inline comparison (Task 6); book icon link (Task 10). |
| `src/components/LearnPage.tsx` | Task 7 | Full-page read-mode component. |
| `src/main.tsx` | Task 8 | New `/learn` route registration. |
| `src/components/IntroPage.tsx` | Task 8 | Footer "Learn the grades →" link. |
| `src/components/Onboarding.tsx` | Task 9 | Footer "Read full grading criteria →" link. |
| `package.json` | Task 1 | Vitest deps + `test` script. |

---

## Task 1: Set up Vitest + Testing Library

Slabble has no test framework today. Add vitest + RTL so Tasks 2 and 3 can run actual unit/component tests.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/lib/sanity.test.ts` (will be deleted in Step 6)

- [ ] **Step 1: Install dev dependencies**

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/dom jsdom
```

Expected: 5 packages added under devDependencies. No vulnerabilities.

- [ ] **Step 2: Add `test` script to `package.json`**

In `package.json`, add a line to `scripts`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run"
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

Create `/Users/yannicklee/Documents/workspace/slabble/vitest.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
  },
})
```

- [ ] **Step 4: Create `src/test/setup.ts`**

Create `/Users/yannicklee/Documents/workspace/slabble/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 5: Add a sanity test to verify the framework boots**

Create `/Users/yannicklee/Documents/workspace/slabble/src/lib/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('vitest sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run: `npm test`

Expected: 1 test file, 1 test passed, no warnings about missing globals or missing matchers.

- [ ] **Step 6: Delete the sanity test, lint, build**

```bash
rm src/lib/sanity.test.ts
npm run lint
npm run build
```

Expected: lint passes (no output), build succeeds (writes to `dist/`).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts
git commit -m "test: add vitest + react-testing-library

No test framework existed previously. This adds vitest with the jsdom
environment and @testing-library/react with jest-dom matchers, ready
for unit and component tests in subsequent commits.

The 'test' script runs in CI-friendly mode (vitest run, not watch)."
```

---

## Task 2: Create `grading.ts` module (TDD)

Source of truth for all PSA criteria text. The four `summary` strings are short verbatim quotes (per the spec's source decision). The four quotes below are accurate paraphrases — **before committing**, replace them with the verbatim text from `psacard.com/grades` to honor the "verbatim with attribution" decision in the spec.

**Files:**
- Create: `src/lib/grading.ts`
- Create: `src/lib/grading.test.ts`

- [ ] **Step 1: Write failing test in `src/lib/grading.test.ts`**

Create `/Users/yannicklee/Documents/workspace/slabble/src/lib/grading.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { PSA_CRITERIA, PSA_REFERENCE_URL, getCriteriaFor } from './grading'

describe('PSA_CRITERIA', () => {
  it('has entries for grades 7, 8, 9, 10', () => {
    expect(Object.keys(PSA_CRITERIA).map(Number).sort()).toEqual([7, 8, 9, 10])
  })

  it('every entry has grade, label, summary, source', () => {
    for (const grade of [7, 8, 9, 10] as const) {
      const c = PSA_CRITERIA[grade]
      expect(c.grade).toBe(grade)
      expect(c.label.length).toBeGreaterThan(0)
      expect(c.summary.length).toBeGreaterThan(0)
      expect(c.source).toBe('PSA')
    }
  })
})

describe('PSA_REFERENCE_URL', () => {
  it('points to psacard.com', () => {
    expect(PSA_REFERENCE_URL).toMatch(/^https:\/\/(www\.)?psacard\.com\//)
  })
})

describe('getCriteriaFor', () => {
  it('returns the in-range entry for grades 7-10', () => {
    expect(getCriteriaFor(9).grade).toBe(9)
    expect(getCriteriaFor(9).label.length).toBeGreaterThan(0)
  })

  it('returns the below-7 placeholder for grades 1-6', () => {
    const placeholder = getCriteriaFor(5)
    expect(placeholder.grade).toBe(5)
    expect(placeholder.label).toBe('Below 7')
    expect(placeholder.summary.length).toBeGreaterThan(0)
  })

  it('returns the below-7 placeholder for grade 0 / negative inputs', () => {
    expect(getCriteriaFor(0).label).toBe('Below 7')
    expect(getCriteriaFor(-1).label).toBe('Below 7')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/grading.test.ts`

Expected: FAIL with "Cannot find module './grading'" or similar.

- [ ] **Step 3: Implement `src/lib/grading.ts`**

> **Before commit (Step 5):** open `https://www.psacard.com/grades` in a browser, copy the actual 1-2 sentence verbatim text for each grade, and paste it into the `summary` fields below. The text in this step is an accurate paraphrase, not the verbatim PSA wording.

Create `/Users/yannicklee/Documents/workspace/slabble/src/lib/grading.ts`:

```ts
export interface GradeCriteria {
  grade: number
  label: string
  summary: string
  source: 'PSA'
}

export const PSA_REFERENCE_URL = 'https://www.psacard.com/grades'

export const PSA_CRITERIA: Record<7 | 8 | 9 | 10, GradeCriteria> = {
  10: {
    grade: 10,
    label: 'Gem Mint',
    summary:
      'A virtually perfect card. Four sharp corners, sharp focus, and full original gloss; image centering within 55/45 to 60/40 on the front and 75/25 on the reverse.',
    source: 'PSA',
  },
  9: {
    grade: 9,
    label: 'Mint',
    summary:
      'A superb condition card that exhibits only one of the following minor flaws: a very slight wax stain on reverse, a minor printing imperfection, or slightly off-white borders. Centering 60/40 to 65/35 or better on the front.',
    source: 'PSA',
  },
  8: {
    grade: 8,
    label: 'Near Mint-Mint',
    summary:
      'Appears Mint 9 at first glance but closer inspection reveals slight imperfections — slight wax stain on reverse, very slight fraying at one or two corners, a minor printing imperfection, or slightly off-white borders. Centering 65/35 to 70/30 or better on the front.',
    source: 'PSA',
  },
  7: {
    grade: 7,
    label: 'Near Mint',
    summary:
      'Slight surface wear visible on close inspection. Slight corner fraying, slightly out-of-register focus, a minor printing blemish, or slight wax staining on the back is acceptable; most original gloss retained. Centering 70/30 to 75/25 or better on the front.',
    source: 'PSA',
  },
}

const BELOW_7_SUMMARY =
  'Significant condition issues — corner or edge wear, surface defects, or off-centering beyond mint tolerances. See the full PSA scale for details.'

/**
 * Returns the criteria for a grade. Grades 7-10 return the verbatim PSA entry.
 * Anything below 7 returns a synthetic "Below 7" placeholder so callers can
 * render a fallback card without needing a separate code path.
 */
export function getCriteriaFor(grade: number): GradeCriteria {
  if (grade >= 7 && grade <= 10) {
    return PSA_CRITERIA[grade as 7 | 8 | 9 | 10]
  }
  return {
    grade,
    label: 'Below 7',
    summary: BELOW_7_SUMMARY,
    source: 'PSA',
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/grading.test.ts`

Expected: 6 tests pass across 3 describe blocks. No warnings.

- [ ] **Step 5: Open psacard.com/grades and verify-or-replace each `summary` string with PSA's verbatim text**

Open `https://www.psacard.com/grades` in a browser. For each of grades 10, 9, 8, 7, copy the first 1-2 sentences of PSA's published criteria and replace the `summary` field in `src/lib/grading.ts` with the verbatim text.

If PSA's wording matches the paraphrase closely enough, leave it; the goal is to honor the "verbatim with attribution" decision. Re-run `npm test -- src/lib/grading.test.ts` after editing — the tests are length-only so they'll still pass.

- [ ] **Step 6: Lint, build, commit**

```bash
npm run lint
npm run build
git add src/lib/grading.ts src/lib/grading.test.ts
git commit -m "feat(grading): add PSA criteria data module + tests

Source of truth for PSA grades 7-10 grading criteria text, sourced
verbatim from psacard.com/grades with attribution. Includes a
getCriteriaFor() helper that returns a 'Below 7' placeholder for
out-of-range grades so consumer code doesn't branch on the input.

Tests cover data shape, every required field, and the placeholder
fallback for in-range and out-of-range inputs."
```

---

## Task 3: Create `CriteriaCard` component (TDD)

Pure presentational card. Renders one grade's criteria. The same component is reused in the drawer, the post-guess comparison, and the `/learn` page.

**Files:**
- Create: `src/components/CriteriaCard.tsx`
- Create: `src/components/CriteriaCard.test.tsx`

- [ ] **Step 1: Write failing component test**

Create `/Users/yannicklee/Documents/workspace/slabble/src/components/CriteriaCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CriteriaCard } from './CriteriaCard'

describe('CriteriaCard', () => {
  it('renders grade number, label, and summary for an in-range grade', () => {
    render(<CriteriaCard grade={9} />)

    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.getByText('Mint')).toBeInTheDocument()
    expect(screen.getByText(/superb condition/i)).toBeInTheDocument()
  })

  it('renders the source attribution', () => {
    render(<CriteriaCard grade={10} />)
    expect(screen.getByText(/source: psa/i)).toBeInTheDocument()
  })

  it('renders the "Below 7" placeholder for grades < 7', () => {
    render(<CriteriaCard grade={5} />)
    expect(screen.getByText('Below 7')).toBeInTheDocument()
    expect(screen.getByText(/significant condition issues/i)).toBeInTheDocument()
  })

  it('renders the optional eyebrow label when provided', () => {
    render(<CriteriaCard grade={10} eyebrow="Actual" />)
    expect(screen.getByText('Actual')).toBeInTheDocument()
  })

  it('does not render the eyebrow when omitted', () => {
    render(<CriteriaCard grade={10} />)
    expect(screen.queryByText('Actual')).not.toBeInTheDocument()
    expect(screen.queryByText('Your guess')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/CriteriaCard.test.tsx`

Expected: FAIL with "Cannot find module './CriteriaCard'".

- [ ] **Step 3: Implement `src/components/CriteriaCard.tsx`**

Create `/Users/yannicklee/Documents/workspace/slabble/src/components/CriteriaCard.tsx`:

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/CriteriaCard.test.tsx`

Expected: 5 tests pass.

- [ ] **Step 5: Lint, build, commit**

```bash
npm run lint
npm run build
git add src/components/CriteriaCard.tsx src/components/CriteriaCard.test.tsx
git commit -m "feat(grading): add CriteriaCard presentational component

Pure render of one grade's criteria (or a 'Below 7' placeholder for
out-of-range inputs). Optional 'eyebrow' label above the card supports
the post-guess comparison labelling ('Actual' / 'Your guess').

Used by the drawer, the post-guess inline comparison, and the /learn
page."
```

---

## Task 4: Create `CriteriaDrawer` component

Bottom-anchored slide-up sheet that renders all four PSA cards. No tests — slabble's no-E2E policy applies and the drawer's behavior is animation-driven, which is brittle to unit-test for marginal value. Manual smoke test in Task 11.

**Files:**
- Create: `src/components/CriteriaDrawer.tsx`

- [ ] **Step 1: Implement `src/components/CriteriaDrawer.tsx`**

Create `/Users/yannicklee/Documents/workspace/slabble/src/components/CriteriaDrawer.tsx`:

```tsx
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
```

- [ ] **Step 2: Lint, build**

```bash
npm run lint
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CriteriaDrawer.tsx
git commit -m "feat(grading): add CriteriaDrawer slide-up sheet

Bottom-anchored 60vh drawer that renders all four PSA criteria cards
stacked highest-to-lowest. Closes on backdrop tap, Escape, or the X
button. Backdrop dims the top 40vh so the card image remains visible
underneath while the user reads.

Not yet wired into GamePage — that's the next task."
```

---

## Task 5: Wire drawer into GamePage guessing state

Add a "View grading criteria" trigger link below the grade tiles. Mount the drawer with state managed in GamePage. Unmount on transition to revealed state (existing logic).

**Files:**
- Modify: `src/components/GamePage.tsx`

- [ ] **Step 1: Add drawer import and open state**

In `src/components/GamePage.tsx`, add the import near the other component imports (around line 8):

```tsx
import { CriteriaDrawer } from './CriteriaDrawer'
```

In the `GamePage` function body, alongside the other `useState` hooks (around line 40), add:

```tsx
const [criteriaOpen, setCriteriaOpen] = useState(false)
```

- [ ] **Step 2: Add the trigger link above the Enter button in the guessing state**

Find the section in `GamePage.tsx` that renders the guessing state (look for `{state === 'guessing' && (`). Inside the guessing block, find the Enter button. Immediately above it, insert:

```tsx
<button
  type="button"
  onClick={() => setCriteriaOpen(true)}
  className="mx-auto mb-3 block text-[12px] uppercase tracking-[0.1em] text-[var(--color-text-secondary)] underline-offset-2 hover:text-[var(--color-text)] hover:underline"
>
  View grading criteria
</button>
```

- [ ] **Step 3: Mount the drawer at the bottom of the GamePage return JSX**

Inside the outermost `return ( ... )` of `GamePage`, immediately before the closing `</div>` of the page wrapper (the one that opened with `<div className="mx-auto flex min-h-screen flex-col ...">`), add:

```tsx
<CriteriaDrawer open={criteriaOpen} onClose={() => setCriteriaOpen(false)} />
```

The drawer renders its own backdrop + sheet via fixed positioning, so location in the DOM tree doesn't matter much — just keep it inside the page so it unmounts when the user leaves.

- [ ] **Step 4: Lint, build, dev-test**

```bash
npm run lint
npm run build
```

Expected: no errors.

Manual test:
```bash
npm run dev
```

Visit `http://localhost:5173/pokemon` (skip the intro). Tap "View grading criteria" — drawer slides up, four cards visible. Tap backdrop, X, and Escape — drawer closes via each route. Submit a guess — drawer trigger disappears (only shown in guessing state, which is correct).

- [ ] **Step 5: Commit**

```bash
git add src/components/GamePage.tsx
git commit -m "feat(grading): wire CriteriaDrawer into GamePage guessing state

Adds a 'View grading criteria' trigger link above the Enter button.
Drawer is mounted with open state managed in GamePage and is
implicitly unmounted when state transitions out of 'guessing'.

This is one of three surfaces for the grading guide. The post-guess
inline comparison and the /learn page come in subsequent tasks."
```

---

## Task 6: Add post-guess inline comparison

Two `CriteriaCard`s rendered between the "you guessed X — actual grade Y" line and the StatsPanel. Mobile: stacked, actual first. Desktop ≥640px: side-by-side. Animation joins the existing reveal stagger at 0.6s.

**Files:**
- Modify: `src/components/GamePage.tsx`

- [ ] **Step 1: Add CriteriaCard import**

Near the other component imports in `src/components/GamePage.tsx`:

```tsx
import { CriteriaCard } from './CriteriaCard'
```

- [ ] **Step 2: Insert the comparison section in the revealed state**

Find the `{state === 'revealed' && reveal && guess != null && diff != null && (` block. Locate the `<StatsPanel ... />` element. Immediately ABOVE the wrapper div that animates the StatsPanel (look for the comment `{/* Stats panel - slides up */}`), insert:

```tsx
{/* Criteria comparison - fade in between "you guessed" line and stats */}
<div
  className={`mb-4 ${animateReveal ? 'animate-fade' : ''}`}
  style={{
    animationDelay: animateReveal ? '0.6s' : undefined,
    opacity: animateReveal ? 0 : 1,
    animationFillMode: 'forwards',
  }}
>
  {guess === reveal.actualGrade ? (
    <CriteriaCard grade={reveal.actualGrade} />
  ) : (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <div className="flex-1">
        <CriteriaCard grade={reveal.actualGrade} eyebrow="Actual" />
      </div>
      <div className="flex-1">
        <CriteriaCard grade={guess} eyebrow="Your guess" />
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 3: Lint, build, dev-test the three scenarios**

```bash
npm run lint
npm run build
```

Manual test:
```bash
npm run dev
```

Three scenarios to verify:
1. **Mismatch in 7-10 range:** Submit a guess that's off by 1-3 from today's grade. After reveal, two cards appear — Actual (left/top) and Your guess (right/bottom). Animation timing: criteria fade in after the "you guessed" line, before stats slide up.
2. **Exact match:** Use browser DevTools to seed `localStorage` with a stored guess matching the actual grade (or play through a real exact match if today's grade is guessable). Verify only ONE card renders, no eyebrow labels.
3. **Out of range:** If today's actual is `< 7` or you guess `< 7`, the corresponding side renders the "Below 7" placeholder card. (If neither happens organically today, manually set the guess to 5 in DevTools and verify.)

Desktop side-by-side: resize the browser to ≥640px width — cards should sit side-by-side. Below 640px — they stack vertically.

- [ ] **Step 4: Commit**

```bash
git add src/components/GamePage.tsx
git commit -m "feat(grading): post-guess inline criteria comparison

Renders the actual grade's criteria + the user's guess's criteria
side-by-side (desktop) or stacked (mobile) right after the reveal
feedback. Joins the existing staggered animation chain at 0.6s, after
the 'you guessed' line and before the stats panel slides up.

When the guess matches the actual grade, renders one card without
eyebrow labels — two identical cards would be noise."
```

---

## Task 7: Create `LearnPage` component

Standalone route at `/learn`. Single column, ~560px max-width, header with back nav, four CriteriaCards stacked highest-first, footer attribution.

**Files:**
- Create: `src/components/LearnPage.tsx`

- [ ] **Step 1: Implement `src/components/LearnPage.tsx`**

Create `/Users/yannicklee/Documents/workspace/slabble/src/components/LearnPage.tsx`:

```tsx
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
```

- [ ] **Step 2: Lint, build**

```bash
npm run lint
npm run build
```

Expected: no errors. The page isn't routed yet (Task 8 wires the route), so dev-testing it requires manually visiting `/learn` after Task 8 lands.

- [ ] **Step 3: Commit**

```bash
git add src/components/LearnPage.tsx
git commit -m "feat(grading): add LearnPage read-mode component

Standalone full-page surface for browsing PSA grades 7-10 leisurely.
Single column, 560px max-width, header with back/close nav, all four
cards stacked highest-first, footer with PSA attribution + link.

Not yet routed — Task 8 wires it into main.tsx and adds the IntroPage
footer entry point."
```

---

## Task 8: Wire `/learn` route + IntroPage entry point

Adds the route registration and a subtle footer link from the IntroPage.

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/components/IntroPage.tsx`

- [ ] **Step 1: Register `/learn` route in `src/main.tsx`**

Find the existing `<Routes>` block. Update the import line to include LearnPage:

```tsx
import { LearnPage } from './components/LearnPage'
```

Add a new `<Route>` inside `<Routes>`, after the `/` route:

```tsx
<Routes>
  <Route path="/" element={<IntroPage />} />
  <Route path="/learn" element={<LearnPage />} />
  <Route path="/:game" element={<GamePage />} />
</Routes>
```

- [ ] **Step 2: Add IntroPage footer link**

In `src/components/IntroPage.tsx`, find the footer block:

```tsx
<div className="mt-10 text-center text-[14px] font-medium text-[var(--color-text-secondary)]">
  <div>{today}</div>
  <div className="mt-1">Slabble #{puzzleNumber}</div>
</div>
```

Replace with:

```tsx
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
```

`navigate` is already in scope (used by the Play button).

- [ ] **Step 3: Lint, build, dev-test**

```bash
npm run lint
npm run build
npm run dev
```

Visit `http://localhost:5173/`. The intro shows the wordmark, slab silhouette, Play button, date, puzzle number, AND now a "Learn the grades →" link. Click it — lands on `/learn` showing the four cards. Click the back arrow or X — returns to the intro.

Visit `http://localhost:5173/learn` directly — page loads correctly.

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx src/components/IntroPage.tsx
git commit -m "feat(grading): wire /learn route + IntroPage entry point

Adds the /learn route to the BrowserRouter and a subtle 'Learn the
grades →' link in the IntroPage footer below the puzzle number.

The link uses muted styling so it doesn't compete with the Play CTA,
matching the Wordle-style sparseness of the intro."
```

---

## Task 9: Add Onboarding modal footer link

Secondary entry point for users who came in via the help icon and want deeper content.

**Files:**
- Modify: `src/components/Onboarding.tsx`

- [ ] **Step 1: Add useNavigate + footer link**

Replace the entire contents of `src/components/Onboarding.tsx` with:

```tsx
import { useNavigate } from 'react-router-dom'

interface OnboardingProps {
  onDismiss: () => void
}

export function Onboarding({ onDismiss }: OnboardingProps) {
  const navigate = useNavigate()

  function handleLearnClick() {
    onDismiss()
    navigate('/learn')
  }

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

        <button
          type="button"
          onClick={handleLearnClick}
          className="mt-3 block w-full text-center text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] underline-offset-2 hover:text-[var(--color-text-secondary)] hover:underline"
        >
          Read full grading criteria →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Lint, build, dev-test**

```bash
npm run lint
npm run build
npm run dev
```

Visit `http://localhost:5173/pokemon`. Click the `?` help icon in the header to open the Onboarding modal. Verify the existing content still looks right and there's now a "Read full grading criteria →" link below the Play button. Click it — modal dismisses AND navigates to `/learn`.

- [ ] **Step 3: Commit**

```bash
git add src/components/Onboarding.tsx
git commit -m "feat(grading): add Onboarding modal footer link to /learn

Secondary entry point. Anyone who clicks the help icon now has a path
to the deeper grading-criteria content. The link dismisses the modal
and navigates rather than stacking surfaces."
```

---

## Task 10: Add book icon link to GamePage header

Direct entry to `/learn` from the header — one tap away while playing.

**Files:**
- Modify: `src/components/GamePage.tsx`

- [ ] **Step 1: Import useNavigate (if not already imported)**

Check the top of `src/components/GamePage.tsx`. The line `import { useParams } from 'react-router-dom'` exists. Update it to also import `useNavigate`:

```tsx
import { useNavigate, useParams } from 'react-router-dom'
```

In the `GamePage` function body, near other hook calls (right after `useParams`), add:

```tsx
const navigate = useNavigate()
```

- [ ] **Step 2: Add the book icon link to the header**

Find the header definition in `GamePage.tsx` (look for `const header = (`). It currently has a left spacer, the centered "Slabble" title, and a right `<div>` containing the help (`?`) button.

Replace the right-side `<div>` block. It currently looks like:

```tsx
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
```

Replace with:

```tsx
<div className="flex w-[88px] items-center justify-end gap-3">
  <button
    type="button"
    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
    aria-label="Grading criteria"
    onClick={() => navigate('/learn')}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  </button>
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
```

The container width grows from 44px to 88px to accommodate two icons. The new icon is a simple book outline (Lucide-style "book" SVG).

- [ ] **Step 3: Update the left spacer for visual centering**

In the same header block, find the line:

```tsx
<div className="w-[44px]" />
```

Change to:

```tsx
<div className="w-[88px]" />
```

This keeps the centered "SLABBLE" title visually balanced now that there are two icons on the right.

- [ ] **Step 4: Lint, build, dev-test**

```bash
npm run lint
npm run build
npm run dev
```

Visit `http://localhost:5173/pokemon`. Header now shows: the "SLABBLE" title centered, two icons on the right (book + help), no shift in the title's centering. Click the book icon — navigates to `/learn`. Click `?` — opens the Onboarding modal as before.

- [ ] **Step 5: Commit**

```bash
git add src/components/GamePage.tsx
git commit -m "feat(grading): add book-icon link to /learn in GamePage header

Direct entry point next to the existing help (?) icon. One tap from
the game to the read-mode grading-criteria page. Header spacer width
bumped from 44px to 88px on both sides so the title stays visually
centered with two right-aligned icons."
```

---

## Task 11: Final smoke test + open PR

Run all tests, lint, build. Manually verify each surface end-to-end. Push branch and open PR.

**Files:** none modified.

- [ ] **Step 1: Full test + lint + build**

```bash
npm test
npm run lint
npm run build
```

Expected: all tests pass (grading.ts + CriteriaCard tests), lint clean, build clean.

- [ ] **Step 2: Manual smoke checklist**

Run `npm run dev` and walk through every surface:

- [ ] `/` (IntroPage) — wordmark, slab, Play button, "Learn the grades →" link in footer.
- [ ] Click "Learn the grades →" — `/learn` loads, four cards stacked, back arrow returns to `/`.
- [ ] Direct `/learn` visit — same page renders.
- [ ] Click Play → `/pokemon` (GamePage in guessing state).
- [ ] Header: book icon + `?` icon both visible, title still centered.
- [ ] Click book icon — navigates to `/learn`. Browser back returns to `/pokemon` mid-puzzle.
- [ ] Click `?` icon — Onboarding modal opens with new "Read full grading criteria →" link at the bottom. Click it — modal dismisses, navigates to `/learn`.
- [ ] Back to `/pokemon`. Below the grade tiles, "View grading criteria" link is visible.
- [ ] Click "View grading criteria" — drawer slides up, four cards visible, card image still visible at top behind the dim. Tap backdrop, X, Escape — drawer closes via each.
- [ ] Submit a guess. Drawer trigger disappears. Reveal animation plays. Criteria comparison appears between "you guessed" line and stats panel.
- [ ] Mobile width (DevTools 375px): comparison cards stack vertically, Actual on top.
- [ ] Desktop width (DevTools 1024px): comparison cards side-by-side, Actual on left.
- [ ] (If test data allows) Verify exact-match renders ONE card; verify out-of-range guess (manually inject `5` via DevTools localStorage if needed) renders the "Below 7" placeholder.

- [ ] **Step 3: Push branch + open PR**

```bash
git push -u origin <current-branch-name>
gh pr create --base main --title "feat: PSA grading criteria guide" --body "$(cat <<'EOF'
## Summary
Adds PSA 7-10 grading criteria as a learning resource across three surfaces:
1. **In-game drawer** — "View grading criteria" link below the grade tiles opens a 60vh slide-up sheet with all four cards.
2. **Post-guess inline comparison** — actual + guessed grade rendered side-by-side (desktop) or stacked (mobile) right after the reveal feedback.
3. **`/learn` page** — read-mode browsing accessible from the IntroPage footer, the GamePage header (new book icon), and the Onboarding modal footer.

Single source of truth in `src/lib/grading.ts`. One presentational `CriteriaCard` is reused across all three surfaces. Out-of-range grades (`< 7`) render a "Below 7" placeholder linking to psacard.com.

## What's new under the hood
- Vitest + @testing-library/react added (slabble had no test framework).
- Unit tests on `grading.ts`, component tests on `CriteriaCard`.
- No E2E (per spec).

## Spec
\`docs/superpowers/specs/2026-04-29-grading-guide-design.md\`

## Test plan
- [ ] \`npm test\` passes (unit + component tests)
- [ ] \`npm run lint\` clean
- [ ] \`npm run build\` clean
- [ ] Manual: every entry point reaches /learn (IntroPage footer, GamePage header book icon, Onboarding modal footer)
- [ ] Manual: drawer opens/closes via backdrop/X/Escape
- [ ] Manual: post-guess comparison renders correctly for off-by-N, exact match, and out-of-range cases
EOF
)"
```

- [ ] **Step 4: Verify CI passes on the PR**

GitHub Actions will run `npm ci && npm run lint && npm run build` on the PR (per the existing workflow). The new `npm test` step is NOT in CI yet — that's a follow-up nice-to-have, not in scope for this PR.

If CI fails, address the failure and push another commit. If CI passes, the PR is ready for merge.
