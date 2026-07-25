export interface NewsItem {
  title: string
  url: string
  source: string
  date: string
  snippet: string
  thumbnail?: string
  summary: string
  players: string[]
  clubs: string[]
}

export interface SearchResult {
  aiOverview: null
  news: NewsItem[]
  source: "bing" | "rss"
  query: string
}

export type FetchStatus = "idle" | "loading" | "ready" | "error"

export interface SeasonStats {
  seasonName: string
  tournamentName: string
  games: number
  goals: number
  assists: number
  minutesPlayed: number
  rating: number
}

export interface PlayerDetail {
  id: number
  name: string
  slug: string
  firstName: string
  lastName: string
  teamName: string
  position: string
  positionsDetailed: string[]
  height: number
  dateOfBirth: string
  age: number
  nationality: string
  jerseyNumber: number
  preferredFoot: string
  marketValue: string
  imageUrl: string
  seasonStats: SeasonStats[]
  lastSeasonStats: SeasonStats[]
}
