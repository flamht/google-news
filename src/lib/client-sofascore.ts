import type { PlayerDetail, SeasonStats } from "./types"

function normalizeName(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

interface SofascorePlayer {
  id: number
  name: string
  slug?: string
  firstName?: string
  lastName?: string
  team?: { name: string }
  position?: string
  positionsDetailed?: string[]
  height?: number
  dateOfBirth?: string
  country?: { name: string }
  shirtNumber?: number
  preferredFoot?: string
  proposedMarketValueRaw?: { value?: number; currency?: string }
}

interface SeasonEntry {
  season?: { name: string }
  uniqueTournament?: { name: string }
  statistics?: {
    appearances?: number
    goals?: number
    assists?: number
    minutesPlayed?: number
    averageRating?: number
    rating?: number
  }
}

function calculateAge(dob: string): number {
  if (!dob) return 0
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

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

function buildDetail(
  playerId: number,
  player: SofascorePlayer,
  seasons: SeasonEntry[],
): PlayerDetail {
  const seasonStats: SeasonStats[] = seasons
    .filter((s) => s.statistics?.appearances && s.statistics.appearances > 0)
    .map((s) => ({
      seasonName: s.season?.name ?? "",
      tournamentName: s.uniqueTournament?.name ?? s.season?.name ?? "",
      games: s.statistics!.appearances ?? 0,
      goals: s.statistics!.goals ?? 0,
      assists: s.statistics!.assists ?? 0,
      minutesPlayed: s.statistics!.minutesPlayed ?? 0,
      rating: s.statistics!.averageRating ?? s.statistics!.rating ?? 0,
    }))

  const marketValueRaw = player.proposedMarketValueRaw
  const marketValue = marketValueRaw?.value
    ? `€${(marketValueRaw.value / 1_000_000).toFixed(marketValueRaw.value >= 1_000_000 ? 0 : 1)}M`
    : ""

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
    name: player.name ?? "",
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

export async function fetchPlayerFromBrowser(name: string): Promise<PlayerDetail | null> {
  try {
    const searchRes = await fetch(
      `https://api.sofascore.com/api/v1/search/players/${encodeURIComponent(name)}`,
    )
    if (!searchRes.ok) return null
    const searchData = (await searchRes.json()) as {
      players?: SofascorePlayer[]
    }
    const players = searchData?.players ?? []
    if (players.length === 0) return null

    const normName = normalizeName(name)
    const match = players.find((p) => normalizeName(p.name) === normName && !!p.team?.name && p.team.name !== "No team")
      ?? players.find((p) => normalizeName(p.name) === normName)
    if (!match) return null

    const [profileRes, statsRes] = await Promise.all([
      fetch(`https://api.sofascore.com/api/v1/player/${match.id}`),
      fetch(`https://api.sofascore.com/api/v1/player/${match.id}/statistics`),
    ])

    const [profile, stats] = await Promise.all([
      profileRes.ok ? profileRes.json() : null,
      statsRes.ok ? statsRes.json() : null,
    ])

    const player = (profile as any)?.player ?? profile ?? {}
    const seasons: SeasonEntry[] = (stats as any)?.seasons ?? []

    return buildDetail(match.id, { ...match, ...player }, seasons)
  } catch {
    return null
  }
}
