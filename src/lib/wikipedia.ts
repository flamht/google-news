import * as cheerio from "cheerio"

const WIKI = "https://en.wikipedia.org/api/rest_v1"

function makeTitle(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
}

function fetchWithTimeout(url: string): Promise<Response | null> {
  return fetch(url, { signal: AbortSignal.timeout(8000) }).catch(() => null)
}

async function searchWikipedia(name: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: `${name} footballer`,
    srlimit: "5",
    format: "json",
  })
  const res = await fetchWithTimeout(
    `https://en.wikipedia.org/w/api.php?${params}`,
  )
  if (!res || !res.ok) return null
  const data = (await res.json()) as {
    query?: { search?: Array<{ title: string }> }
  }
  const results = data?.query?.search ?? []
  if (results.length === 0) return null

  const normInput = name.toLowerCase()
  const exact = results.find((r) => r.title.toLowerCase() === normInput)
  if (exact) return exact.title

  const first = results[0]
  if (first) return first.title

  return null
}

async function getPageHtml(title: string): Promise<string | null> {
  const res = await fetchWithTimeout(`${WIKI}/page/html/${encodeURIComponent(title)}`)
  if (!res || !res.ok) return null
  return res.text()
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

function parseInfobox($: cheerio.CheerioAPI): Record<string, string> {
  const data: Record<string, string> = {}

  const infobox = $("table.infobox")
  if (!infobox.length) return data

  infobox.find("tr").each((_, row) => {
    const $row = $(row)
    const label = $row.find("th.infobox-label").text().trim()
    const value = $row.find("td").first().text().trim()

    if (label && value) {
      const key = label.toLowerCase().replace(/\s+/g, "_")
      data[key] = value
    }
  })

  const caption = infobox.find("caption.fn").text().trim()
  if (caption) data["_caption"] = caption

  return data
}

function parseInfoboxModern($: cheerio.CheerioAPI): Record<string, string> {
  const data: Record<string, string> = {}

  $('table.infobox tr:has(th)').each((_, row) => {
    const $row = $(row)
    const labelEl = $row.find('th')
    const valueEl = $row.find('td')

    const label = labelEl.clone().children().remove().end().text().trim()
    const value = valueEl.clone().children().remove().end().text().trim()

    if (label && value) {
      data[label.toLowerCase()] = value
    }
  })

  return data
}

export async function fetchPlayerFromWiki(name: string): Promise<WikiPlayer | null> {
  let title = await searchWikipedia(name)

  if (!title) {
    const cleanName = makeTitle(name)
    const summary = await fetchWithTimeout(`${WIKI}/page/summary/${encodeURIComponent(cleanName)}`)
    if (summary?.ok) {
      const s = (await summary.json()) as { title?: string }
      title = s.title || null
    }
  }

  if (!title) return null

  const [html, summaryRes] = await Promise.all([
    getPageHtml(title),
    fetchWithTimeout(`${WIKI}/page/summary/${encodeURIComponent(title)}`),
  ])

  const summary = summaryRes?.ok ? ((await summaryRes.json()) as {
    title?: string
    description?: string
    extract?: string
    thumbnail?: { source: string }
  }) : null

  if (!html) {
    if (summary) {
      return {
        name: summary.title ?? name,
        imageUrl: summary.thumbnail?.source,
        description: summary.description,
      }
    }
    return null
  }

  const $ = cheerio.load(html)

  const infoboxData = { ...parseInfobox($), ...parseInfoboxModern($) }

  const imageEl = $('table.infobox img').first()
  let imageUrl = summary?.thumbnail?.source
  if (!imageUrl && imageEl.length) {
    const src = imageEl.attr('src')
    if (src && !src.startsWith('data:')) {
      imageUrl = src.startsWith('//') ? `https:${src}` : src
    }
  }

  const fullName = infoboxData["full_name"] || infoboxData["fullname"]
  const dob = infoboxData["date_of_birth"] || infoboxData["birth_date"]
  const height = infoboxData["height"]
  const position = infoboxData["position(s)"] || infoboxData["position"]
  const team = infoboxData["current_team"] || infoboxData["team"]
  const nationality = infoboxData["nationality"]

  return {
    name: summary?.title ?? title,
    fullName,
    imageUrl,
    dateOfBirth: dob,
    height,
    position,
    currentTeam: team,
    nationality,
    description: summary?.description,
  }
}
