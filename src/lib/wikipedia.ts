import * as cheerio from "cheerio"

const UA = "FootyNews/1.0 (footynews.vercel.app)"

async function api(url: string): Promise<unknown | null> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  }).catch(() => null)
  if (!res || !res.ok) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function searchWikipedia(name: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: `${name} footballer`,
    srlimit: "5",
    format: "json",
  })
  const data = await api(`https://en.wikipedia.org/w/api.php?${params}`) as {
    query?: { search?: Array<{ title: string }> }
  } | null
  if (!data) return null
  const results = data?.query?.search ?? []
  if (results.length === 0) return null

  const normInput = name.toLowerCase()
  const exact = results.find((r) => r.title.toLowerCase() === normInput)
  if (exact) return exact.title

  return results[0].title
}

async function getPageHtml(title: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "text",
    section: "0",
    format: "json",
  })
  const data = await api(`https://en.wikipedia.org/w/api.php?${params}`) as {
    parse?: { text?: { "*"?: string } }
  } | null
  if (!data) return null
  return data?.parse?.text?.["*"] ?? null
}

export interface WikiPlayer {
  name: string
  fullName?: string
  imageUrl?: string
  dateOfBirth?: string
  height?: string
  position?: string
  currentTeam?: string
  nationality?: string
  description?: string
}

function extractInfoboxData($: cheerio.CheerioAPI): Record<string, string> {
  const data: Record<string, string> = {}
  const infobox = $("table.infobox")
  if (!infobox.length) return data

  infobox.find("tr").each((_, row) => {
    const $row = $(row)
    const label = $row.find("th").first()
    const value = $row.find("td").first()

    const labelText = label.text().trim()
    const valueText = value.text().trim()
    if (labelText && valueText) {
      data[labelText.toLowerCase()] = valueText
    }

    const labelHtml = label.html() || ""
    const labelClean = labelHtml.replace(/<[^>]*>/g, "").trim()
    if (labelClean && labelClean !== labelText) {
      data[labelClean.toLowerCase()] = valueText
    }
  })

  return data
}

export async function fetchPlayerFromWiki(name: string): Promise<WikiPlayer | null> {
  const title = await searchWikipedia(name)
  if (!title) return null

  const summaryParams = new URLSearchParams({
    action: "query",
    prop: "extracts|pageimages",
    exintro: "1",
    explaintext: "1",
    piprop: "thumbnail",
    pithumbsize: "300",
    titles: title,
    format: "json",
  })
  const summaryData = await api(
    `https://en.wikipedia.org/w/api.php?${summaryParams}`,
  ) as {
    query?: { pages?: Record<string, { extract?: string; thumbnail?: { source: string }; title?: string }> }
  } | null

  let description = ""
  let imageUrl = ""
  if (summaryData) {
    const page = Object.values(summaryData?.query?.pages ?? {}).find(Boolean) as
      { extract?: string; thumbnail?: { source: string }; title?: string } | undefined
    if (page) {
      description = page.extract?.split("\n")[0]?.trim() ?? ""
      if (description.length > 200) description = description.slice(0, 200) + "..."
      imageUrl = page.thumbnail?.source ?? ""
    }
  }

  const html = await getPageHtml(title)
  if (!html) {
    return {
      name: title,
      imageUrl: imageUrl || undefined,
      description: description || undefined,
    }
  }

  const $ = cheerio.load(html)
  const infoboxData = extractInfoboxData($)

  if (!imageUrl) {
    const img = $("table.infobox img").first()
    const src = img.attr("src")
    if (src && !src.startsWith("data:")) {
      imageUrl = src.startsWith("//") ? `https:${src}` : src
    }
  }

  return {
    name: title,
    fullName: infoboxData["full_name"] || infoboxData["fullname"],
    imageUrl: imageUrl || undefined,
    dateOfBirth: infoboxData["date_of_birth"] || infoboxData["birth_date"],
    height: infoboxData["height"] || infoboxData["height_(m)"],
    position: infoboxData["position(s)"] || infoboxData["position"],
    currentTeam: infoboxData["current_team"] || infoboxData["team"],
    nationality: infoboxData["nationality"],
    description: description || undefined,
  }
}
