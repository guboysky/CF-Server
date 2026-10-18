import { probes, timestamp, mergeMetrics } from './metrics.js'
export function extendProbeWindows(previous, incoming, samples = [], now = Date.now()) {
  const next = mergeMetrics(previous, incoming)
  for (const field of ['ping', 'loss']) {
    const original = Array.isArray(incoming[field]) ? incoming[field] : Array.isArray(previous[field]) ? previous[field] : []
    const points = new Map(original.filter(point => point && typeof point === 'object').map((point, i) => [timestamp(point.ts ?? point.timestamp) || `legacy-${i}`, { ...point }]))
    for (const sample of samples) {
      const data = sample.data, time = timestamp(sample.ts)
      if (!time || !data) continue
      const values = Object.fromEntries(probes.filter(key => Object.hasOwn(data, `${field}_${key}`) && data[`${field}_${key}`] !== undefined).map(key => [key, data[`${field}_${key}`]]))
      if (Object.keys(values).length) points.set(time, { ...points.get(time), ts: time, ...values })
    }
    let values = [...points.values()].filter(point => !timestamp(point.ts ?? point.timestamp) || timestamp(point.ts ?? point.timestamp) >= now - 3600000).sort((a,b) => timestamp(a.ts ?? a.timestamp) - timestamp(b.ts ?? b.timestamp))
    // Thin only actual samples, retaining the complete hour and the newest report.
    while (values.length > 600) values = values.filter((_, i) => i % 2 === 0 || i === values.length - 1)
    next[field] = values
  }
  return next
}
