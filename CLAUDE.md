# CLAUDE.md

## Commands

```bash
npm run dev          # dev server (localhost:5173)
npm run build        # type-check + vite build → dist/
npm run lint         # eslint
```

## Architecture

**Frontend** — React 19 + Vite + TailwindCSS 4 + react-router-dom SPA.
- `/` → Hub page (5 game tiles, combined stats, onboarding)
- `/:game` → Game page (card image, guess, reveal, per-game stats)

**Components:**
- `Hub.tsx` — Landing page with game tiles and combined stats
- `GamePage.tsx` — Play flow: image → guess 1-10 → reveal
- `Onboarding.tsx` — First-visit explainer overlay
- `StatsPanel.tsx` — Reusable stats histogram

**API:** Calls Hikokyu backend (shared Go Lambda):
- `GET /daily/{game}` → today's card image
- `POST /daily/{game}/guess` → submit guess, get reveal
- `GET /daily/status` → which games are available today

**Games:** pokemon, onepiece, baseball, basketball, football

**Config:** Set `VITE_API_URL` env var to point to the Hikokyu API CloudFront URL.

**localStorage:** All keys prefixed with `gg-`. No server-side state.

**Deploy:** `npm run build && aws s3 sync dist/ s3://{bucket}/`
