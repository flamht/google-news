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

async function getSectionHtml(title: string, section?: string): Promise<string | null> {
  const params = new URLSearchParams({ action: "parse", page: title, prop: "text", format: "json" })
  if (section) params.set("section", section)
  const data = await api(`https://en.wikipedia.org/w/api.php?${params}`) as { parse?: { text?: { "*"?: string } } } | null
  return data?.parse?.text?.["*"] ?? null
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

function extractCareerTotals(title: string): Promise<{ apps?: number; goals?: number }> {
  return getSectionHtml(title).then((html) => {
    if (!html) return {}
    // Find "Career statistics" section and then a "Total" row
    const careerSection = html.match(/<h2[^>]*>[^<]*Career statistics[^<]*<\/h2>[\s\S]*?<h2/i)
    const section = careerSection ? careerSection[0] : html

    const rows = section.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || []
    for (const row of rows.reverse()) {
      const cleaned = row.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      if (/career|total/i.test(cleaned)) {
        const nums = cleaned.match(/\b(\d+)\b/g)
        if (nums && nums.length >= 2) {
          // Last two numbers are usually apps and goals
          const apps = parseInt(nums[nums.length - 2], 10)
          const goals = parseInt(nums[nums.length - 1], 10)
          return { apps, goals }
        }
      }
    }

    // Fallback: find any "Total" row
    const totalMatch = section.match(/Total[\s\S]{0,100}?(\d+)[\s\S]{0,20}?(\d+)/i)
    if (totalMatch) {
      const apps = parseInt(totalMatch[1], 10)
      const goals = parseInt(totalMatch[2], 10)
      return { apps, goals }
    }

    return {}
  })
}

export async function fetchPlayerFromWiki(name: string): Promise<WikiPlayer | null> {
  const title = await searchWikipedia(name)
  if (!title) return null

  const [section0Html, careerTotals, summaryData] = await Promise.all([
    getSectionHtml(title, "0"),
    extractCareerTotals(title),
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

  // Extract nationality from place of birth
  const placeOfBirth = infoboxData["place_of_birth"] || ""
  const nationality = infoboxData["nationality"] || placeOfBirth.split(",").pop()?.trim() || ""

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
    games: careerTotals.apps,
    goals: careerTotals.goals,
  }
}
