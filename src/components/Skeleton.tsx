"use client"

export default function Skeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
          <div className="flex gap-3">
            <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
