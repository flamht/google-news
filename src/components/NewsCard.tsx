"use client"

import type { NewsItem } from "@/lib/types"

interface NewsCardProps {
  item: NewsItem
  isNew?: boolean
  onPlayerClick?: (name: string) => void
}

export default function NewsCard({ item, isNew, onPlayerClick }: NewsCardProps) {
  const domain = item.source || (() => {
    try {
      return new URL(item.url).hostname.replace("www.", "")
    } catch {
      return ""
    }
  })()

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex flex-col rounded-xl border p-3 transition-all hover:shadow-md ${
        isNew
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
      }`}
    >
      {isNew && (
        <span className="absolute -right-1 -top-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
        </span>
      )}

      <div className="flex gap-3">
        {item.thumbnail && (
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
            <img
              src={item.thumbnail}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none"
              }}
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-emerald-700 dark:text-zinc-100 dark:group-hover:text-emerald-400">
            {item.title}
          </h3>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
            <span className="truncate">{domain}</span>
            {item.date && (
              <>
                <span>·</span>
                <span className="whitespace-nowrap">{item.date}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {item.players.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.players.slice(0, 3).map((player) => (
            <button
              key={player}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onPlayerClick?.(player)
              }}
              className="inline-flex cursor-pointer items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-800/60"
            >
              {player}
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {item.summary || item.snippet}
      </p>
    </a>
  )
}
