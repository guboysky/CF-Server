import { probeNumber } from '../utils/probes.js'
export function sparklineBounds(values, focused = false) {
  const valid = values.map(probeNumber).filter(value => value !== null)
  if (!valid.length) return { min: 0, max: 1 }
  const low = Math.min(...valid), high = Math.max(...valid)
  if (!focused) return { min: 0, max: Math.max(1, high) }
  const padding = Math.max(2, (high - low) * .15, high * .005)
  return { min: Math.max(0, low - padding), max: high + padding }
}
