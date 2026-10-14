export function normalizeCountry(value: unknown): string {
  return typeof value === 'string' && /^[A-Za-z]{2}$/.test(value.trim()) ? value.trim().toUpperCase() : ''
}
/** Retain a field omitted by a partial push; explicit empty/null values clear it. */
export function mergeCountries<T extends {id: number; name: string; country?: unknown}>(next: T[],previous: T[]): (T & {country: string})[] {
  const before = new Map(previous.map(n=>[n.id,n]))
  return next.map(n=>{
    const old=before.get(n.id)
    const value=n.country === undefined && old?.name === n.name ? old.country : n.country
    return {...n,country:normalizeCountry(value)}
  })
}
