"use client"

import { useEffect, useState } from "react"
import type { WikiPlayer } from "@/lib/wikipedia"

interface PlayerModalProps {
  playerName: string
  onClose: () => void
}

export default function PlayerModal({ playerName, onClose }: PlayerModalProps) {
  const [data, setData] = useState<WikiPlayer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)

    fetch(`/api/wiki/${encodeURIComponent(playerName)}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [playerName])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          ✕
        </button>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-500" />
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-sm text-zinc-500">Could not load player details.</div>
        )}

        {data && !loading && (
          <>
            <div className="flex flex-col items-center pt-8">
              {data.imageUrl && (
                <div className="h-28 w-28 overflow-hidden rounded-full bg-zinc-100 shadow-md dark:bg-zinc-800">
                  <img
                    src={data.imageUrl}
                    alt={data.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
              )}
              <h2 className="mt-3 text-xl font-bold text-zinc-900 dark:text-white">
                {data.fullName || data.name}
              </h2>
              {data.description && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {data.description}
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 px-6 text-sm">
              {[
                ["Full name", data.fullName],
                ["Position", data.position],
                ["Current team", data.currentTeam],
                ["Date of birth", data.dateOfBirth],
                ["Height", data.height],
                ["Nationality", data.nationality],
              ]
                .filter(([, v]) => v && v !== data.name)
                .map(([label, value]) => (
                  <div key={label}>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">{label}</div>
                    <div className="font-medium text-zinc-800 dark:text-zinc-200">{value}</div>
                  </div>
                ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3 px-6 pb-6 text-sm">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(data.name)}+football+sofascore`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-amber-100 px-4 py-2 font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-800/60"
              >
                Sofascore
              </a>
              <a
                href={`https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(data.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-blue-100 px-4 py-2 font-medium text-blue-800 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-800/60"
              >
                Transfermarkt
              </a>
              <a
                href={`https://en.wikipedia.org/wiki/${encodeURIComponent(data.name.replace(/\s+/g, "_"))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-zinc-100 px-4 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Wikipedia
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
