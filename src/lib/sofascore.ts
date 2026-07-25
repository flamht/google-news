import https from "node:https"
import type { PlayerDetail, SeasonStats } from "./types"

function fetchJson(url: string, hostname?: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const options = {
      hostname: hostname || parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.sofascore.com/",
        "Origin": "https://www.sofascore.com",
      },
      rejectUnauthorized: false,
      timeout: 8000,
    }
    const req = https.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on("data", (c: Buffer) => chunks.push(c))
      res.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")))
        } catch {
          reject(new Error("Invalid JSON"))
        }
      })
      res.on("error", reject)
    })
    req.on("error", reject)
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")) })
    req.end()
  })
}

const hosts = ["api.sofascore.com", "www.sofascore.com", "sofascore.com"]

function rewriteUrl(url: string, host: string): string {
  return url.replace(/\/\/[^/]+/, `//${host}`)
}

async function fetchJsonNative(url: string, host?: string): Promise<unknown | null> {
  try {
    const targetUrl = host ? rewriteUrl(url, host) : url
    const parsed = new URL(targetUrl)
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.sofascore.com/",
        "Origin": "https://www.sofascore.com",
        "Host": parsed.hostname,
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function fetchJsonRetry(url: string): Promise<unknown | null> {
  for (const host of hosts) {
    const result = await fetchJsonNative(url, host)
    if (result) return result
  }
  for (const host of hosts) {
    try {
      return await fetchJson(url, host)
    } catch {}
    try {
      return await fetchJson(rewriteUrl(url, host))
    } catch {}
  }
  return null
}

function normalizeName(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

export async function searchPlayer(name: string): Promise<number | null> {
  try {
    const data = await fetchJsonRetry(
      `https://api.sofascore.com/api/v1/search/players/${encodeURIComponent(name)}`,
    ) as { players?: Array<{ id: number; name: string; team?: { name: string } }> } | null
    if (!data) return null
    const players = data?.players ?? []

    const normName = normalizeName(name)
    const candidates = players.map((p) => ({
      id: p.id,
      name: p.name,
      exact: p.name === name,
      normMatch: normalizeName(p.name) === normName,
      hasTeam: !!p.team?.name && p.team.name !== "No team",
      teamName: p.team?.name ?? "",
    }))

    const withTeam = candidates.find((c) => c.normMatch && c.hasTeam)
    if (withTeam) return withTeam.id

    const anyNorm = candidates.find((c) => c.normMatch)
    if (anyNorm) return anyNorm.id

    return null
  } catch {
    return null
  }
}

export async function fetchPlayerDetail(name: string): Promise<PlayerDetail | null> {
  const playerId = await searchPlayer(name)
  if (!playerId) return null

  const [profileData, statsData] = await Promise.all([
    fetchJsonRetry(`https://api.sofascore.com/api/v1/player/${playerId}`),
    fetchJsonRetry(`https://api.sofascore.com/api/v1/player/${playerId}/statistics`),
  ])

  const player = (profileData as any)?.player ?? profileData ?? {}
  const statsArray: any[] = (statsData as any)?.seasons ?? []

  const seasonStats: SeasonStats[] = statsArray
    .filter((s) => s.statistics?.appearances > 0)
    .map((s) => ({
      seasonName: s.season?.name ?? "",
      tournamentName: s.uniqueTournament?.name ?? s.season?.name ?? "",
      games: s.statistics.appearances ?? 0,
      goals: s.statistics.goals ?? 0,
      assists: s.statistics.assists ?? 0,
      minutesPlayed: s.statistics.minutesPlayed ?? 0,
      rating: s.statistics.averageRating ?? s.statistics.rating ?? 0,
    }))

  function parseSeasonEndYear(name: string): number {
    const fullYear = name.match(/(\d{4})/)
    if (fullYear) return parseInt(fullYear[1], 10)

    const yearPair = name.match(/(\d{2})\/(\d{2})/)
    if (yearPair) {
      const end = parseInt(yearPair[2], 10)
      return end >= 50 ? 1900 + end : 2000 + end
    }

    return 0
  }

  const marketValueRaw = player.proposedMarketValueRaw as { value?: number; currency?: string } | null
  const marketValue = marketValueRaw?.value
    ? `€${(marketValueRaw.value / 1_000_000).toFixed(marketValueRaw.value >= 1_000_000 ? 0 : 1)}M`
    : ""

  function calculateAge(dob: string): number {
    if (!dob) return 0
    const birth = new Date(dob)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
    return age
  }

  const seasonYears = new Map<number, SeasonStats[]>()
  for (const s of seasonStats) {
    const year = parseSeasonEndYear(s.seasonName)
    if (!seasonYears.has(year)) seasonYears.set(year, [])
    seasonYears.get(year)!.push(s)
  }
  const maxYear = Math.max(0, ...seasonYears.keys())
  const lastSeasonStats = seasonYears.get(maxYear) ?? []

  return {
    id: playerId,
    name: player.name ?? name,
    slug: player.slug ?? "",
    firstName: player.firstName ?? "",
    lastName: player.lastName ?? "",
    teamName: player.team?.name ?? "",
    position: player.position ?? "",
    positionsDetailed: Array.isArray(player.positionsDetailed) ? player.positionsDetailed : [],
    height: player.height ?? 0,
    dateOfBirth: player.dateOfBirth ?? "",
    age: calculateAge(player.dateOfBirth ?? ""),
    nationality: player.country?.name ?? "",
    jerseyNumber: player.shirtNumber ?? 0,
    preferredFoot: player.preferredFoot ?? "",
    marketValue,
    imageUrl: `https://api.sofascore.com/api/v1/player/${playerId}/image`,
    seasonStats,
    lastSeasonStats,
  }
}