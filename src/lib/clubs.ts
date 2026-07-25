const knownClubs = new Set([
  "Arsenal", "Chelsea", "Liverpool", "Manchester City", "Man City",
  "Manchester United", "Man United", "Tottenham", "Tottenham Hotspur",
  "Newcastle", "Newcastle United", "Aston Villa", "West Ham", "West Ham United",
  "Brighton", "Wolves", "Wolverhampton", "Crystal Palace", "Everton",
  "Fulham", "Brentford", "Nottingham Forest", "Bournemouth",
  "Leicester City", "Southampton", "Ipswich Town",
  "AC Milan", "Inter Milan", "Inter", "Juventus", "Roma", "AS Roma",
  "Napoli", "Lazio", "Atalanta", "Fiorentina", "Bologna", "Torino",
  "Barcelona", "FC Barcelona", "Real Madrid", "Atletico Madrid",
  "Athletic Club", "Real Sociedad", "Villarreal", "Real Betis", "Sevilla",
  "Valencia",
  "Bayern Munich", "Dortmund", "Borussia Dortmund", "RB Leipzig",
  "Bayer Leverkusen", "Borussia Monchengladbach", "Eintracht Frankfurt",
  "VfB Stuttgart", "Wolfsburg", "Mainz", "Freiburg", "Hoffenheim",
  "PSG", "Paris Saint-Germain", "Monaco", "Lyon", "Marseille", "Lille",
  "Nice", "Rennes", "Lens", "Strasbourg",
  "Sporting", "Sporting CP", "Benfica", "Porto",
  "Celtic", "Rangers", "Ajax", "PSV", "Feyenoord",
])

const leagueNames = new Set([
  "Premier League", "EPL", "La Liga", "Bundesliga", "Serie A", "Ligue 1",
  "Champions League", "Europa League", "Conference League",
  "FA Cup", "Carabao Cup", "EFL Cup", "World Cup",
  "European Championship", "Euro 2024", "Copa America",
])

const clubAliases: Record<string, string> = {
  "Man City": "Manchester City",
  "Man United": "Manchester United",
  "Tottenham": "Tottenham Hotspur",
  "Newcastle": "Newcastle United",
  "West Ham": "West Ham United",
  "Wolves": "Wolverhampton",
  "Inter": "Inter Milan",
  "PSG": "Paris Saint-Germain",
  "Dortmund": "Borussia Dortmund",
}

function textMatches(text: string, name: string): boolean {
  const idx = text.indexOf(name)
  if (idx === -1) return false
  const before = idx === 0 || /[\s,.\-!?;:'"([{]/.test(text[idx - 1])
  const after = idx + name.length >= text.length || /[\s,.\-!?;:'")\]}]+/.test(text[idx + name.length])
  return before && after
}

export function extractClubs(title: string, snippet: string): string[] {
  const text = `${title} ${snippet}`
  const found = new Set<string>()

  for (const club of knownClubs) {
    if (textMatches(text, club)) {
      const canonical = clubAliases[club] || club
      found.add(canonical)
    }
  }

  for (const league of leagueNames) {
    if (textMatches(text, league)) {
      found.add(league)
    }
  }

  return Array.from(found).slice(0, 5)
}
