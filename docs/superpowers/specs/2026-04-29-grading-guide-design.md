# Grading Guide — Design

**Date:** 2026-04-29
**Status:** Spec, awaiting user approval before implementation plan.

## Goal

Help slabble users figure out what grade a card should fall under by surfacing PSA's published grading criteria for grades 7-10 (the range the eBay-biased puzzle pool reliably hits). The criteria appear in three places, each tuned to a different user moment:

1. **In-game quick reference** while the user is staring at today's card and trying to decide between, say, a 9 and a 10.
2. **Post-guess inline comparison** showing the criteria for the actual grade and the user's guess side-by-side, framing the result as a teaching moment.
3. **Read-mode** at a dedicated `/learn` page for users browsing the criteria leisurely, accessible from the IntroPage and the GamePage header.

## Non-goals (V1)

- TAG grading criteria. May add later if users ask.
- Sports card variants of PSA criteria. Our content is TCG-specific.
- Interactive comparison sliders, photo examples, or annotated diagrams.
- Per-grade URL anchors like `/learn#grade-9`. Easy to add later.
- Coverage of grades 1-6. The eBay puzzle pool skews 8+; out-of-range guesses or actual grades render a generic "Below 7" placeholder.

## Content + data model

All criteria text lives in a single typed constant in `src/lib/grading.ts`:

```ts
export interface GradeCriteria {
  grade: number       // 7, 8, 9, or 10
  label: string       // e.g. "Gem Mint", "Mint", "Near Mint-Mint", "Near Mint"
  summary: string     // 1-2 sentence verbatim PSA quote
  source: 'PSA'
}

export const PSA_CRITERIA: Record<7 | 8 | 9 | 10, GradeCriteria> = {
  7:  { ... },
  8:  { ... },
  9:  { ... },
  10: { ... },
}

export const PSA_REFERENCE_URL = 'https://www.psacard.com/grades'
```

**Source.** The four `summary` strings are short verbatim quotes (1-2 sentences each) pulled from psacard.com/grades. Each is short enough to lean on fair use (educational purpose, minimal amount, attribution + link back). The full grading scale is on PSA's site; we link there from every surface.

**Drafting workflow.** Before the implementation PR lands, the four quotes are sourced from psacard.com and pasted as string literals. No CMS, no fetching — PSA updates this content roughly once a decade. If they ever rephrase, it's a one-file PR.

## Component architecture

Three new components, plus inline rendering inside `GamePage`:

| File | Responsibility | Used by |
|---|---|---|
| `src/components/CriteriaCard.tsx` | Pure presentational. Renders one grade's criteria as a styled card. Handles the `<7` "Below 7" fallback when given a grade outside 7-10. | All three surfaces — the shared atom. |
| `src/components/CriteriaDrawer.tsx` | Bottom-anchored slide-up sheet. Renders all four `CriteriaCard`s with a header bar and footer attribution. Mounted in `GamePage` only during `guessing` state. | In-game quick reference. |
| `src/components/LearnPage.tsx` | Full-page route at `/learn`. Header with back nav, subtitle, all four `CriteriaCard`s stacked highest-to-lowest, footer attribution. | Read mode. |

The post-guess reveal does **not** get its own component. It composes two `CriteriaCard`s inline inside the existing reveal section of `GamePage`.

**Routing.** Add `<Route path="/learn" element={<LearnPage />} />` to `src/main.tsx` alongside the existing `/` and `/:game` routes.

## Per-surface behavior

### Surface 1 — In-game criteria drawer

**Trigger.** Subtle text link "View grading criteria" centered below the grade tiles in the GamePage `guessing` state, above the Enter button. Subdued color (`var(--color-text-secondary)`) so it doesn't compete with the primary action.

**Open behavior.** Slides up from `translate-y-full` to `translate-y-0` over ~250 ms ease-out. Drawer height: 60vh. Backdrop above the drawer dims to ~30% black; the card image stays visible underneath the dim so users can keep referencing it while reading.

**Layout.** Same on mobile and desktop. Header bar at the top with title "PSA grading criteria · Pokemon TCG" and a close (X) button on the right. Body: four CriteriaCards stacked vertically, ordered 10 → 9 → 8 → 7 (highest first). Footer: `Source: PSA · psacard.com/grades` link.

**Dismiss patterns:**
- Tap the dimmed backdrop area above the drawer
- Press Escape
- Tap the X button in the header

V1 explicitly omits swipe-down-to-dismiss (extra touch-handling code, marginal benefit when X and backdrop already work).

**State.** No persistence — fresh on each open. Mounted only in `guessing` state, unmounted on transition to `revealed`.

**Accessibility.** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title element. Escape closes. Focus moves to the close button on open and returns to the trigger link on close. No full focus trap in V1 — slabble has no other modals competing for focus while this drawer is open.

### Surface 2 — Post-guess inline comparison

**Position.** Inside the existing GamePage `revealed` section, between the "You guessed X — actual grade Y" line and the StatsPanel.

**Layout.**
- **Mobile (default):** two CriteriaCards stacked vertically. **Actual grade first, then user's guess.** Each card carries a small label above — "Actual" and "Your guess" — so it's never ambiguous.
- **Desktop (≥ 640px):** side-by-side, equal-width, with a thin vertical divider between them. Actual on the left, guess on the right.

