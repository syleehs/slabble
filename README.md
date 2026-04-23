# Slabble

A daily trading-card grade-guessing game. See a graded card, guess the 1–10 grade, reveal. One card per category per day.

Categories: Pokémon, One Piece, baseball, basketball, football.

Live: https://slabble.app

## Stack

- React 19 + Vite + TailwindCSS 4
- `react-router-dom` SPA, client-side only
- Hosted on S3 + CloudFront (Cloudflare DNS in front)
- Backend: shared [Hikokyu](#) Go Lambda (see `VITE_API_URL`)

## Commands

```bash
npm install
npm run dev          # dev server on http://localhost:5173
npm run build        # type-check + vite build → dist/
npm run lint         # eslint
```

## Config

```bash
VITE_API_URL=<hikokyu-cloudfront-url>
```

No server-side state. All player data (streaks, stats, saved guesses) lives in `localStorage` under keys prefixed with `gg-`. The prefix is preserved from the original project name to keep existing player streaks intact.

## Deploy

```bash
npm run build
aws s3 sync dist/ s3://gradeguess-site/ --exclude "cards/*" --delete
```

S3 bucket name is legacy (pre-rename) and intentionally unchanged — renaming a bucket requires a full migration. Domain (`slabble.app`) routes to the CloudFront distribution in front of this bucket.

## Project structure

```
src/
├── components/
│   ├── Hub.tsx           # /  — landing, 5 game tiles, combined stats
│   ├── GamePage.tsx      # /:game — play flow
│   ├── CardViewer.tsx    # zoomable card image + lightbox
│   ├── Onboarding.tsx    # first-visit overlay
│   └── StatsPanel.tsx    # reusable histogram
└── lib/
    ├── api.ts            # Hikokyu calls
    ├── storage.ts        # localStorage (gg- prefix)
    └── types.ts          # game slugs, card/reveal types
```
