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
    const parsed = raw ? JSON.parse(raw) : {}
    return { streak: 0, maxStreak: 0, playStreak: 0, maxPlayStreak: 0, distribution: {}, history: [], ...parsed }
  } catch {
    return { streak: 0, maxStreak: 0, playStreak: 0, maxPlayStreak: 0, distribution: {}, history: [] }
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

  // Streak requires: exact guess AND played the previous puzzle (consecutive days)
  const lastEntry = stats.history.length > 0 ? stats.history[stats.history.length - 1] : null
  const playedYesterday = lastEntry !== null && lastEntry.puzzleNumber === puzzleNumber - 1
  const wasOnStreak = stats.streak > 0

  // Perfect streak: exact guess on consecutive days
  let newStreak: number
  if (!isExact) {
    newStreak = 0
  } else if (wasOnStreak && playedYesterday) {
    newStreak = stats.streak + 1
  } else {
    newStreak = 1
  }

  // Play streak: played on consecutive days (regardless of guess accuracy)
  const prevPlayStreak = stats.playStreak ?? 0
  const maxPlayStreak = stats.maxPlayStreak ?? 0
  const newPlayStreak = playedYesterday || prevPlayStreak === 0 ? prevPlayStreak + 1 : 1

  const newDistribution = { ...stats.distribution }
  newDistribution[diff] = (newDistribution[diff] ?? 0) + 1
  return {
    streak: newStreak,
    maxStreak: Math.max(stats.maxStreak, newStreak),
    playStreak: newPlayStreak,
    maxPlayStreak: Math.max(maxPlayStreak, newPlayStreak),
    distribution: newDistribution,
    history: [...stats.history, { puzzleNumber, guess, actual }].slice(-365),
  }
}
