/** Keep the hub's order within each status, without mutating its snapshot. */
export function onlineFirst<T extends {online: boolean}>(nodes: T[]): T[] {
  return [...nodes.filter(n => n.online), ...nodes.filter(n => !n.online)]
}

/** Use CSS pixels, not retina pixels: a trend needs space between its points. */
export function latencyPoints(width: number, hours: number, detailed: boolean): number {
  if(detailed) return 1440
  const available = Math.max(240,Math.min(Number.isFinite(width) ? width : 1024,1480)-100)
  const spacing = hours >= 168 ? 7 : hours >= 24 ? 5 : 4
  const ceiling = hours >= 168 ? 200 : hours >= 24 ? 280 : 360
  return Math.max(90,Math.min(ceiling,Math.round(available/spacing)))
}
