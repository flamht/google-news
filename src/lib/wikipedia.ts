import * as cheerio from "cheerio"

const UA = "FootyNews/1.0 (footynews.vercel.app)"

async function api(url: string): Promise<unknown | null> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  }).catch(() => null)
  if (!res || !res.ok) return null
  try { return await res.json() } catch { return null }
}

async function searchWikipedia(name: string): Promise<string | null> {
  const data = await api(
    `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: "query", list: "search", srsearch: `${name} footballer`, srlimit: "5", format: "json" })}`,
  ) as { query?: { search?: Array<{ title: string }> } } | null
  if (!data) return null
  const results = data?.query?.search ?? []
  if (results.length === 0) return null
  const norm = name.toLowerCase()
  const exact = results.find((r) => r.title.toLowerCase() === norm)
  return exact?.title ?? results[0].title
}

async function getPageHtml(title: string): Promise<string | null> {
  const data = await api(
    `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: "parse", page: title, prop: "text", format: "json" })}`,
  ) as { parse?: { text?: { "*"?: string } } } | null
  return data?.parse?.text?.["*"] ?? null
}

async function getSection0Html(title: string): Promise<string | null> {
  const data = await api(
    `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: "parse", page: title, prop: "text", section: "0", format: "json" })}`,
  ) as { parse?: { text?: { "*"?: string } } } | null
  return data?.parse?.text?.["*"] ?? null
}

export interface CompetitionRow {
  label: string
  apps: number
  goals: number
}

export interface SeasonRow {
  season: string
  club: string
  league: string
  comps: CompetitionRow[]
}

export interface ClubEntry {
  club: string
  league: string
  comps: CompetitionRow[]
  totals: CompetitionRow
}

export interface WikiPlayer {
  name: string
  fullName?: string
  imageUrl?: string
  dateOfBirth?: string
  age?: number
  height?: string
  position?: string
  currentTeam?: string
  nationality?: string
  description?: string
  games?: number
  goals?: number
  comps?: CompetitionRow[]
  clubs?: ClubEntry[]
  seasons?: SeasonRow[]
}

function calcAge(dob: string): number {
  if (!dob) return 0
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function parseIntSafe(s: string): number | null {
  const m = s.match(/\d+/)
  return m ? parseInt(m[0], 10) : null
}

function expandCells(html: string): string[] {
  const cellRegex = /<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi
  const cells: string[] = []
  let match
  while ((match = cellRegex.exec(html)) !== null) {
    const cell = match[0]
    const colspan = parseInt(cell.match(/colspan="(\d+)"/)?.[1] || "1", 10)
    const text = cell.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    for (let i = 0; i < colspan; i++) cells.push(text)
  }
  return cells
}

function parseCareerTable(html: string): { comps: CompetitionRow[]; clubs: ClubEntry[]; seasons: SeasonRow[] } {
  const section = html.match(/<h2[^>]*>[^<]*Career statistics[^<]*<\/h2>[\s\S]*?(?=<h2|$)/i)
  if (!section) return { comps: [], clubs: [], seasons: [] }

  const tables = section[0].match(/<table[^>]*>[\s\S]*?<\/table>/gi)
  if (!tables) return { comps: [], clubs: [], seasons: [] }

  const statsTable = tables.find((t) => /<th[^>]*>[\s\S]*?Club[\s\S]*?<\/th>/i.test(t))
  if (!statsTable) return { comps: [], clubs: [], seasons: [] }

  const rows = statsTable.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi)
  if (!rows || rows.length < 3) return { comps: [], clubs: [], seasons: [] }

  const compOrder = ["League", "National Cup", "League Cup", "Europe", "Other"]
  const grandTotals: Record<string, { apps: number; goals: number }> = {}

  const clubData: Array<{
    club: string
    league: string
    comps: Record<string, { apps: number; goals: number }>
  }> = []
  const seasonList: SeasonRow[] = []
  let currentClub = ""
  let currentLeague = ""

  for (let i = 2; i < rows.length; i++) {
    const cells = expandCells(rows[i])
    if (cells.length < 4) continue
    if (/^Total/i.test(cells[0]) || /^Career/i.test(cells[0])) continue

    const first = cells[0]
    const isSeasonRow = /^\d{4}/.test(first)

    if (!isSeasonRow) {
      currentClub = first.replace(/\s*\(loan\)\s*/g, "").trim()
      currentLeague = cells[2] ?? ""
    }

    const getVal = (idx: number): number | null => parseIntSafe(cells[idx] ?? "")
    const leagueLabel = cells[2] && isSeasonRow ? cells[2] : (isSeasonRow ? currentLeague : cells[2] || currentLeague)

    const seasonComps = [
      { key: "League", apps: getVal(3), goals: getVal(4) },
      { key: "National Cup", apps: getVal(5), goals: getVal(6) },
      { key: "League Cup", apps: getVal(7), goals: getVal(8) },
      { key: "Europe", apps: getVal(9), goals: getVal(10) },
      { key: "Other", apps: getVal(11), goals: getVal(12) },
    ]

    for (const c of seasonComps) {
      if (c.apps !== null) {
        if (!grandTotals[c.key]) grandTotals[c.key] = { apps: 0, goals: 0 }
        grandTotals[c.key].apps += c.apps
        grandTotals[c.key].goals += c.goals ?? 0
      }
    }

    if (currentClub) {
      let clubEntry = clubData.find((e) => e.club === currentClub)
      if (!clubEntry) {
        clubEntry = { club: currentClub, league: leagueLabel, comps: {} }
        clubData.push(clubEntry)
      }
      if (leagueLabel) clubEntry.league = leagueLabel
      for (const c of seasonComps) {
        if (c.apps !== null) {
          if (!clubEntry.comps[c.key]) clubEntry.comps[c.key] = { apps: 0, goals: 0 }
          clubEntry.comps[c.key].apps += c.apps
          clubEntry.comps[c.key].goals += c.goals ?? 0
        }
      }
    }

    if (isSeasonRow) {
      const season = cells[1] || first
      const clubLabel = currentClub
      const rowComps = compOrder
        .filter((k) => seasonComps.find((c) => c.key === k)?.apps !== null)
        .map((k) => {
          const c = seasonComps.find((s) => s.key === k)!
          return { label: k, apps: c.apps ?? 0, goals: c.goals ?? 0 }
        })
      seasonList.push({ season, club: clubLabel, league: leagueLabel, comps: rowComps })
    }
  }

  const comps = compOrder
    .filter((k) => grandTotals[k] && grandTotals[k].apps > 0)
    .map((k) => ({ label: k, apps: grandTotals[k].apps, goals: grandTotals[k].goals }))

  const clubs = clubData
    .filter((e) => {
      const total = Object.values(e.comps).reduce((s, c) => s + c.apps, 0)
      return total > 0
    })
    .map((e) => {
      const clubComps = compOrder
        .filter((k) => e.comps[k] && e.comps[k].apps > 0)
        .map((k) => ({ label: k, apps: e.comps[k].apps, goals: e.comps[k].goals }))
      const totalApps = clubComps.reduce((s, c) => s + c.apps, 0)
      const totalGoals = clubComps.reduce((s, c) => s + c.goals, 0)
      return {
        club: e.club,
        league: e.league,
        comps: clubComps,
        totals: { label: "Total", apps: totalApps, goals: totalGoals },
      }
    })

  return { comps, clubs, seasons: seasonList }
}

