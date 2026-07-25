"use client"

import { useState } from "react"
import TopicSelector from "@/components/TopicSelector"
import AIOverview from "@/components/AIOverview"
import NewsGrid from "@/components/NewsGrid"
import StatusBar from "@/components/StatusBar"
import Skeleton from "@/components/Skeleton"
import { useNewsPolling } from "@/hooks/useNewsPolling"

export default function Home() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedClub, setSelectedClub] = useState<string | null>(null)

  const { data, status, error, lastUpdated, refresh } = useNewsPolling({
    type: selectedType,
    club: selectedClub,
  })

  const hasSelection = selectedType || selectedClub

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          ⚽ Footy News
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Real-time football news with Google AI summaries
        </p>
      </header>

      <section className="mb-6">
        <TopicSelector
          selectedType={selectedType}
          selectedClub={selectedClub}
          onTypeChange={setSelectedType}
          onClubChange={setSelectedClub}
        />
      </section>

      {!hasSelection && (
        <div className="flex flex-1 flex-col items-center justify-center py-24 text-zinc-400">
          <svg className="mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <p className="text-lg font-medium">Select a topic to get started</p>
          <p className="mt-1 text-sm">Pick a Type and/or Club above to see live football news</p>
        </div>
      )}

      {hasSelection && (
        <div className="flex-1 space-y-4">
          {(status === "loading" || status === "idle") && <Skeleton />}

          {status === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/30">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error || "Failed to load news. Retrying..."}
              </p>
              <button
                onClick={refresh}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {data && (
            <>
              <AIOverview text={data.aiOverview} />
              <NewsGrid items={data.news} />
              <StatusBar
                status={status}
                lastUpdated={lastUpdated}
                source={data.source}
                onRefresh={refresh}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
