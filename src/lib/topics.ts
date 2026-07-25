export interface Topic {
  id: string
  label: string
}

export const types: Topic[] = [
  { id: "transfer", label: "Transfer News" },
  { id: "match", label: "Upcoming Match" },
]

export const clubs: Topic[] = [
  { id: "arsenal", label: "Arsenal" },
  { id: "ac-milan", label: "AC Milan" },
  { id: "man-city", label: "Manchester City" },
  { id: "man-united", label: "Manchester United" },
  { id: "liverpool", label: "Liverpool" },
  { id: "chelsea", label: "Chelsea" },
  { id: "epl", label: "Premier League" },
  { id: "la-liga", label: "La Liga" },
  { id: "bundesliga", label: "Bundesliga" },
  { id: "serie-a", label: "Serie A" },
  { id: "ligue-1", label: "Ligue 1" },
]

export function buildQuery(typeId?: string | null, clubId?: string | null): string {
  const type = types.find((t) => t.id === typeId)
  const club = clubs.find((c) => c.id === clubId)
  const parts: string[] = []
  if (type) parts.push(type.label)
  if (club) parts.push(club.label)
  if (parts.length === 0) return ""
  return parts.join(" ") + " football"
}
