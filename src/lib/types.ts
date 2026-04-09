export interface DailyCard {
  puzzleNumber: number
  imageUrl: string
}

export interface DailyReveal {
  actualGrade: number
  company: string
  cardName: string
  certNumber: string
  certUrl: string
  game: string
}

export interface GameStatus {
  puzzleNumber: number
  available: boolean
}

export interface DailyStats {
  streak: number
  maxStreak: number
  distribution: Record<number, number>
  history: Array<{ puzzleNumber: number; guess: number; actual: number }>
}

export type GameSlug = 'pokemon'

export interface GameInfo {
  slug: GameSlug
  name: string
  emoji: string
  color: string
}

export const GAMES: GameInfo[] = [
  { slug: 'pokemon', name: 'Pokemon', emoji: '🃏', color: '#ef4444' },
]

export function getGameInfo(slug: string): GameInfo | undefined {
  return GAMES.find(g => g.slug === slug)
}
