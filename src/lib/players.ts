import https from "node:https"

const knownPlayers = new Set([
  "Bukayo Saka", "Martin Odegaard", "Gabriel Jesus", "Gabriel Martinelli",
  "William Saliba", "Declan Rice", "Ben White", "Thomas Partey",
  "Kai Havertz", "Leandro Trossard", "Jurrien Timber", "David Raya",
  "Aaron Ramsdale", "Jakub Kiwior", "Oleksandr Zinchenko",
  "Emile Smith Rowe", "Reiss Nelson", "Eddie Nketiah",
  "Takehiro Tomiyasu", "Albert Sambi Lokonga", "Rob Holding",
  "Ethan Nwaneri", "Myles Lewis-Skelly", "Riccardo Calafiori", "Mikel Merino",
  "Raheem Sterling", "Kieran Tierney", "Christos Tzolis",
  "Bruno Guimaraes", "Ollie Watkins", "John Stones", "Yan Diomande",
  "Morgan Rogers", "Julian Alvarez", "Mikel Arteta",
  "Cole Palmer", "Enzo Fernandez", "Moises Caicedo", "Reece James",
  "Levi Colwill", "Christopher Nkunku", "Mykhailo Mudryk",
  "Nicolas Jackson", "Romeo Lavia", "Wesley Fofana", "Malo Gusto",
  "Conor Gallagher", "Ben Chilwell", "Carney Chukwuemeka",
  "Noni Madueke", "Marc Cucurella", "Djordje Petrovic",
  "Mohamed Salah", "Virgil van Dijk", "Trent Alexander-Arnold", "Alisson Becker",
  "Darwin Nunez", "Cody Gakpo", "Dominik Szoboszlai", "Alexis Mac Allister",
  "Ryan Gravenberch", "Diogo Jota", "Luis Diaz", "Andy Robertson",
  "Ibrahima Konate", "Curtis Jones", "Harvey Elliott",
  "Caoimhin Kelleher", "Joe Gomez", "Stefan Bajcetic",
  "Wataru Endo", "Conor Bradley", "Jarell Quansah", "Florian Wirtz",
  "Erling Haaland", "Kevin De Bruyne", "Phil Foden", "Rodri",
  "Ruben Dias", "Bernardo Silva", "Jack Grealish",
  "Kyle Walker", "Manuel Akanji", "Nathan Ake", "Rico Lewis",
  "Matheus Nunes", "Mateo Kovacic", "Jeremy Doku", "Oscar Bobb",
  "Josko Gvardiol", "Savinho", "Elliot Anderson",
  "Marcus Rashford", "Bruno Fernandes", "Rasmus Hojlund", "Kobbie Mainoo",
  "Mason Mount", "Luke Shaw", "Lisandro Martinez", "Raphael Varane",
  "Andre Onana", "Diogo Dalot", "Harry Maguire",
  "Scott McTominay", "Christian Eriksen", "Alejandro Garnacho", "Amad Diallo",
  "Casemiro", "Jadon Sancho", "Aurelien Tchouameni", "Joshua Zirkzee",
  "Rafael Leao", "Theo Hernandez", "Mike Maignan",
  "Fikayo Tomori", "Malick Thiaw", "Ruben Loftus-Cheek", "Christian Pulisic",
  "Tijjani Reijnders", "Samuel Chukwueze", "Ismael Bennacer",
  "Yunus Musah", "Sandro Tonali",
  "Kylian Mbappe", "Jude Bellingham", "Vinicius Junior", "Luka Modric",
  "Toni Kroos", "Federico Valverde", "Eduardo Camavinga",
  "Rodrygo", "Brahim Diaz", "Thibaut Courtois", "Antonio Rudiger",
  "Arda Guler", "Robert Lewandowski", "Pedri", "Gavi", "Lamine Yamal",
  "Frenkie de Jong", "Ilkay Gundogan", "Joao Felix", "Raphinha",
  "Ronald Araujo", "Jules Kounde", "Pau Cubarsi", "Alejandro Balde",
  "Antoine Griezmann", "Jan Oblak", "Alvaro Morata",
  "Harry Kane", "Jamal Musiala", "Joshua Kimmich", "Manuel Neuer",
  "Thomas Muller", "Leroy Sane", "Serge Gnabry", "Kingsley Coman",
  "Alphonso Davies", "Kim Min-jae", "Dayot Upamecano", "Aleksandar Pavlovic",
  "Jeremie Frimpong", "Alejandro Grimaldo", "Exequiel Palacios", "Granit Xhaka",
  "Victor Boniface", "Florian Wirtz", "Xabi Alonso",
  "Julian Brandt", "Karim Adeyemi", "Gregor Kobel", "Nico Schlotterbeck",
  "Serhou Guirassy", "Lois Openda", "Benjamin Sesko", "Xavi Simons",
  "Michael Olise", "Marco Reus",
  "Lautaro Martinez", "Marcus Thuram", "Nicolo Barella", "Hakan Calhanoglu",
  "Alessandro Bastoni", "Henrikh Mkhitaryan", "Benjamin Pavard",
  "Dusan Vlahovic", "Federico Chiesa", "Teun Koopmeiners",
  "Kenan Yildiz", "Weston McKennie", "Paulo Dybala",
  "Victor Osimhen", "Khvicha Kvaratskhelia",
  "Ousmane Dembele", "Marquinhos", "Achraf Hakimi", "Gianluigi Donnarumma",
  "Fabian Ruiz", "Vitinha", "Warren Zaire-Emery", "Bradley Barcola",
  "Randal Kolo Muani", "Jonathan David", "Angel Gomes",
  "Heung-min Son", "James Maddison", "Micky van de Ven",
  "Cristian Romero", "Dominic Solanke", "Alexander Isak",
  "Anthony Gordon", "Sven Botman", "Miguel Almiron", "Kieran Trippier",
  "Douglas Luiz", "Emiliano Martinez", "Youri Tielemans",
  "Lucas Paqueta", "Jarrod Bowen", "Mohammed Kudus",
  "Eberechi Eze", "Ivan Toney", "Bryan Mbeumo",
  "David de Gea", "Romelu Lukaku", "Edin Dzeko",
  "Matthijs de Ligt", "Frenkie de Jong", "Virgil van Dijk",
  "Memphis Depay", "Daley Blind", "Donny van de Beek",
  "Tijjani Reijnders", "Martijn de Roon",
])

