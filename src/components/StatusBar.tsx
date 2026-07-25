"use client"

import type { FetchStatus } from "@/lib/types"

interface StatusBarProps {
  status: FetchStatus
  lastUpdated: Date | null
  source: "bing" | "rss" | null
  onRefresh: () => void
}

export default function StatusBar({ status, lastUpdated, source, onRefresh }: StatusBarProps) {
  const loading = status === "loading"
  const error = status === "error"

  const timeAgo = lastUpdated
    ? (() => {
        const diff = Date.now() - lastUpdated.getTime()
        const s = Math.floor(diff / 1000)
        if (s < 60) return `${s}s ago`
        return `${Math.floor(s / 60)}m ago`
      })()
    : null

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-xs text-zinc-400 dark:border-zinc-700">
      <div className="flex items-center gap-3">
        {loading && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Updating...
          </span>
        )}
        {!loading && timeAgo && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            Updated {timeAgo}
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1.5 text-red-500">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            Connection issue
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {source && (
          <span className="capitalize">
            Source:{" "}
            <span className={source === "bing" ? "font-medium text-blue-500" : "font-medium text-orange-500"}>
              {source === "bing" ? "Bing News" : "Google RSS"}
            </span>
          </span>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
        >
          <svg
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  )
}
