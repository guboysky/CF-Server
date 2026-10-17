import { timestamp } from './metrics.js'
import { probeNumber } from './probes.js'

export function historyCadence(rows) {
  const times = [...new Set(rows.map(row => timestamp(row.timestamp ?? row.last_updated)).filter(Boolean))].sort((a,b)=>a-b)
  const gaps = times.slice(1).map((time,i)=>time-times[i]).sort((a,b)=>a-b)
  return gaps.length ? gaps[Math.floor(gaps.length/2)] : 60000
}

export function liveHistoryRows(samples) {
  return samples.filter(sample=>sample.data && timestamp(sample.data.sample_timestamp ?? sample.ts)).map(sample=>({ ...sample.data, timestamp: sample.data.sample_timestamp ?? sample.ts }))
}

export function mergeDetailHistory(previous, incoming, hours, now = Date.now(), limit = 2000) {
  const cutoff = now - hours * 3600000, points = new Map()
  for (const row of [...previous, ...incoming]) {
    const time = timestamp(row.timestamp ?? row.last_updated)
    if (time < cutoff || time > now || !time) continue
    points.set(time, { ...points.get(time), ...row, timestamp: time })
  }
  const sorted = [...points.values()].sort((a,b)=>a.timestamp-b.timestamp)
  if (sorted.length <= limit) return sorted
  // Retain the full time range and actual extrema, rather than dropping the
  // older history after a long live session. Never synthesize measurements.
  const keep = new Set([0, sorted.length-1])
  const fields = ['cpu','ram_used','swap_used','disk_used','net_in_speed','net_out_speed','tcp_conn','udp_conn','processes',
    ...['ct','cu','cm','bd','node_1','node_2','node_3','node_4'].flatMap(key=>[`ping_${key}`,`loss_${key}`])]
  for (const field of fields) {
    let low = null, high = null
    sorted.forEach((row,index)=>{ const value=probeNumber(row[field]); if(value===null)return; if(low===null||value<Number(sorted[low][field]))low=index; if(high===null||value>Number(sorted[high][field]))high=index })
    if(low!==null)keep.add(low)
    if(high!==null)keep.add(high)
  }
  const slots = Math.max(0, limit-keep.size)
  for (let index=1; index<=slots; index++) keep.add(Math.round(index*(sorted.length-1)/(slots+1)))
  return [...keep].sort((a,b)=>a-b).slice(0,limit).map(index=>sorted[index])
}
