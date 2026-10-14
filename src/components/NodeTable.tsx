import type { Node } from '../lib/api'
import { rate, sinceSeen, bytes } from '../lib/format'
import { flag } from '../lib/flag'
import { OsIcon } from './NodeCard'
import { normalizeCountry } from '../lib/country'

function Meter({value, title}: {value: number | null; title?: string}) {
  const valid = value !== null && Number.isFinite(value)
  return <div className="table-meter" title={title}><span className="meter-track"><i style={{width: `${valid ? Math.max(0,Math.min(100,value)) : 0}%`,background: valid && value > 80 ? 'var(--orange)' : valid && value > 50 ? 'var(--blue)' : 'var(--green)'}}/></span><span>{valid ? `${value.toFixed(1)}%` : '—'}</span></div>
}
export function NodeTable({nodes,lang}: {nodes: Node[]; lang: string}) {
  const en = lang === 'en'
  const ratio = (used?: number,total?: number) => typeof used === 'number' && typeof total === 'number' && total > 0 ? used/total*100 : null
  const age = (node: Node) => {
    if(node.last_seen_ago === null || (node.last_seen_ago === undefined && !node.last_seen)) return en ? 'Never' : '从未上报'
    const seconds = Math.max(0,Math.floor(sinceSeen(node)))
    if(seconds < 60) return en ? `${seconds}s ago` : `${seconds}秒前`
    if(seconds < 3600) return en ? `${Math.floor(seconds/60)}m ago` : `${Math.floor(seconds/60)}分钟前`
    if(seconds < 86400) return en ? `${Math.floor(seconds/3600)}h ago` : `${Math.floor(seconds/3600)}小时前`
    return en ? `${Math.floor(seconds/86400)}d ago` : `${Math.floor(seconds/86400)}天前`
  }
  return <div className="terminal-panel table-scroll" role="region" aria-label={en ? 'Node list' : '节点列表'} tabIndex={0}><table className="node-table"><colgroup><col className="col-status"/><col className="col-name"/><col className="col-country"/><col className="col-system"/>{Array.from({length:4},(_,i) => <col className="col-meter" key={i}/>)}<col className="col-connections"/><col className="col-speed"/><col className="col-speed"/><col className="col-age"/></colgroup><thead><tr>{['',en?'Hostname':'主机名',en?'Region':'地区代码',en?'OS / Arch':'系统/架构','CPU',en?'Memory':'内存',en?'Disk':'磁盘',en?'Usage':'用量','TCP/UDP',en?'Download':'下载',en?'Upload':'上传',en?'Updated':'更新'].map((label,i) => <th key={i} scope="col">{label || <span className="sr-only">{en?'Status':'状态'}</span>}</th>)}</tr></thead><tbody>{nodes.map(n => {
    const m = n.online ? n.metrics : null
    const usage = n.month_used ?? (n.traffic_mode === 'up' ? n.month_tx : n.traffic_mode === 'down' ? n.month_rx : n.traffic_mode === 'max' ? Math.max(n.month_rx,n.month_tx) : n.month_rx + n.month_tx)
    return <tr key={n.id} onClick={e => {if(!(e.target as HTMLElement).closest('a')) location.hash = `/node/${n.id}`}}>
      <td><span className={'table-status ' + (n.online ? 'is-online' : 'is-offline')} aria-label={n.online ? (en?'Online':'在线') : (en?'Offline':'离线')} title={n.online ? (en?'Online':'在线') : (en?'Offline':'离线')}/></td>
      <td><a className="table-node-name" href={`#/node/${n.id}`} title={n.name}>{n.name}</a></td>
      <td><span className="table-country" title={normalizeCountry(n.country) ? undefined : (en ? 'The hub has not identified this region. Set it in Admin.' : '探针尚未识别地区，可在后台节点设置中手动指定')}>{flag(n.country)} {normalizeCountry(n.country) || (en ? 'Unknown' : '未知地区')}</span></td>
      <td><span className="table-system" title={`${n.os || '—'} / ${n.arch || '—'}`}><OsIcon os={n.os || ''}/><span>{n.os || '—'} / {n.arch || '—'}</span></span></td>
      <td><Meter value={m?.cpu ?? null}/></td><td><Meter value={ratio(m?.mem_used,m?.mem_total)} title={m ? `${bytes(m.mem_used)} / ${bytes(m.mem_total)}` : undefined}/></td><td><Meter value={ratio(m?.disk_used,m?.disk_total)} title={m ? `${bytes(m.disk_used)} / ${bytes(m.disk_total)}` : undefined}/></td><td><Meter value={ratio(usage,n.traffic_limit)} title={`${bytes(usage || 0)} / ${n.traffic_limit ? bytes(n.traffic_limit) : '∞'}`}/></td>
      <td>{m ? `${m.tcp} / ${m.udp}` : '—'}</td><td>{m ? rate(m.net_rx) : '—'}</td><td>{m ? rate(m.net_tx) : '—'}</td><td>{age(n)}</td>
    </tr>
  })}</tbody></table></div>
}
