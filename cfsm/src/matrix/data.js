import { bytes, online, percent, timestamp } from '../utils/metrics.js'
import { probeNumber } from '../utils/probes.js'
export const number = probeNumber
export const memory = value => bytes(number(value) === null ? undefined : Number(value) * 1048576).replace('iB', 'B')
export const size = value => bytes(number(value)===null?undefined:Number(value)).replace('iB', 'B')
export const ratio = (used, total) => number(used) === null || !(Number(total) > 0) ? null : percent(used, total)
export const percentage = value => number(value) === null ? '—' : `${Number(value).toFixed(value > 0 && value < 1 ? 1 : 0)}%`
export const average = values => { const valid = values.map(number).filter(value => value !== null); return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null }
export const maximum = values => { const valid = values.map(number).filter(value => value !== null); return valid.length ? Math.max(...valid) : null }
export const minimum = values => { const valid = values.map(number).filter(value => value !== null); return valid.length ? Math.min(...valid) : null }
export const running = (server, now = Date.now()) => timestamp(server.last_updated) > 0 && online(server, now)
export function uptime(server, now = Date.now()) {
  const start = timestamp(server.boot_time)
  if (!start || start > now) return '—'
  const hours = Math.floor((now - start) / 3600000), days = Math.floor(hours / 24)
  return `${days ? `${days} 天 ` : ''}${hours % 24} 小时`
}
export const virtualization = server => server.virtualization || server.virtualization_type || server.virt || '—'
export const dateText = value => timestamp(value) ? new Date(timestamp(value)).toLocaleDateString('sv-SE') : '—'
export const rowTime = row => timestamp(row.timestamp ?? row.last_updated)
export const colors = ['#51af62', '#28a3d1', '#c59b39', '#9775c9', '#df7c76', '#4fa4a2', '#6e8fc7', '#b88e64']
export function monthlyPrice(server) {
  const value = number(server.price)
  const months = { month: 1, quarter: 3, half_year: 6, year: 12, two_years: 24, three_years: 36, four_years: 48, five_years: 60 }
  return value === null || !months[server.billing_cycle] ? null : value / months[server.billing_cycle]
}
export function counterDifference(rows, field) {
  const valid = rows.map(row => number(row[field])).filter(value => value !== null)
  if (valid.length < 2) return null
  let sum = 0
  for (let index = 1; index < valid.length; index++) sum += valid[index] >= valid[index - 1] ? valid[index] - valid[index - 1] : valid[index]
  return sum
}
export function activityBuckets(rows, hours, now = Date.now(), count = 24) {
  const last = now, start = last - hours * 3600000, width = hours * 3600000 / count
  return Array.from({ length: count }, (_, index) => {
    const begin = start + index * width, end = begin + width
    const samples = rows.filter(row => rowTime(row) >= begin && (index === count - 1 ? rowTime(row) <= end : rowTime(row) < end))
    return { begin, end, count: samples.length, cpu: average(samples.map(row => row.cpu)), peak: maximum(samples.map(row => row.cpu)), ram: average(samples.map(row => row.ram_used)), rx: average(samples.map(row => row.net_in_speed)), tx: average(samples.map(row => row.net_out_speed)) }
  })
}

export function trafficComposition(rows, server) {
  const windowReady = rows.length>1 && number(rows[0].net_rx)!==null && number(rows[0].net_tx)!==null
  const candidates = [
    ['window','当前窗口流量构成',windowReady?counterDifference(rows,'net_rx'):null,windowReady?counterDifference(rows,'net_tx'):null],
    ['monthly','本月流量构成',number(server.net_rx_monthly),number(server.net_tx_monthly)],
    ['total','累计流量构成',number(server.net_rx),number(server.net_tx)]
  ]
  const [source,title,rx,tx] = candidates.find(([, ,rx,tx])=>rx!==null&&tx!==null) || ['missing','上下行流量构成',null,null]
  const total=rx===null||tx===null?null:rx+tx
  return { source,title,rx,tx,value:total>0?rx/total*100:null,label:total===null?'暂无流量数据':total===0?'暂无流量':'下行占比' }
}

export function monthlyTransfers(items) {
 const ranked=items.map((item,index)=>{const rx=number(item.server.net_rx_monthly),tx=number(item.server.net_tx_monthly);return {...item,index,rx,tx,total:rx===null||tx===null?null:rx+tx}}).filter(item=>item.total!==null).sort((a,b)=>b.total-a.total||a.index-b.index)
 return {ranked,count:ranked.length,rx:ranked.reduce((sum,item)=>sum+item.rx,0),tx:ranked.reduce((sum,item)=>sum+item.tx,0),total:ranked.length?ranked.reduce((sum,item)=>sum+item.total,0):null}
}
