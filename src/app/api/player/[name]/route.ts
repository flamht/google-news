import { type NextRequest } from "next/server"
import { fetchPlayerDetail } from "@/lib/sofascore"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params
  const decoded = decodeURIComponent(name)

  try {
    const detail = await fetchPlayerDetail(decoded)
    if (!detail) {
      console.error(`[player] Player not found on Sofascore: ${decoded}`)
      return Response.json({ error: "Player not found" }, { status: 404 })
    }
    return Response.json(detail)
  } catch (err) {
    console.error(`[player] Error fetching ${decoded}:`, err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}