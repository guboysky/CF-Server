import { useEffect, useState } from 'react'

export function MetricRing({value, swap}: {value: number | null; swap?: number | null}) {
  const [ready,setReady] = useState(false)
  useEffect(() => {
    let second = 0
    const first = requestAnimationFrame(() => {second = requestAnimationFrame(() => setReady(true))})
    return () => {cancelAnimationFrame(first); cancelAnimationFrame(second)}
  }, [])
  const valid = typeof value === 'number' && Number.isFinite(value)
  const hasSwap = typeof swap === 'number' && Number.isFinite(swap)
  const bounded = (v: number) => Math.max(0,Math.min(100,v))
  const tone = (v: number) => v > 80 ? 'var(--orange)' : v > 50 ? 'var(--blue)' : 'var(--green)'
  return <div className="metric-ring">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle className="metric-ring-track" cx="50" cy="50" r="46" fill="none" strokeWidth="4"/>
      <circle className="metric-ring-progress" cx="50" cy="50" r="46" fill="none" strokeWidth="4" pathLength="100" strokeDasharray="100 100" transform="rotate(180 50 50)" style={{stroke:valid ? tone(value) : 'var(--meter-track)',strokeDashoffset:ready && valid ? 100-bounded(value) : 100}}/>
      {hasSwap && <><circle className="metric-ring-track" cx="50" cy="50" r="39" fill="none" strokeWidth="2"/><circle className="metric-ring-progress" cx="50" cy="50" r="39" fill="none" strokeWidth="2" pathLength="100" strokeDasharray="100 100" transform="rotate(180 50 50)" style={{stroke:tone(swap),strokeDashoffset:ready ? 100-bounded(swap) : 100}}/></>}
    </svg>
    <div className="metric-ring-value"><span>{valid ? `${value.toFixed(0)}%` : '—'}</span>{hasSwap && <small title="Swap">{swap.toFixed(0)}%</small>}</div>
  </div>
}
