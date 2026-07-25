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

function parseCareerTable(html: string): CompetitionRow[] {
  // Find the first big stats table in the career section
  const section = html.match(/<h2[^>]*>[^<]*Career statistics[^<]*<\/h2>[\s\S]*?(?=<h2|$)/i)
  if (!section) return []

  const tables = section[0].match(/<table[^>]*>[\s\S]*?<\/table>/gi)
  if (!tables) return []

  // Find the first table that looks like a stats table (has "Club" header)
  const statsTable = tables.find((t) => /<th[^>]*>[\s\S]*?Club[\s\S]*?<\/th>/i.test(t))
  if (!statsTable) return []

  const rows = statsTable.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi)
  if (!rows || rows.length < 3) return []

  // Parse data rows (skip header rows)
  const totals: Record<string, { apps: number; goals: number }> = {}
  let currentClub = ""

  for (let i = 2; i < rows.length; i++) {
    const cells = expandCells(rows[i])
    if (cells.length < 4) continue
    if (/^Total/i.test(cells[0]) || /^Career/i.test(cells[0])) continue

    // First cell is either Club name or Season (continuation)
    const first = cells[0]
    const isSeasonRow = /^\d{4}/.test(first)

    if (!isSeasonRow) {
      currentClub = first.replace(/\(loan\)/g, "").trim()
    }

    // Column mapping (15 virtual columns):
    // 0:Club 1:Season 2:League 3:League_A 4:League_G 5:NatCup_A 6:NatCup_G
    // 7:LCup_A 8:LCup_G 9:Euro_A 10:Euro_G 11:Other_A 12:Other_G 13:Total_A 14:Total_G

    const getVal = (idx: number): number | null => parseIntSafe(cells[idx] ?? "")

    const comps: Array<{ key: string; apps: number | null; goals: number | null }> = [
      { key: "League", apps: getVal(3), goals: getVal(4) },
      { key: "National Cup", apps: getVal(5), goals: getVal(6) },
      { key: "League Cup", apps: getVal(7), goals: getVal(8) },
      { key: "Europe", apps: getVal(9), goals: getVal(10) },
      { key: "Other", apps: getVal(11), goals: getVal(12) },
    ]

    for (const c of comps) {
      if (c.apps !== null) {
        if (!totals[c.key]) totals[c.key] = { apps: 0, goals: 0 }
        totals[c.key].apps += c.apps
        totals[c.key].goals += c.goals ?? 0
      }
    }
  }

  const order = ["League", "National Cup", "League Cup", "Europe", "Other"]
  return order
    .filter((k) => totals[k] && totals[k].apps > 0)
    .map((k) => ({ label: k, apps: totals[k].apps, goals: totals[k].goals }))
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

  const comps = fullHtml ? parseCareerTable(fullHtml) : []
  const totalGames = comps.reduce((s, c) => s + c.apps, 0)
  const totalGoals = comps.reduce((s, c) => s + c.goals, 0)

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
    comps: comps.length > 0 ? comps : undefined,
  }
}
