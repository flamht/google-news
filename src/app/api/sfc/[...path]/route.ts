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
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        "Accept": "application/json",
        "Referer": "https://www.sofascore.com/",
        "Origin": "https://www.sofascore.com",
      },
    })

    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
