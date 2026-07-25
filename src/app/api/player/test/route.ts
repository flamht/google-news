import { fetchPlayerDetail } from "@/lib/sofascore"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const tests = [
    { label: "Vinicius Junior", expected: "Real Madrid" },
    { label: "Bukayo Saka", expected: "Arsenal" },
    { label: "Erling Haaland", expected: "Manchester City" },
  ]

  const results = await Promise.all(
    tests.map(async ({ label, expected }) => {
      const detail = await fetchPlayerDetail(label)
      return {
        name: label,
        found: !!detail,
        team: detail?.teamName ?? null,
        teamMatch: detail?.teamName === expected,
        id: detail?.id ?? null,
      }
    }),
  )

  return Response.json(results)
}
