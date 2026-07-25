import * as cheerio from "cheerio"
import https from "node:https"
import http from "node:http"
import type { NewsItem, SearchResult } from "./types"
import { extractPlayers, verifyPlayerNames } from "./players"
import { extractClubs } from "./clubs"

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
]

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

function nodeFetch(url: string, timeoutMs = 10000): Promise<{ ok: boolean; text: () => Promise<string> }> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https")
    const mod = isHttps ? https : http

    const parsedUrl = new URL(url)
    const options: Record<string, unknown> = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        "User-Agent": randomUA(),
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      rejectUnauthorized: false,
      timeout: timeoutMs,
    }

    const req = mod.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on("data", (chunk: Buffer) => chunks.push(chunk))
      res.on("end", () => {
        const body = Buffer.concat(chunks)
        const status = res.statusCode || 500
        resolve({
          ok: status >= 200 && status < 300,
          text: async () => body.toString("utf-8"),
        })
      })
      res.on("error", reject)
    })

    req.on("error", reject)
    req.on("timeout", () => {
      req.destroy()
      reject(new Error("Request timed out"))
    })
    req.end()
  })
}

function parseBingNewsHTML(html: string): NewsItem[] {
  const $ = cheerio.load(html)
  const items: NewsItem[] = []
  const seen = new Set<string>()

  $(".news-card.newsitem.cardcommon").each((_, card) => {
    const $card = $(card)

    const url = $card.attr("url") || $card.find("a.title").attr("href") || ""
    if (!url || seen.has(url)) return
    seen.add(url)

    const titleEl = $card.find("a.title h2")
    const title = titleEl.text().trim()
    if (!title) return

    const source = $card.find("a.title").attr("data-author") || ""
    const snippet = $card.find(".snippet").attr("title") || $card.find(".snippet").text().trim() || ""

    const thumbnail = $card.find("img.rms_img").attr("data-src-hq") || ""
    const thumbUrl = thumbnail ? `https:${thumbnail}` : undefined

    let date = ""
    const dateEl = $card.find("span[aria-label]").last()
    if (dateEl.length) {
      const label = dateEl.attr("aria-label") || ""
      if (label.includes("ago") || label.includes("second") || label.includes("minute") || label.includes("hour") || label.includes("day") || label.includes("week") || label.includes("month") || label.includes("year")) {
        date = label
      } else {
        date = dateEl.text().trim()
      }
    }

    const firstSentence = snippet.split(/\.\s|!\s|\?\s/)[0]?.trim() || ""
    const players = extractPlayers(title, snippet)
    const clubs = extractClubs(title, snippet)

    items.push({
      title,
      url,
      source,
      date,
      snippet: snippet.slice(0, 300),
      summary: firstSentence.slice(0, 150) || snippet.slice(0, 150),
      players,
      clubs,
      thumbnail: thumbUrl,
    })
  })

  return items
}

async function fetchBingNews(query: string): Promise<NewsItem[]> {
  const url = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&qft=sortbydate%3d%221%22`
  try {
    const res = await nodeFetch(url, 10000)
    if (!res.ok) return []
    const html = await res.text()
    if (html.length < 1000) return []
    return parseBingNewsHTML(html)
  } catch {
    return []
  }
}

async function fetchGoogleNewsRSS(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
  try {
    const res = await nodeFetch(url, 10000)
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
        const diff = Date.now() - d.getTime()
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

    const firstSentence = snippet.split(/\.\s|!\s|\?\s/)[0]?.trim() || ""
    const players = extractPlayers(title, snippet)
    const clubs = extractClubs(title, snippet)
    items.push({ title, url: link, source, date, snippet, summary: firstSentence.slice(0, 150), players, clubs, thumbnail })
  })

  return items
}

export async function scrapeNews(query: string): Promise<SearchResult> {
  if (!query) {
    return { aiOverview: null, news: [], source: "rss", query }
  }

  const [bingNews, rssNews] = await Promise.all([
    fetchBingNews(query),
    fetchGoogleNewsRSS(query),
  ])

  const allNews = bingNews.length > 0 ? bingNews : rssNews.slice(0, 50)
  const source: SearchResult["source"] = bingNews.length > 0 ? "bing" : "rss"

  if (bingNews.length > 0) {
    const existingUrls = new Set(bingNews.map((n) => n.url))
    for (const item of rssNews) {
      if (!existingUrls.has(item.url)) {
        allNews.push(item)
      }
    }
  }

  const result = allNews.slice(0, 50)

  const allNames = new Set(result.flatMap((n) => n.players))
  if (allNames.size > 0) {
    const newsText = result.map((n) => `${n.title} ${n.snippet}`).join(" ")
    const verified = await verifyPlayerNames(Array.from(allNames), newsText)
    for (const item of result) {
      item.players = item.players.filter((p) => verified.has(p))
    }
  }

  return { aiOverview: null, news: result, source, query }
}
