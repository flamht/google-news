import { type NextRequest } from "next/server"
import { scrapeNews } from "@/lib/scraper"
import { buildQuery } from "@/lib/topics"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 30_000

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get("type")
  const club = searchParams.get("club")
  const query = buildQuery(type, club)

  if (!query) {
    return Response.json({ aiOverview: null, news: [], source: "rss", query: "" })
  }

  const cacheKey = query.toLowerCase()
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Response.json(cached.data)
  }

  try {
    const result = await scrapeNews(query)
    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return Response.json(result)
  } catch (error) {
    return Response.json(
      { aiOverview: null, news: [], source: "rss", query, error: "Failed to fetch news" },
      { status: 200 },
    )
  }
}
