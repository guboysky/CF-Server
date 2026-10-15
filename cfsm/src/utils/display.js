import { bytes, percent, timestamp } from './metrics.js'
export const osIcon = value => {
  const os = String(value || '').toLowerCase()
  if (os.includes('alpine')) return 'os-alpine.webp'
  for (const name of ['ubuntu', 'debian', 'windows', 'centos', 'arch', 'fedora', 'macos', 'openwrt', 'rocky']) if (os.includes(name)) return `os-${name}.svg`
  return ''
}
export const validRegion = region => /^[a-z]{2}$/i.test(region || '')
export const loadValues = value => {
  if (Array.isArray(value)) return value.slice(0, 3).map(Number)
  return String(value ?? '').split(/[,\s]+/).filter(Boolean).slice(0, 3).map(Number).filter(Number.isFinite)
}
export const daysLeft = (value, now = Date.now()) => timestamp(value) ? Math.ceil((timestamp(value) - now) / 86400000) : null
export const uptimeDays = (value, now = Date.now()) => timestamp(value) ? Math.max(0, Math.floor((now - timestamp(value)) / 86400000)) : null
export function uptimeText(value, now = Date.now(), language = 'zh') {
  const start = timestamp(value)
  if (!start || start > now) return '—'
  const minutes = Math.floor((now - start) / 60000)
  const days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), remaining = minutes % 60
  if (language === 'zh') return `${days ? `${days}天` : ''}${hours}小时${remaining}分`
  return `${days ? `${days}d ` : ''}${hours}h ${remaining}min`
}
export function expiryDate(value) {
  const stamp = timestamp(value)
  if (!stamp) return '—'
  const date = new Date(stamp)
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
}
export const nodeNotes = server => typeof server.note === 'string' ? server.note.trim().split(/[\n,，;；]+/).map(value => value.trim()).filter(Boolean) : []
export function regionName(code, language = 'zh') {
  if (!validRegion(code)) return ''
  try { return new Intl.DisplayNames([language], { type: 'region' }).of(code.toUpperCase()) || code } catch { return code }
}
export function inferredProvider(server) {
  const source = `${server.name || ''} ${typeof server.note === 'string' ? server.note : ''}`
  const known = [['OVH', /\bovh\b/i], ['Netcup', /\bnetcup\b/i], ['RackNerd', /\bracknerd\b/i], ['DMIT', /\bdmit\b/i], ['Hetzner', /\bhetzner\b/i], ['Oracle', /\boracle\b/i], ['Tencent', /腾讯|tencent/i], ['Alibaba', /阿里|alibaba|aliyun/i], ['Vultr', /\bvultr\b/i]]
  return known.find(([, pattern]) => pattern.test(source))?.[0] || ''
}
export function traffic(server) {
  const rx = Number(server.net_rx_monthly ?? server.net_rx) || 0
  const tx = Number(server.net_tx_monthly ?? server.net_tx) || 0
  const used = ({ dl: rx, ul: tx, max: Math.max(rx, tx) })[server.traffic_calc_type] ?? rx + tx
  const limit = Number(server.traffic_limit) > 0 ? Number(server.traffic_limit) * 1024 ** 3 : 0
  return { used, limit, percentage: percent(used, limit), detail: `${bytes(used)} / ${limit ? bytes(limit) : '∞'}` }
}
export function billing(server, language) {
  const price = String(server.price ?? '').trim()
  if (!price) return ''
  if (price === '0' || price === '-1') return ({ zh: '免费', es: 'Gratis' })[language] || 'Free'
  const cycles = { zh: { month: '月', quarter: '季', half_year: '半年', year: '年', two_years: '2年', three_years: '3年', four_years: '4年', five_years: '5年' }, en: { month: 'mo', quarter: 'qtr', half_year: '6mo', year: 'yr', two_years: '2yr', three_years: '3yr', four_years: '4yr', five_years: '5yr' }, es: { month: 'mes', quarter: 'trim', half_year: '6mes', year: 'año' } }
  const cycle = (cycles[language] || cycles.en)[server.billing_cycle] || ''
  const currencies = { USD: '$', CNY: '¥', EUR: '€', GBP: '£', HKD: 'HK$', JPY: '¥' }
  const currency = currencies[server.currency] || server.currency || ''
  return `${currency}${price}${cycle ? ` / ${cycle}` : ''}`
}
export const probeTone = (value, loss = false) => value === null ? 'bad' : value === false || value === undefined ? 'absent' : Number(value) >= (loss ? 5 : 220) ? 'bad' : Number(value) >= (loss ? 1 : 170) ? 'warn' : 'good'
export const probeWindow = (server, field, key) => (Array.isArray(server[field]) ? server[field] : []).map(point => point[key])
