"use client"

interface AIOverviewProps {
  text: string | null
}

export default function AIOverview({ text }: AIOverviewProps) {
  if (!text) return null

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/50">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          AI
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          Google AI Overview
        </span>
      </div>
      <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{text}</p>
    </div>
  )
}
