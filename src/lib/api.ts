import type { DailyCard, DailyReveal, GameSlug, GameStatus } from './types'

const API_URL = import.meta.env.VITE_API_URL || ''

export async function fetchDaily(game: GameSlug): Promise<DailyCard> {
  const res = await fetch(`${API_URL}/daily/${game}`)
  if (!res.ok) throw new Error(`Daily error ${res.status}`)
  return res.json()
}

export async function submitGuess(game: GameSlug, puzzleNumber: number, guess: number): Promise<DailyReveal> {
  const res = await fetch(`${API_URL}/daily/${game}/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puzzleNumber, guess }),
  })
  if (!res.ok) throw new Error(`Guess error ${res.status}`)
  return res.json()
}

export async function fetchStatus(): Promise<Record<string, GameStatus>> {
  const res = await fetch(`${API_URL}/daily/status`)
  if (!res.ok) throw new Error(`Status error ${res.status}`)
  return res.json()
}
