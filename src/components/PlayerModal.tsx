"use client"

import { useEffect, useState } from "react"
import type { PlayerDetail } from "@/lib/types"
import { fetchPlayerFromBrowser } from "@/lib/client-sofascore"

interface PlayerModalProps {
  playerName: string
  onClose: () => void
}

export default function PlayerModal({ playerName, onClose }: PlayerModalProps) {
  const [data, setData] = useState<PlayerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)

    async function load() {
      const fromBrowser = await fetchPlayerFromBrowser(playerName)
      if (fromBrowser) {
        setData(fromBrowser)
        setLoading(false)
        return
      }

      try {
        const r = await fetch(`/api/player/${encodeURIComponent(playerName)}`)
        if (!r.ok) throw new Error()
        setData(await r.json())
      } catch {
        setError(true)
      }
      setLoading(false)
    }

    load()
  }, [playerName])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  const lastSeason = data?.lastSeasonStats ?? []
  const seasonTotal = lastSeason.reduce(
    (acc, s) => ({
      games: acc.games + s.games,
      goals: acc.goals + s.goals,
      assists: acc.assists + s.assists,
      minutes: acc.minutes + s.minutesPlayed,
      rating: acc.rating + s.rating * s.games,
      gameWeight: acc.gameWeight + s.games,
    }),
    { games: 0, goals: 0, assists: 0, minutes: 0, rating: 0, gameWeight: 0 },
  )
  const avgRating = seasonTotal.gameWeight > 0
    ? (seasonTotal.rating / seasonTotal.gameWeight).toFixed(2)
    : "-"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
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
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              ✕
            </button>

            <div className="relative flex flex-col items-center pt-8">
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
              <h2 className="mt-3 text-xl font-bold text-zinc-900 dark:text-white">
                {data.name}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {data.teamName}
                {data.jerseyNumber > 0 && ` · #${data.jerseyNumber}`}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 px-4">
                {data.positionsDetailed.map((pos) => (
                  <span
                    key={pos}
                    className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  >
                    {pos}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 px-6 text-sm">
              {[
                ["Position", data.position === "F" ? "Forward" : data.position === "M" ? "Midfielder" : data.position === "D" ? "Defender" : data.position === "G" ? "Goalkeeper" : data.position],
                ["Age", data.age ? `${data.age} years` : ""],
                ["Height", data.height ? `${data.height} cm` : ""],
                ["Date of Birth", data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""],
                ["Nationality", data.nationality],
                ["Preferred Foot", data.preferredFoot],
                ["Market Value", data.marketValue],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label}>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">{label}</div>
                    <div className="font-medium text-zinc-800 dark:text-zinc-200">{value}</div>
                  </div>
                ))}
            </div>

            <div className="mt-5 flex items-center justify-center gap-4 px-6 text-xs">
              <a
                href={`https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(data.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 underline hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Transfermarkt
              </a>
              {data.slug && (
                <a
                  href={`https://www.sofascore.com/football/player/${data.slug}/${data.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  Sofascore
                </a>
              )}
            </div>

            {lastSeason.length > 0 && (
              <div className="mt-3 space-y-2 px-6 pb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {lastSeason[0].seasonName} Campaigns
                </h3>

                <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                  <div className="mb-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Total
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      ["G", seasonTotal.games],
                      ["GL", seasonTotal.goals],
                      ["A", seasonTotal.assists],
                      ["MIN", seasonTotal.minutes],
                      ["RT", avgRating],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="text-sm font-bold text-zinc-900 dark:text-white">
                          {value}
                        </div>
                        <div className="text-[9px] text-zinc-400 dark:text-zinc-500">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {lastSeason.map((s) => (
                  <div
                    key={s.tournamentName + s.seasonName}
                    className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50"
                  >
                    <div className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {s.tournamentName}
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {[
                        ["G", s.games],
                        ["GL", s.goals],
                        ["A", s.assists],
                        ["MIN", s.minutesPlayed],
                        ["RT", s.rating ? s.rating.toFixed(1) : "-"],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div className="text-sm font-bold text-zinc-900 dark:text-white">
                            {value ?? "-"}
                          </div>
                          <div className="text-[9px] text-zinc-400 dark:text-zinc-500">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}