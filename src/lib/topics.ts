export interface Topic {
  id: string
  label: string
  query: string
}

export const types: Topic[] = [
  { id: "transfer", label: "Transfer News", query: "transfer" },
  { id: "match", label: "Upcoming Match", query: "upcoming match" },
]

export const clubs: Topic[] = [
  { id: "arsenal", label: "Arsenal", query: "arsenal" },
  { id: "ac-milan", label: "AC Milan", query: "AC Milan" },
  { id: "man-city", label: "Manchester City", query: "Manchester City" },
  { id: "man-united", label: "Manchester United", query: "Manchester United" },
  { id: "liverpool", label: "Liverpool", query: "Liverpool" },
  { id: "chelsea", label: "Chelsea", query: "Chelsea" },
  { id: "epl", label: "Premier League", query: "Premier League" },
  { id: "la-liga", label: "La Liga", query: "La Liga" },
  { id: "bundesliga", label: "Bundesliga", query: "Bundesliga" },
  { id: "serie-a", label: "Serie A", query: "Serie A" },
  { id: "ligue-1", label: "Ligue 1", query: "Ligue 1" },
]

export function buildQuery(typeId?: string | null, clubId?: string | null): string {
  const type = types.find((t) => t.id === typeId)
  const club = clubs.find((c) => c.id === clubId)
  const parts: string[] = []
  if (club) parts.push(club.query)
  if (type) parts.push(type.query)
  if (parts.length === 0) return ""
  return parts.join(" ")
}
