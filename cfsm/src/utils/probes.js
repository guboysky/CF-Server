import { timestamp } from './metrics.js'

export const probeColors = ['#39bda7', '#e5a44e', '#57a4e0', '#a58add', '#d97395', '#7eab58', '#dc7954', '#7597b9']
export function probeNumber(value) {
  if (value === null || value === undefined || value === false || value === '' || value === 'false') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}
export function probeAverage(values) {
  const valid = values.map(probeNumber).filter(value => value !== null)
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null
}
export function probeValueText(value, loss = false) {
  const number = probeNumber(value)
  if (number === null) return '—'
  // Keep small measured losses visible instead of rounding them to zero.
  return `${number > 0 && number < 0.01 ? '<0.01' : Number(number.toFixed(loss ? 2 : 1))}${loss ? '%' : ' ms'}`
}
export function probeSamples(server, field, key) {
  return (Array.isArray(server[field]) ? server[field] : [])
    .filter(point => point && typeof point === 'object')
    .map((point, index) => ({ value: point[key], time: timestamp(point.ts ?? point.timestamp), index }))
    .sort((a, b) => a.time - b.time || a.index - b.index).map(point => point.value)
}
export function cardProbeValue(server, field, key, windows) {
  const values = windows ? probeSamples(server, field, key) : []
  if (field === 'loss') return probeAverage(values) ?? probeNumber(server[`loss_${key}`])
  return [...values].reverse().find(value => probeNumber(value) !== null) ?? server[`ping_${key}`]
}
export function historyPercent(row, used, total) {
  const numerator = probeNumber(row[used]), denominator = probeNumber(row[total])
  return numerator === null || denominator === null ? undefined : denominator === 0 ? 0 : numerator / denominator * 100
}
export function diskIo(value) {
  if (typeof value === 'string') { try { value = JSON.parse(value) } catch { return {} } }
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}
