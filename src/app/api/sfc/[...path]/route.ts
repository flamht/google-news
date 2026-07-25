import { type NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "edge"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const search = request.nextUrl.search
  const url = `https://api.sofascore.com/${path.join("/")}${search}`

  try {
    const targetHeaders = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
      "Accept": "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.sofascore.com/",
      "Origin": "https://www.sofascore.com",
    }

    const res = await fetch(url, { headers: targetHeaders })

    const body = await res.text()
    console.log(`[sfc] ${res.status} ${url}`)
    return new Response(body, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
