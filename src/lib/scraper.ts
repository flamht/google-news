import * as cheerio from "cheerio"
import type { NewsItem, SearchResult } from "./types"

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
]

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": randomUA(),
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Referer: "https://www.google.com/",
        "Cache-Control": "no-cache",
      },
      next: { revalidate: 30 },
    })
    return res
  } finally {
    clearTimeout(id)
  }
}

function parseGoogleSearchHTML(html: string): { aiOverview: string | null; news: NewsItem[] } {
  const $ = cheerio.load(html)
  let aiOverview: string | null = null

  const aiSelectors = [
    'div[data-attrid="sun"]',
    'div[data-md="198"]',
    ".gHvOcd",
    ".iKJnec",
    ".c2xzTb",
    ".hgKElc",
    ".kno-rdesc",
    'div[role="heading"]:contains("AI Overview")',
  ]

  for (const sel of aiSelectors) {
    const el = $(sel).first()
    if (el.length) {
      const text = el.text().trim()
      if (text && text.length > 20 && !text.includes("AI Overview")) {
        aiOverview = text
        break
      }
    }
  }

  if (!aiOverview) {
    $('h2, h3, div[role="heading"]').each((_, el) => {
      const text = $(el).text().trim().toLowerCase()
      if (text.includes("ai overview") || text.includes("ai generated") || text.includes("google ai")) {
        const parent = $(el).closest("div").parent()
        const contentText = parent.text().trim()
        if (contentText.length > 50) {
          aiOverview = contentText
          return false
        }
      }
    })
  }

  const newsMap = new Map<string, NewsItem>()

  $("a").each((_, el) => {
    const href = $(el).attr("href")
    if (!href) return
    const match = href.match(/\/url\?q=(https?:\/\/[^&]+)/)
    if (!match) return
    const url = decodeURIComponent(match[1])
    if (newsMap.has(url)) return

    const parent = $(el).closest("div").parent()
    const title = $(el).text().trim()
    if (!title || title.length < 10) return

    const snippet = parent.find("span, div").text().trim().slice(0, 300)
    const date =
      parent.find("span").text().match(/\d+\s+(year|month|week|day|hour|minute|second)s?\s+ago/i)?.[0] || ""

    newsMap.set(url, { title, url, source: "", date, snippet })
  })

  $("div.g, div[data-hveid]").each((_, el) => {
    const titleEl = $(el).find("h3").first()
    const linkEl = $(el).find("a").first()
    if (!titleEl.length || !linkEl.length) return

    const title = titleEl.text().trim()
    if (!title) return

    let url = linkEl.attr("href") || ""
    const urlMatch = url.match(/\/url\?q=(https?:\/\/[^&]+)/)
    if (urlMatch) url = decodeURIComponent(urlMatch[1])

    if (newsMap.has(url)) return

    const snippet = $(el).find(".VwiC3b, [data-sncf], .lEBKkf, span.aCOpRe").first().text().trim().slice(0, 300) || ""

    const citeEl = $(el).find("cite, .UPmit").first().text().trim()
    const source = citeEl.replace(/^https?:\/\//, "").replace(/\/.*$/, "")

    let date = ""
    $(el)
      .find("span, .LEJwVe")
      .each((_, span) => {
        const t = $(span).text().trim()
        if (/\d+\s+(year|month|week|day|hour|minute|second)s?\s+ago/i.test(t)) {
          date = t
          return false
        }
      })

    const img = $(el).find("img[src^=http]").first().attr("src")
    const thumbnail = img && !img.includes("gstatic.com") ? img : undefined

    newsMap.set(url, { title, url, source, date, snippet, thumbnail })
  })

  $("g-section-with-header, div[data-hveid]").each((_, el) => {
    $(el)
      .find("a")
      .each((_, a) => {
        const href = $(a).attr("href")
        if (!href) return
        const url = href.startsWith("http") ? href : ""
        if (!url || newsMap.has(url)) return
        const title = $(a).text().trim()
        if (!title || title.length < 10 || title.length > 200) return
        const parentDiv = $(a).closest("div")
        const snippet = parentDiv.text().trim().slice(0, 300)
        newsMap.set(url, { title, url, source: "", date: "", snippet })
      })
  })

  const news = Array.from(newsMap.values())
  return { aiOverview, news }
}

async function fetchGoogleSearch(query: string): Promise<{ aiOverview: string | null; news: NewsItem[] } | null> {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&gl=us&hl=en&num=20&source=news`
  try {
    const res = await fetchWithTimeout(url, 8000)
    if (!res.ok) return null
    const html = await res.text()
    if (html.length < 1000) return null
    return parseGoogleSearchHTML(html)
  } catch {
    return null
  }
}

async function fetchGoogleNewsRSS(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
  try {
    const res = await fetchWithTimeout(url, 8000)
    if (!res.ok) return []
    const xml = await res.text()
    return parseRSSXML(xml)
  } catch {
    return []
  }
}

function parseRSSXML(xml: string): NewsItem[] {
  const $ = cheerio.load(xml, { xmlMode: true })
  const items: NewsItem[] = []

  $("item").each((_, el) => {
    const title = $(el).find("title").text().trim()
    const link = $(el).find("link").text().trim()
    const pubDate = $(el).find("pubDate").text().trim()
    const description = $(el).find("description").text().trim()
    const source = $(el).find("source").text().trim()

    if (!title || !link) return

    let snippet = description.replace(/<[^>]*>/g, "").trim()
    if (snippet.length > 300) snippet = snippet.slice(0, 300)

    const imgMatch = description.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/)
    const thumbnail = imgMatch?.[1]

    let date = ""
    if (pubDate) {
      try {
        const d = new Date(pubDate)
        const now = Date.now()
        const diff = now - d.getTime()
        const mins = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)
        if (mins < 60) date = `${mins}m ago`
        else if (hours < 24) date = `${hours}h ago`
        else date = `${days}d ago`
      } catch {
        date = pubDate
      }
    }

    items.push({ title, url: link, source, date, snippet, thumbnail })
  })

  return items
}

export async function scrapeNews(query: string): Promise<SearchResult> {
  if (!query) {
    return { aiOverview: null, news: [], source: "rss", query }
  }

  const [searchResult, rssNews] = await Promise.all([
    fetchGoogleSearch(query),
    fetchGoogleNewsRSS(query),
  ])

  if (searchResult && searchResult.news.length > 0) {
    const existingUrls = new Set(searchResult.news.map((n) => n.url))
    for (const item of rssNews) {
      if (!existingUrls.has(item.url)) {
        searchResult.news.push(item)
      }
    }
    if (searchResult.news.length > 50) {
      searchResult.news = searchResult.news.slice(0, 50)
    }
    return {
      aiOverview: searchResult.aiOverview,
      news: searchResult.news,
      source: "google",
      query,
    }
  }

  return {
    aiOverview: null,
    news: rssNews.slice(0, 50),
    source: "rss",
    query,
  }
}
