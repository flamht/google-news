"use client"

import type { NewsItem } from "@/lib/types"
import NewsCard from "./NewsCard"

interface NewsGridProps {
  items: NewsItem[]
  knownUrls?: Set<string>
  onPlayerClick?: (name: string) => void
}

export default function NewsGrid({ items, knownUrls, onPlayerClick }: NewsGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
        <svg className="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
        <p className="text-sm">No news found. Try a different topic.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <NewsCard key={item.url} item={item} isNew={knownUrls ? !knownUrls.has(item.url) : false} onPlayerClick={onPlayerClick} />
      ))}
    </div>
  )
}