const nonPlayerEntities = new Set([
  "Arsenal", "Chelsea", "Liverpool", "Manchester City", "Manchester United",
  "Man City", "Man United", "Tottenham", "Newcastle", "Aston Villa",
  "West Ham", "Brighton", "Wolves", "Crystal Palace", "Everton",
  "Fulham", "Brentford", "Nottingham Forest", "Bournemouth",
  "Leicester City", "Southampton", "Ipswich Town",
  "AC Milan", "Inter Milan", "Juventus", "Roma", "Napoli", "Lazio",
  "Atalanta", "Fiorentina", "Bologna", "Torino",
  "Barcelona", "Real Madrid", "Atletico Madrid", "Athletic Club",
  "Real Sociedad", "Villarreal", "Real Betis", "Sevilla", "Valencia",
  "Bayern Munich", "Dortmund", "RB Leipzig", "Bayer Leverkusen",
  "Borussia Dortmund", "Borussia Monchengladbach", "Eintracht Frankfurt",
  "VfB Stuttgart", "Wolfsburg", "Mainz", "Freiburg", "Hoffenheim",
  "Paris Saint-Germain", "PSG", "Monaco", "Lyon", "Marseille", "Lille",
  "Nice", "Rennes", "Lens", "Strasbourg",
  "Premier League", "EPL", "La Liga", "Bundesliga", "Serie A", "Ligue 1",
  "Champions League", "Europa League", "Conference League",
  "World Cup", "European Championship", "Euro",
  "FA Cup", "Carabao Cup", "EFL Cup",
  "The Gunners", "The Reds", "The Blues", "The Citizens",
  "The Toffees", "The Magpies", "The Seagulls", "The Hammers",
  "Transfer News", "Upcoming Match",
  "London Evening Standard", "Sky Sports", "BBC", "The Athletic",
  "The Guardian", "The Times", "Metro", "Mirror", "Telegraph",
  "Summer transfer", "Transfer window", "transfer window",
  "January transfer", "Transfer news", "transfer news",
  "First Team", "first team", "Medical", "medical",
  "Contract", "contract", "Extension", "extension",
  "Injury", "Injury blow", "injury", "injury blow",
  "Bid", "Offer", "Deal", "Agreement",
  "LIVE", "live", "Latest", "latest", "Update", "update",
  "Report", "reports", "Reports", "Rumour", "Rumours",
  "Goal", "goal", "GOAL",
  "Newcastle United", "Tottenham Hotspur", "Leicester City",
  "Crystal Palace", "Nottingham Forest", "Aston Villa",
  "West Ham United", "Wolverhampton", "Manchester City",
  "Manchester United", "Ipswich Town", "Southampton",
  "AC Milan", "Inter Milan", "AS Roma", "FC Barcelona",
  "Real Madrid CF", "Atletico Madrid", "Bayern Munich",
  "Borussia Dortmund", "Paris Saint-Germain",
  "The Athletic", "The Guardian", "The Telegraph", "The Independent",
  "The Sun", "The Times", "The Mirror", "The Scotsman",
  "The Express", "The Star",
  "After Tottenham", "After Chelsea", "After Arsenal",
  "Before Arsenal", "Before Chelsea", "Before Liverpool",
])

