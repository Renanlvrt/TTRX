// UK student cities for the "Where is the house?" step. Place names only, no prices.
// Big cities list their main student neighbourhoods so the second box can suggest them.
// Durham's neighbourhoods come from AREAS in lib/types, the only areas with researched prices.

export interface City {
  name: string
  neighbourhoods?: string[]
}

/** The one city with researched prices. */
export const PRICED_CITY = 'Durham'

export const CITIES: City[] = [
  { name: 'Aberdeen', neighbourhoods: ['Old Aberdeen', 'Rosemount', 'Torry', 'City Centre'] },
  { name: 'Bath', neighbourhoods: ['Oldfield Park', 'Widcombe', 'Combe Down', 'City Centre'] },
  { name: 'Belfast', neighbourhoods: ['Queen’s Quarter', 'Stranmillis', 'Botanic', 'City Centre'] },
  { name: 'Birmingham', neighbourhoods: ['Selly Oak', 'Edgbaston', 'Harborne', 'Bournbrook', 'Digbeth', 'City Centre'] },
  { name: 'Brighton', neighbourhoods: ['Hanover', 'Coldean', 'Moulsecoomb', 'Kemptown', 'City Centre'] },
  { name: 'Bristol', neighbourhoods: ['Clifton', 'Redland', 'Cotham', 'Bishopston', 'Stokes Croft', 'City Centre'] },
  { name: 'Cambridge', neighbourhoods: ['Mill Road', 'Chesterton', 'Newnham', 'City Centre'] },
  { name: 'Canterbury' },
  { name: 'Cardiff', neighbourhoods: ['Cathays', 'Roath', 'Splott', 'Canton', 'City Centre'] },
  { name: 'Coventry', neighbourhoods: ['Earlsdon', 'Canley', 'Tile Hill', 'City Centre'] },
  { name: 'Dundee', neighbourhoods: ['West End', 'Hilltown', 'City Centre'] },
  { name: PRICED_CITY },
  { name: 'Edinburgh', neighbourhoods: ['Marchmont', 'Newington', 'Bruntsfield', 'Leith', 'Old Town', 'City Centre'] },
  { name: 'Exeter', neighbourhoods: ['St James', 'Pennsylvania', 'Heavitree', 'City Centre'] },
  { name: 'Glasgow', neighbourhoods: ['West End', 'Hillhead', 'Partick', 'Finnieston', 'Southside', 'City Centre'] },
  { name: 'Guildford' },
  { name: 'Hull', neighbourhoods: ['Newland Park', 'Cottingham', 'Princes Avenue', 'City Centre'] },
  { name: 'Lancaster' },
  { name: 'Leeds', neighbourhoods: ['Headingley', 'Hyde Park', 'Burley', 'Woodhouse', 'Kirkstall', 'City Centre'] },
  { name: 'Leicester', neighbourhoods: ['Clarendon Park', 'Stoneygate', 'Knighton', 'City Centre'] },
  { name: 'Liverpool', neighbourhoods: ['Smithdown', 'Wavertree', 'Kensington', 'Toxteth', 'City Centre'] },
  { name: 'London', neighbourhoods: ['Camden', 'Islington', 'Mile End', 'Stratford', 'King’s Cross', 'Bloomsbury', 'New Cross', 'Shepherd’s Bush', 'Hackney', 'Brixton'] },
  { name: 'Loughborough' },
  { name: 'Manchester', neighbourhoods: ['Fallowfield', 'Withington', 'Rusholme', 'Didsbury', 'Victoria Park', 'City Centre'] },
  { name: 'Newcastle', neighbourhoods: ['Jesmond', 'Heaton', 'Sandyford', 'Fenham', 'Shieldfield', 'City Centre'] },
  { name: 'Norwich', neighbourhoods: ['Golden Triangle', 'Earlham', 'City Centre'] },
  { name: 'Nottingham', neighbourhoods: ['Lenton', 'Beeston', 'Dunkirk', 'Radford', 'City Centre'] },
  { name: 'Oxford', neighbourhoods: ['Cowley', 'Jericho', 'Headington', 'Summertown', 'City Centre'] },
  { name: 'Plymouth', neighbourhoods: ['Mutley', 'Greenbank', 'North Hill', 'City Centre'] },
  { name: 'Portsmouth', neighbourhoods: ['Southsea', 'Fratton', 'Landport', 'City Centre'] },
  { name: 'Reading', neighbourhoods: ['Earley', 'Whitley', 'Redlands', 'Town Centre'] },
  { name: 'Sheffield', neighbourhoods: ['Broomhill', 'Crookes', 'Ecclesall Road', 'Walkley', 'City Centre'] },
  { name: 'Southampton', neighbourhoods: ['Portswood', 'Highfield', 'Swaythling', 'City Centre'] },
  { name: 'St Andrews' },
  { name: 'Stirling' },
  { name: 'Swansea', neighbourhoods: ['Uplands', 'Brynmill', 'Sketty', 'City Centre'] },
  { name: 'Warwick' },
  { name: 'York', neighbourhoods: ['Heslington', 'Tang Hall', 'Fulford', 'City Centre'] },
]

/** Up to `max` matches, names starting with the query first, then names containing it. */
export function suggest(options: string[], query: string, max = 4): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const starts = options.filter((o) => o.toLowerCase().startsWith(q))
  const contains = options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q))
  return [...starts, ...contains].slice(0, max)
}

export const findCity = (name: string) => CITIES.find((c) => c.name.toLowerCase() === name.trim().toLowerCase()) ?? null
