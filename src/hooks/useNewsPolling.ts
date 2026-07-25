"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { SearchResult, FetchStatus } from "@/lib/types"

interface UseNewsPollingOptions {
  type: string | null
  club: string | null
  interval?: number
}

export function useNewsPolling({ type, club, interval = 60000 }: UseNewsPollingOptions) {
  const [data, setData] = useState<SearchResult | null>(null)
  const [status, setStatus] = useState<FetchStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevKeyRef = useRef<string>("")

  const fetchNews = useCallback(async () => {
    if (!type && !club) {
      setStatus("idle")
      setData(null)
      return
    }

    setStatus("loading")
    try {
      const params = new URLSearchParams()
      if (type) params.set("type", type)
      if (club) params.set("club", club)

      const res = await fetch(`/api/search?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const result: SearchResult = await res.json()

      setData((prev) => {
        if (!prev) return result
        const existingUrls = new Set(result.news.map((n) => n.url))
        const newItems = prev.news.filter((n) => !existingUrls.has(n.url))
        return {
          ...result,
          news: [...result.news, ...newItems].slice(0, 50),
        }
      })

      setStatus("ready")
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch")
      setStatus("error")
    }
  }, [type, club])

  useEffect(() => {
    const key = `${type || ""}-${club || ""}`
    if (key !== prevKeyRef.current) {
      prevKeyRef.current = key
      setData(null)
      setStatus("idle")
      setError(null)
      setLastUpdated(null)
      fetchNews()
    }

    if (type || club) {
      intervalRef.current = setInterval(fetchNews, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [type, club, interval, fetchNews])

  return { data, status, error, lastUpdated, refresh: fetchNews }
}
