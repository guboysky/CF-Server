import { timestamp } from './metrics.js'
// A counter snapshot cannot recover midnight traffic. Keep partial observation
// explicit, scoped to the site, server and local calendar day.
const observations = new Map()
const valid = value => value !== null && value !== undefined && value !== false && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0
export const localDay = now => { const d = new Date(now); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
export function observeDailyTraffic(base, server, now = Date.now(), storage = globalThis.localStorage) {
  const key = `cfsm:daily:${base}:${server.id}`, day = localDay(now)
  let record = observations.get(key)
  if (!record) { try { record = JSON.parse(storage?.getItem(key) || 'null') } catch {} }
  if (!record || record.day !== day) record = { day, since: now, totals: {}, previous: {}, saved: 0 }
  record.times ??= {}
  const reported = timestamp(server.last_updated ?? server.timestamp) || now
  for (const field of ['net_rx', 'net_tx']) {
    if (!valid(server[field]) || localDay(reported) !== day || reported < (record.times[field] || 0)) continue
    record.times[field] = reported
    const current = Number(server[field]), previous = record.previous[field]
    record.totals[field] ??= 0
    if (valid(previous)) record.totals[field] += current >= previous ? current - previous : current
    record.previous[field] = current
  }
  const dailyKey = [server.traffic_daily_day || day, server.traffic_daily_at, server.net_rx_daily, server.net_tx_daily].join(':')
  if ((valid(server.net_rx_daily) || valid(server.net_tx_daily)) && record.dailyKey !== dailyKey) { record.dailyKey = dailyKey; record.dailyAnchor = { ...record.totals } }
  observations.set(key, record)
  if (now - record.saved >= 30000) {
    record.saved = now
    try { storage?.setItem(key, JSON.stringify(record)) } catch {}
  }
  return { ...server, traffic_observed_since: record.since,
    net_rx_observed: record.totals.net_rx, net_tx_observed: record.totals.net_tx,
    net_rx_daily_delta: (record.totals.net_rx || 0) - (record.dailyAnchor?.net_rx || 0),
    net_tx_daily_delta: (record.totals.net_tx || 0) - (record.dailyAnchor?.net_tx || 0) }
}
export function dailyTraffic(server, direction, now = Date.now()) {
  const field = `net_${direction}_daily`
  if (valid(server[field]) && (server.traffic_daily_until ? now < server.traffic_daily_until : !server.traffic_daily_day || server.traffic_daily_day === localDay(now))) return { value: Number(server[field]) + (Number(server[`net_${direction}_daily_delta`]) || 0), partial: Boolean(server.traffic_daily_partial), since: server.traffic_daily_since }
  const observed = `net_${direction}_observed`
  return valid(server[observed]) && localDay(server.traffic_observed_since) === localDay(now)
    ? { value: Number(server[observed]), partial: true, since: server.traffic_observed_since }
    : { value: null, partial: true }
}

export function observeDailyBatch(base, previous, update, samples = [], now = Date.now()) {
  for (const sample of samples) observeDailyTraffic(base, { id: previous.id, ...sample.data, last_updated: sample.ts }, now)
  return observeDailyTraffic(base, { ...previous, ...update }, now)
}
