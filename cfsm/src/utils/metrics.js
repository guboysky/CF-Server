export const HOURS = [0.167, 0.5, 1, 6, 12, 24, 48, 96, 168]
export const probes = ['ct', 'cu', 'cm', 'bd', 'node_1', 'node_2', 'node_3', 'node_4']
export const present = value => value !== false && value !== undefined
export function timestamp(value) {
  if (value == null) return 0
  const numeric = typeof value === 'number' ? value : typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value) : NaN
  if (Number.isFinite(numeric)) return numeric < 1e12 ? numeric * 1000 : numeric
  return Date.parse(value) || 0
}
export const online = (server, now = Date.now()) => now - timestamp(server.last_updated) < 300000
export function mergeMetrics(previous, incoming) {
  const next = { ...previous }
  for (const [key, value] of Object.entries(incoming || {})) {
    if (value !== undefined && key !== '__proto__' && key !== 'constructor') next[key] = value
  }
  return next
}
export function collectBatch(message, pending, ids) {
  if (message.type !== 'batchUpdate') return
  for (const update of message.updates || []) {
    const id = String(update.serverId)
    if (!ids.has(id)) continue
    const samples = [...(update.samples || [])].sort((a, b) => timestamp(a.ts ?? a.timestamp) - timestamp(b.ts ?? b.timestamp))
    for (const sample of samples) {
      const data = sample.data || sample.payload || sample.metrics
      if (!data || typeof data !== 'object') continue
      const merged = mergeMetrics(pending.get(id), data)
      merged.last_updated = data.last_updated ?? sample.ts ?? sample.timestamp ?? message.ts ?? Date.now()
      pending.set(id, merged)
    }
  }
}
export function gpuInfo(value) {
  if (typeof value === 'string') { try { value = JSON.parse(value) } catch { return [] } }
  return Array.isArray(value) ? value : []
}
export function bytes(value) {
  if (value === undefined || value === null || !Number.isFinite(Number(value))) return '—'
  const size = Math.max(0, Number(value))
  const index = size ? Math.min(4, Math.floor(Math.log(size) / Math.log(1024))) : 0
  return `${(size / 1024 ** index).toFixed(index ? 1 : 0)} ${['B', 'KiB', 'MiB', 'GiB', 'TiB'][index]}`
}
export const percent = (used, total) => Number(total) > 0 ? Number(used) / Number(total) * 100 : 0
export const probeText = (value, unit, timeout = 'Timeout') => value === null ? timeout : present(value) ? `${typeof value === 'number' && Number.isFinite(value) ? Number(value.toFixed(1)) : value}${unit}` : '—'
export function probeLabel(config, key) {
  const configured = config[key.startsWith('node_') ? `${key}_name` : `custom_${key}_name`]
  const locale = config.default_language === 'auto' ? globalThis.navigator?.language || 'en' : config.default_language || 'zh'
  const chinese = locale.startsWith('zh')
  if (configured && !(chinese && ['ct', 'cu', 'cm'].includes(key) && configured.trim().toLowerCase() === key)) return configured
  return (chinese ? { ct: '电信', cu: '联通', cm: '移动', bd: 'BGP' } : { ct: 'CT', cu: 'CU', cm: 'CM', bd: 'BGP' })[key] ?? `${chinese ? '探针' : 'Node'} ${key.slice(-1)}`
}
export const priceText = value => value === '0' || value === '-1' ? 'Free' : String(value ?? '').trim()
