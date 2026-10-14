import type { Node } from '../lib/api'
import { bytes, rate, uptime, daysUntil, cpuName } from '../lib/format'
import { flag } from '../lib/flag'
import { OsIcon } from './NodeCard'

export function NodeFacts({node: n}: {node: Node}) {
  const m = n.online ? n.metrics : null
  const days = n.expires_in !== undefined ? n.expires_in : daysUntil(n.expires_at)
  const used = n.month_used ?? (n.traffic_mode === 'up' ? n.month_tx : n.traffic_mode === 'down' ? n.month_rx : n.traffic_mode === 'max' ? Math.max(n.month_rx,n.month_tx) : n.month_rx+n.month_tx)
  const stamp = (seconds: number) => Number.isFinite(seconds) && seconds > 0 ? new Date(seconds*1000).toLocaleString('zh-CN',{hour12:false}) : '—'
  const facts = [
    ['⏱','运行时间',m ? uptime(m.uptime) : '—'],
    ['📅','剩余时间',days === null ? '长期' : days < 0 ? `已过期 ${-days} 天` : `${days} 天`],
    ['▣','操作系统 / 架构',`${n.os || '—'} / ${n.arch || '—'}`],
    ['🧩','内核版本',n.kernel || '—'],
    ['🔧','CPU 信息',`${n.cpu_name ? cpuName(n.cpu_name) : '—'} × ${n.cpu_cores || '—'}`],
    ['▤','总磁盘 / 内存',`${bytes(n.disk_total || 0)} / ${bytes(n.mem_total || 0)}`],
    ['▥','负载均值',m?.load?.map(v => v.toFixed(2)).join(' ') || '—'],
    ['🌐','总流量',`↓ ${bytes(n.total_rx || 0)} / ↑ ${bytes(n.total_tx || 0)}`],
    ['⚡','实时速度',m ? `↓ ${rate(m.net_rx)} / ↑ ${rate(m.net_tx)}` : '—'],
    ['▥','月流量',`↓ ${bytes(n.month_rx || 0)} / ↑ ${bytes(n.month_tx || 0)}`],
    ['📦','月流量限制',`${bytes(used || 0)} / ${n.traffic_limit ? bytes(n.traffic_limit) : '∞'}`],
    ['◷','启动时间',m && n.last_seen > 0 ? stamp(n.last_seen - m.uptime) : '—'],
    ['⏰','最后更新',stamp(n.last_seen)],
    ['◈','Agent 版本',n.agent_version || '—'],
  ]
  return <section className="node-facts terminal-panel"><div className="facts-heading"><h2><a className="facts-back" href="#/" aria-label="返回概览" title="返回概览">←</a>{flag((n.country || '').toUpperCase())}<OsIcon os={n.os || ''}/><span>{n.name}</span></h2><span className={'status ' + (n.online ? 'green' : 'red')}>{n.online ? '● 在线' : '● 离线'}</span></div><dl className="facts-table">{facts.map(([icon,label,value]) => <div className="fact-cell" key={label}><dt><span aria-hidden="true">{icon}</span>{label}</dt><dd title={value}>{value}</dd></div>)}</dl></section>
}
