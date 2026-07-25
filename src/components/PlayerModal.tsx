"use client"

import { useEffect, useState } from "react"

interface PlayerModalProps {
  playerName: string
  onClose: () => void
}

export default function PlayerModal({ playerName, onClose }: PlayerModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

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
        className={`relative w-full max-w-sm rounded-2xl bg-white shadow-2xl transition-all duration-200 dark:bg-zinc-900 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          ✕
        </button>

        <div className="flex flex-col items-center px-6 pb-6 pt-10">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-zinc-100 shadow-md dark:bg-zinc-800">
            <img
              src={`https://www.google.com/s2/favicons?domain=sofascore.com&sz=128`}
              alt=""
              className="h-full w-full object-cover opacity-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none"
              }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.opacity = "1"
              }}
            />
          </div>

          <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">
            {playerName}
          </h2>

          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(playerName)}+football+sofascore`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-amber-100 px-4 py-2 font-medium text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-800/60"
            >
              Sofascore
            </a>
            <a
              href={`https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(playerName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-100 px-4 py-2 font-medium text-blue-800 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-800/60"
            >
              Transfermarkt
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
