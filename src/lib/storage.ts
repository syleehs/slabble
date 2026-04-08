import type { DailyStats, DailyReveal, GameSlug } from './types'

export function loadGuess(game: GameSlug, puzzleNumber: number): { guess: number; reveal: DailyReveal } | null {
  try {
    const raw = localStorage.getItem(`gg-${game}-${puzzleNumber}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveGuess(game: GameSlug, puzzleNumber: number, guess: number, reveal: DailyReveal): void {
  localStorage.setItem(`gg-${game}-${puzzleNumber}`, JSON.stringify({ guess, reveal }))
}

export function loadStats(game: GameSlug): DailyStats {
  try {
    const raw = localStorage.getItem(`gg-${game}-stats`)
    return raw ? JSON.parse(raw) : { streak: 0, maxStreak: 0, distribution: {}, history: [] }
  } catch {
    return { streak: 0, maxStreak: 0, distribution: {}, history: [] }
  }
}

export function saveStats(game: GameSlug, stats: DailyStats): void {
  localStorage.setItem(`gg-${game}-stats`, JSON.stringify(stats))
}

export function isOnboarded(): boolean {
  return localStorage.getItem('gg-onboarded') === 'true'
}

export function setOnboarded(): void {
  localStorage.setItem('gg-onboarded', 'true')
}

export function updateStats(stats: DailyStats, puzzleNumber: number, guess: number, actual: number): DailyStats {
  const isExact = guess === actual
  const diff = Math.abs(guess - actual)
  const newStreak = isExact ? stats.streak + 1 : 0
  const newDistribution = { ...stats.distribution }
  newDistribution[diff] = (newDistribution[diff] ?? 0) + 1
  return {
    streak: newStreak,
    maxStreak: Math.max(stats.maxStreak, newStreak),
    distribution: newDistribution,
    history: [...stats.history, { puzzleNumber, guess, actual }].slice(-365),
  }
}
