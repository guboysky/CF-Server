// Axis labels follow elapsed time, even when incoming samples cluster together.
export function timeTicks(start, end, width) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || !start || end < start) return []
  if (end === start) return [{ value: start, ratio: 0, seconds: true }]
  const span = end - start, spacing = span > 86400000 ? 120 : 85
  const intervals = Math.max(1, Math.floor(width / spacing))
  const steps = [1000, 5000, 10000, 15000, 30000, 60000, 120000, 300000, 600000, 900000, 1800000, 3600000, 7200000, 21600000, 43200000, 86400000, 172800000, 604800000]
  const step = steps.find(value => value >= span / intervals) || Math.ceil(span / intervals / 86400000) * 86400000
  const result = []
  for (let value = Math.ceil(start / step) * step; value <= end; value += step) result.push({ value, ratio: (value - start) / span, seconds: step < 60000, date: span > 86400000 })
  if (!result.length) result.push({ value: start, ratio: 0, seconds: span < 60000 })
  return result
}
