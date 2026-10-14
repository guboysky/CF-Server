import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
type Ping = {task_id: number; ts: number; latency: number | null; loss?: number}
type History = {ping: Ping[]; probes: Record<string,string>; loss?: Record<string,number>}
let running = 0
const waiting: (() => void)[] = []
function slot() { return new Promise<void>(resolve => {const enter = () => {running++; resolve()}; if(running < 2) enter(); else waiting.push(enter)}) }
function release() {running--; waiting.shift()?.()}
export function PingStrip({id,lang}: {id: number; lang: string}) {
  const root = useRef<HTMLDivElement>(null)
  const [data,setData] = useState<History | null>(null)
  const [failed,setFailed] = useState(false)
  useEffect(() => {
    let alive = true, visible = false, busy = false
    const load = async () => {
      if(!alive || !visible || busy || document.hidden) return
      busy = true; await slot()
      try {if(!alive || !visible || document.hidden) return; const next = await api<History>(`/nodes/${id}/metrics?hours=1&points=60&series=ping`); if(alive) {setData(next); setFailed(false)}} catch {if(alive) setFailed(true)} finally {busy = false; release()}
    }
    const observer = new IntersectionObserver(entries => {visible = entries[0].isIntersecting; if(visible) void load()})
    if(root.current) observer.observe(root.current)
    const interval = setInterval(() => void load(),60000)
    const resume = () => {if(!document.hidden) void load()}
    document.addEventListener('visibilitychange',resume)
    return () => {alive = false; observer.disconnect(); clearInterval(interval); document.removeEventListener('visibilitychange',resume)}
  }, [id])
  const ids = [...new Set((data?.ping || []).map(p => p.task_id))]
  return <div ref={root} className="ping-strips">{!data ? <small>{failed ? (lang === 'en' ? 'Latency unavailable' : '延迟数据暂不可用') : (lang === 'en' ? 'Loading latency…' : '正在读取延迟…')}</small> : ids.length === 0 ? <small>{lang === 'en' ? 'No latency probes configured' : '暂无延迟监控'}</small> : ids.map(task => {
    const points = data.ping.filter(p => p.task_id === task).slice(-15)
    const last = points.at(-1)
    return <div className="ping-probe" key={task}><div className="ping-caption"><div><span>{data.probes?.[String(task)] || `Probe ${task}`}</span><span className="green">{last?.latency == null ? '—' : `${last.latency.toFixed(0)}ms`}</span></div><span className="blue">{(data.loss?.[String(task)] || 0).toFixed(1)}% {lang === 'en' ? 'loss' : '丢包'}</span></div><div className="ping-row"><div className="ping-blocks" aria-label={lang === 'en' ? 'Latency history' : '延迟记录'}>{points.map((p,i) => <i key={i} title={`${new Date(p.ts*1000).toLocaleString()}: ${p.latency == null ? 'timeout' : p.latency + 'ms'}`} style={{background:p.latency == null ? 'var(--red)' : p.latency > 200 ? 'var(--orange)' : p.latency > 100 ? 'var(--blue)' : 'var(--green)'}}/>)}</div><div className="ping-blocks" aria-label={lang === 'en' ? 'Packet loss history' : '丢包记录'}>{points.map((p,i) => {const loss = p.loss ?? (p.latency == null ? 100 : 0); return <i key={i} title={`${new Date(p.ts*1000).toLocaleString()}: ${loss}% ${lang === 'en' ? 'loss' : '丢包'}`} style={{background:loss >= 100 ? 'var(--red)' : loss > 0 ? 'var(--orange)' : 'var(--green)'}}/>})}</div></div></div>
  })}</div>
}