function textMatches(text: string, name: string): boolean {
  const idx = text.indexOf(name)
  if (idx === -1) return false
  const before = idx === 0 || /[\s,.\-!?;:'"([{]/.test(text[idx - 1])
  const after = idx + name.length >= text.length || /[\s,.\-!?;:'")\]}]+/.test(text[idx + name.length])
  return before && after
}

const commonNameStarts = new Set([
  "After", "Before", "During", "Without", "Within", "About",
  "Into", "From", "With", "Under", "Over", "Through",
  "Between", "Against", "Across", "Around", "Behind",
  "Below", "Beneath", "Beside", "Beyond", "Inside",
  "Outside", "The", "This", "That", "These", "Those",
  "What", "When", "Where", "While", "Why", "How",
  "Which", "Who", "Whom", "Whose",
  "Latest", "LIVE", "Live", "Breaking", "Update",
  "First", "Last", "Next", "New", "Old",
])

function extractNameTokens(text: string): string[] {
  const namePattern = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}/g
  const matches = text.match(namePattern)
  if (!matches) return []
  return matches
    .map((m) => m.trim())
    .map((n) => {
      const words = n.split(/\s+/)
      while (words.length > 2 && commonNameStarts.has(words[words.length - 1])) {
        words.pop()
      }
      return words.join(" ")
    })
    .filter((n) => {
      const words = n.split(/\s+/)
      return words.length >= 2 && words.length <= 4
    })
    .filter((n) => !nonPlayerEntities.has(n))
    .filter((n) => {
      const words = n.split(/\s+/)
      return words.every((w) => !commonNameStarts.has(w))
    })
    .filter((n) => {
      const words = n.split(/\s+/)
      return !words.some((w) => nonPlayerEntities.has(w))
    })
}

export function extractPlayers(title: string, snippet: string): string[] {
  const text = `${title} ${snippet}`
  const found = new Set<string>()

  for (const name of knownPlayers) {
    if (textMatches(text, name) && !nonPlayerEntities.has(name)) {
      found.add(name)
    }
  }

  for (const token of extractNameTokens(text)) {
    if (found.size < 5 && !found.has(token) && !nonPlayerEntities.has(token)) {
      found.add(token)
    }
  }

  return Array.from(found).slice(0, 5)
}

const verificationCache = new Map<string, boolean>()
const pendingCache = new Map<string, Promise<boolean>>()

function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        Accept: "application/json",
        Referer: "https://www.sofascore.com/",
        Origin: "https://www.sofascore.com",
      },
      rejectUnauthorized: false,
      timeout: 5000,
    }
    const req = https.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on("data", (chunk: Buffer) => chunks.push(chunk))
      res.on("end", () => {
        const body = Buffer.concat(chunks)
        try {
          resolve(JSON.parse(body.toString("utf-8")))
        } catch {
          reject(new Error("Invalid JSON"))
        }
      })
      res.on("error", reject)
    })
    req.on("error", reject)
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")) })
    req.end()
  })
}

