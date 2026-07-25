import { type NextRequest } from "next/server"
import { fetchPlayerFromWiki } from "@/lib/wikipedia"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params
  const decoded = decodeURIComponent(name)

  try {
    const player = await fetchPlayerFromWiki(decoded)
    if (!player) {
      return Response.json({ error: "Player not found" }, { status: 404 })
    }
    return Response.json(player)
  } catch (err) {
    console.error(`[wiki] Error fetching ${decoded}:`, err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
