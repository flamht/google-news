export interface NewsItem {
  title: string
  url: string
  source: string
  date: string
  snippet: string
  thumbnail?: string
}

export interface SearchResult {
  aiOverview: string | null
  news: NewsItem[]
  source: "google" | "rss"
  query: string
}

export type FetchStatus = "idle" | "loading" | "ready" | "error"