**Animation.** Joins the existing staggered reveal chain:
- 0.0 s — result tile flips
- 0.3 s — feedback text fades in
- 0.4 s — "you guessed X — actual grade Y" line fades in
- **0.6 s — criteria comparison fades in** (new)
- 0.8 s — stats panel slides up
- 1.0 s — share button fades in

Reuses the existing `animate-fade` utility class.

**Special cases:**
- **Guess equals actual.** Render one card with the label "PSA {n} criteria" (no Actual/Guess duality). Two identical cards would be noise.
- **Guess off by 1 ("close").** Standard two-card layout. The contrast between, say, PSA 9 and PSA 10 is exactly what teaches the user.
- **Out-of-range (guess or actual `< 7`).** That side renders the "Below 7" placeholder card (see below). The other side renders normally.
- **Both out-of-range.** Two placeholder cards. Rare, but possible.

**No interaction.** Read-only — no expand/collapse, no clicks. The user already saw the drawer if they wanted depth; the inline comparison is the in-context teaching moment.

### Surface 3 — `/learn` page

**Layout.** Standalone route at `/learn`. Single column, max-width ~560px, centered. Same dark Wordle-style theme as the rest of the app.

Page structure:
1. Header bar: small back arrow (`←`) on the left calling `navigate(-1)`, title "Grading criteria" centered, X icon as alt close (also `navigate(-1)`).
2. Subtitle paragraph: 2-3 sentences explaining what's on the page and that the full PSA scale is at psacard.com.
3. Four CriteriaCards stacked vertically, **PSA 10 → 9 → 8 → 7** (highest first — most readers care about that order).
4. Footer line: `Source: PSA · psacard.com/grades` link.

**Entry points:**

| Surface | Entry | Purpose |
|---|---|---|
| IntroPage footer | Small text link "Learn the grades →" added below the puzzle number line. | Subtle, fits the Wordle-style sparseness. |
| GamePage header | New book/info icon next to the existing `?` icon. Direct link to `/learn`. | One tap away while playing. |
| Onboarding modal footer | Text link "Read full grading criteria →" at the bottom of the modal. | Secondary path for users who came in through the help icon. |

The in-game drawer and the post-guess inline comparison handle in-game needs — they don't need to push users out to `/learn`.

## Out-of-range fallback (`< 7`)

When a CriteriaCard is given a grade outside 7-10, it renders a placeholder variant:
- Muted styling (lower contrast text/border than a normal grade card)
- Label: "Below 7"
- Body: short generic text along the lines of "Significant condition issues — corner/edge wear, surface defects, or off-centering beyond mint tolerances."
- Footer link: "Full PSA scale →" pointing to psacard.com/grades

The post-guess comparison is the only place this matters in practice; the drawer and `/learn` page only ever render grades 7-10.

## Attribution

PSA must be credited on every surface where their text appears:
- **CriteriaCard:** small `Source: PSA` line under the body text on every card (no link on the card itself — cards are dense).
- **Drawer:** `Source: PSA · psacard.com/grades` link in the footer (one link covers all four cards).
- **/learn page:** same footer line as the drawer.
- **Post-guess inline comparison:** per-card `Source: PSA` line, matching the drawer cards.
- **Onboarding modal:** the "Read full grading criteria →" link is itself the surface-level attribution.

All `psacard.com/grades` links open in a new tab (`target="_blank" rel="noopener noreferrer"`).

## Testing

- **Unit tests** on `grading.ts`: every grade 7-10 has all required fields; the `<7` lookup returns the placeholder shape correctly.
- **Component tests** on `CriteriaCard`: renders the given grade's text, renders the "Below 7" fallback when given grade 5, renders the source line in both modes.
- **No E2E.** Slabble has no Playwright suite today; introducing one for this feature is overkill. The implementation PR includes a manual smoke test (open drawer, play a guess, click /learn from each of the three entry points).

## Bundle / performance

Four short paragraphs of static text + three small components ≈ < 5 KB added to the gzipped bundle. No dynamic imports, no code-splitting needed in V1.

## File-by-file summary

| Path | Change |
|---|---|
| `src/lib/grading.ts` | New. `PSA_CRITERIA` constant + types + `PSA_REFERENCE_URL`. |
| `src/components/CriteriaCard.tsx` | New. Pure presentational, handles `<7` fallback. |
| `src/components/CriteriaDrawer.tsx` | New. Slide-up bottom sheet. |
| `src/components/LearnPage.tsx` | New. Full-page route. |
| `src/components/GamePage.tsx` | Edit. Add drawer trigger + drawer mount in guessing state; add inline comparison section in revealed state; add new icon link to header. |
| `src/components/IntroPage.tsx` | Edit. Add footer link "Learn the grades →". |
| `src/components/Onboarding.tsx` | Edit. Add footer link "Read full grading criteria →". |
| `src/main.tsx` | Edit. Add `<Route path="/learn" element={<LearnPage />} />`. |
| `src/lib/grading.test.ts` | New. Unit tests on the data shape. |
| `src/components/CriteriaCard.test.tsx` | New. Component tests. |
