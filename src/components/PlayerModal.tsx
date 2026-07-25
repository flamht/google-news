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
    setLoading(true); setError(false)
    fetch(`/api/wiki/${encodeURIComponent(playerName)}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [playerName])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700">✕</button>

        {loading && <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-500" /></div>}
        {error && <div className="p-6 text-center text-sm text-zinc-500">Could not load player details.</div>}

        {data && !loading && (
          <>
            <div className="flex flex-col items-center pt-8">
              {data.imageUrl && (
                <div className="h-24 w-24 overflow-hidden rounded-full bg-zinc-100 shadow-md dark:bg-zinc-800">
                  <img src={data.imageUrl} alt={data.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                </div>
              )}
              <h2 className="mt-3 text-lg font-bold text-zinc-900 dark:text-white">{data.name}</h2>
              {data.description && <p className="mt-1 px-4 text-center text-xs text-zinc-500 dark:text-zinc-400">{data.description}</p>}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 px-6 text-sm">
              {data.position && <div><div className="text-[10px] uppercase tracking-wider text-zinc-400">Position</div><div className="font-medium text-zinc-800 dark:text-zinc-200">{data.position}</div></div>}
              {data.nationality && <div><div className="text-[10px] uppercase tracking-wider text-zinc-400">Nationality</div><div className="font-medium text-zinc-800 dark:text-zinc-200">{data.nationality}</div></div>}
              {data.dateOfBirth && <div><div className="text-[10px] uppercase tracking-wider text-zinc-400">Birthday</div><div className="font-medium text-zinc-800 dark:text-zinc-200">{data.dateOfBirth}{data.age ? ` (${data.age})` : ""}</div></div>}
              {data.height && <div><div className="text-[10px] uppercase tracking-wider text-zinc-400">Height</div><div className="font-medium text-zinc-800 dark:text-zinc-200">{data.height}</div></div>}
              {data.currentTeam && <div className="col-span-2"><div className="text-[10px] uppercase tracking-wider text-zinc-400">Team</div><div className="font-medium text-zinc-800 dark:text-zinc-200">{data.currentTeam}</div></div>}
            </div>

            {data.seasons && data.seasons.length > 0 && (
              <div className="mx-6 mt-4">
                <div className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-400">By season</div>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800/50">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-zinc-500 dark:text-zinc-400">Season</th>
                        <th className="px-2 py-1.5 text-left font-medium text-zinc-500 dark:text-zinc-400">Club</th>
                        <th className="px-2 py-1.5 text-left font-medium text-zinc-500 dark:text-zinc-400">League</th>
                        <th className="px-2 py-1.5 text-right font-medium text-zinc-500 dark:text-zinc-400">G</th>
                        <th className="px-2 py-1.5 text-right font-medium text-zinc-500 dark:text-zinc-400">GL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.seasons.map((s, i) => (
                        <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                          <td className="whitespace-nowrap px-2 py-1.5 text-zinc-800 dark:text-zinc-200">{s.season}</td>
                          <td className="px-2 py-1.5 text-zinc-800 dark:text-zinc-200">{s.club}</td>
                          <td className="px-2 py-1.5 text-zinc-400">{s.league}</td>
                          <td className="px-2 py-1.5 text-right text-zinc-600 dark:text-zinc-400">{s.comps.reduce((a, c) => a + c.apps, 0)}</td>
                          <td className="px-2 py-1.5 text-right text-zinc-600 dark:text-zinc-400">{s.comps.reduce((a, c) => a + c.goals, 0)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-zinc-200 bg-emerald-50 dark:border-zinc-700 dark:bg-emerald-950/30">
                        <td colSpan={3} className="px-2 py-1.5 text-right font-semibold text-emerald-700 dark:text-emerald-400">Total</td>
                        <td className="px-2 py-1.5 text-right font-semibold text-emerald-700 dark:text-emerald-400">{data.games}</td>
                        <td className="px-2 py-1.5 text-right font-semibold text-emerald-700 dark:text-emerald-400">{data.goals}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-2 px-6 pb-6 text-sm">
              <a href={`https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(data.name)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-800/60">Transfermarkt</a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(data.name)}+football+sofascore`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-800/60">Sofascore</a>
              <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(data.name.replace(/\s+/g, "_"))}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">Wikipedia</a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