function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

const commonTeams = new Set([
  "Arsenal", "Liverpool", "Manchester City", "Manchester United",
  "Chelsea", "Tottenham", "Newcastle", "Aston Villa", "Everton",
  "West Ham", "Brighton", "Wolves", "Crystal Palace", "Brentford",
  "Nottingham", "Bournemouth", "Fulham", "Ipswich",
  "AC Milan", "Inter", "Juventus", "Napoli", "Roma", "Lazio",
  "Barcelona", "Real Madrid", "Atletico Madrid", "Sevilla",
  "Bayern Munich", "Dortmund", "RB Leipzig", "Bayer Leverkusen",
  "PSG", "Marseille", "Lyon", "Monaco", "Lille",
  "Sporting", "Benfica", "Porto",
])

async function verifySingleName(name: string, newsText: string): Promise<boolean> {
  const cached = verificationCache.get(name)
  if (cached !== undefined) return cached

  const pending = pendingCache.get(name)
  if (pending) return pending

  const promise = (async () => {
    try {
      const data = await fetchJson(
        `https://api.sofascore.com/api/v1/search/players/${encodeURIComponent(name)}`,
      )
      const dataObj = data as { players?: Array<{ name: string; team?: { name: string } }> } | null
      const players: Array<{ name: string; team?: { name: string } }> = dataObj?.players ?? []
      if (players.length === 0) return false

      const normName = normalizeName(name)
      const normNews = newsText.toLowerCase()

      const scored = players.map((p) => {
        const exact = p.name === name
        const accentMatch = normalizeName(p.name) === normName
        const teamName = p.team?.name ?? ""
        const teamInNews = teamName.length > 0 && normNews.includes(teamName.toLowerCase())

        let verified = false
        if (exact) verified = true
        else if (accentMatch && teamInNews) verified = true

        return { verified, name: p.name, teamName, exact, accentMatch, teamInNews }
      })

      const verified = scored.some((p) => p.verified)
      verificationCache.set(name, verified)
      return verified
    } catch {
      return false
    }
  })()

  pendingCache.set(name, promise)
  const result = await promise
  pendingCache.delete(name)
  return result
}

export async function verifyPlayerNames(names: string[], newsText = ""): Promise<Set<string>> {
  const known: string[] = []
  const unknown: string[] = []

  for (const name of names) {
    if (knownPlayers.has(name) || verificationCache.get(name)) {
      known.push(name)
    } else {
      unknown.push(name)
    }
  }

  if (unknown.length === 0) return new Set(known)

  const results = await Promise.allSettled(unknown.map((n) => verifySingleName(n, newsText)))
  const verified = new Set(known)

  for (let i = 0; i < unknown.length; i++) {
    const r = results[i]
    if (r.status === "fulfilled" && r.value) {
      verified.add(unknown[i])
    }
  }

  return verified
}