function extractInfoboxData($: cheerio.CheerioAPI): Record<string, string> {
  const data: Record<string, string> = {}
  $("table.infobox tr").each((_, row) => {
    const $row = $(row)
    const label = $row.find("th").first().text().trim()
    const value = $row.find("td").first().text().trim()
    if (label && value) data[label.toLowerCase()] = value
  })
  return data
}

export async function fetchPlayerFromWiki(name: string): Promise<WikiPlayer | null> {
  const title = await searchWikipedia(name)
  if (!title) return null

  const [section0Html, fullHtml, summaryData] = await Promise.all([
    getSection0Html(title),
    getPageHtml(title),
    api(
      `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: "query", prop: "extracts|pageimages", exintro: "1", explaintext: "1", piprop: "thumbnail", pithumbsize: "300", titles: title, format: "json" })}`,
    ) as Promise<{ query?: { pages?: Record<string, { extract?: string; thumbnail?: { source: string }; title?: string }> } } | null>,
  ])

  let description = ""
  let imageUrl = ""
  if (summaryData) {
    const page = Object.values(summaryData?.query?.pages ?? {}).find(Boolean) as any
    if (page) {
      description = page.extract?.split("\n")[0]?.trim() ?? ""
      if (description.length > 200) description = description.slice(0, 200) + "..."
      imageUrl = page.thumbnail?.source ?? ""
    }
  }

  let infoboxData: Record<string, string> = {}
  if (section0Html) {
    const $ = cheerio.load(section0Html)
    infoboxData = extractInfoboxData($)
    if (!imageUrl) {
      const src = $("table.infobox img").first().attr("src")
      if (src && !src.startsWith("data:")) {
        imageUrl = src.startsWith("//") ? `https:${src}` : src
      }
    }
  }

  const dob = infoboxData["date_of_birth"] || infoboxData["birth_date"] || ""
  const dobClean = dob.replace(/\([^)]*\)/g, "").replace(/\[.*?\]/g, "").trim()
  const age = calcAge(dob.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || "")
  const placeOfBirth = infoboxData["place_of_birth"] || ""
  const nationality = infoboxData["nationality"] || placeOfBirth.split(",").pop()?.trim() || ""

  const parsed = fullHtml ? parseCareerTable(fullHtml) : { comps: [], clubs: [], seasons: [] }
  const totalGames = parsed.comps.reduce((s, c) => s + c.apps, 0)
  const totalGoals = parsed.comps.reduce((s, c) => s + c.goals, 0)

  return {
    name: title,
    fullName: infoboxData["full_name"] || infoboxData["fullname"],
    imageUrl: imageUrl || undefined,
    dateOfBirth: dobClean || undefined,
    age: age || undefined,
    height: infoboxData["height"] || infoboxData["height_(m)"],
    position: infoboxData["position(s)"] || infoboxData["position"],
    currentTeam: infoboxData["current_team"] || infoboxData["team"],
    nationality: nationality || undefined,
    description: description || undefined,
    games: totalGames || undefined,
    goals: totalGoals || undefined,
    comps: parsed.comps.length > 0 ? parsed.comps : undefined,
    clubs: parsed.clubs.length > 0 ? parsed.clubs : undefined,
    seasons: parsed.seasons.length > 0 ? parsed.seasons : undefined,
  }
}
