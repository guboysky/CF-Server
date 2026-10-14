import type { Node } from '../lib/api'
import { bytes, rate, money, cycle, daysUntil, sinceSeen, uptime } from '../lib/format'
import { flag } from '../lib/flag'
import { PingStrip } from './PingStrip'
import { OsIcon } from './NodeCard'
import { MetricRing } from './MetricRing'
export function CFCard({node: n, view, lang, showPrice, showPing = false}: {node: Node; view: string; lang: string; showPrice: boolean; showPing?: boolean}) {
  const m = n.online ? n.metrics : null
  const t = (zh: string,en: string) => lang === 'en' ? en : zh
  const pct = (used: number | undefined,total: number | undefined) => typeof used === 'number' && typeof total === 'number' && total > 0 ? used / total * 100 : null
  const usage = n.month_used ?? (n.traffic_mode === 'up' ? n.month_tx : n.traffic_mode === 'down' ? n.month_rx : n.traffic_mode === 'max' ? Math.max(n.month_rx,n.month_tx) : n.month_rx + n.month_tx)
  const days = n.expires_in !== undefined ? n.expires_in : daysUntil(n.expires_at)
  const meters: [string,number | null,string][] = [['CPU',m?.cpu ?? null, `${n.cpu_cores || '—'} ${t('核心','cores')}`],['RAM',pct(m?.mem_used,m?.mem_total),m ? `${bytes(m.mem_used)} / ${bytes(m.mem_total)}` : '—'],['DISK',pct(m?.disk_used,m?.disk_total),m ? `${bytes(m.disk_used)} / ${bytes(m.disk_total)}` : '—'],['USE',pct(usage,n.traffic_limit),`${bytes(usage || 0)} / ${n.traffic_limit ? bytes(n.traffic_limit) : '∞'}`]]
  return <article className={'cf-card terminal-panel view-' + view}>
    <div className="card-heading"><strong><span>{flag((n.country || '').toUpperCase())}</span><OsIcon os={n.os || ''}/>{n.name}</strong><span className={'status ' + (n.online ? 'green' : 'red')}>{n.online ? t('在线','Online') : t('离线','Offline')}</span></div>
    <div className="card-meta"><span>{showPrice ? `💰 ${n.price ? money(n.price,n.currency) + ' / ' + cycle(n.billing_cycle) : t('免费','Free')}` : (n.os || 'Linux')}</span><span title={n.expires_at || ''}>📅 {days === null ? t('长期','No expiry') : days < 0 ? t(`已过期 ${-days} 天`, `Expired ${-days}d`) : t(`${days} 天`, `${days} days`)}</span><span className="tags">{n.virt && !['unknown','none','n/a','-'].includes(n.virt.trim().toLowerCase()) && <b className="tag-virt">{n.virt}</b>}{n.country && <b className="tag-country">{n.country}</b>}<b className="tag-arch">{n.arch || '—'}</b></span></div>
    {view === 'ring' ? <div className="rings">{meters.slice(0,3).map(([label,value,description]) => <div key={label}><MetricRing value={value} swap={label === 'RAM' ? pct(m?.swap_used,m?.swap_total) : undefined}/><strong>{label}</strong><small>{description}</small></div>)}</div> : <div className="meters">{meters.map(([label,value,description]) => <div className="meter-line" key={label} title={description}><label>{label}</label><div className="meter-track"><i style={{width: `${Math.max(0,Math.min(100,value || 0))}%`,background: value !== null && value > 80 ? 'var(--orange)' : label === 'CPU' ? 'var(--blue)' : 'var(--green)'}}/></div><span>{value === null ? '—' : `${value.toFixed(2)}%`}</span></div>)}</div>}
    <div className="stat-line"><label>{t('负载','LOAD')}</label><span>{m?.load?.map(v => v.toFixed(2)).join(' ') || '—'}</span></div>
    <div className="stat-line"><label>{t('网速','NET')}</label><span className="green">▼ {m ? rate(m.net_rx) : '—'} <span className="blue">▲ {m ? rate(m.net_tx) : '—'}</span></span></div>
    <div className="stat-line"><label>{t('流量','TRF')}</label><span className="green">▼ {bytes(n.total_rx || 0)} <span className="blue">▲ {bytes(n.total_tx || 0)}</span></span></div>
    <div className="card-bottom"><span>{n.online ? m ? t('运行 ','Up ') + uptime(m.uptime) : t('等待上报 · 指标不可用','Awaiting report · Metrics unavailable') : t('离线 ','Offline ') + (n.last_seen_ago === null ? t('从未上报','Never reported') : uptime(sinceSeen(n)))}</span><span>TCP {m?.tcp ?? '—'} / UDP {m?.udp ?? '—'}</span></div>
    {'public_remark' in n && n.public_remark ? <div className="public-remark">{String(n.public_remark)}</div> : null}
    {showPing && view !== 'list' && <PingStrip id={n.id} lang={lang}/>}
  </article>
}
