import { lazy, Suspense, useEffect, useState } from 'react'
import { api, useNodes, type Node } from './lib/api'
import { loadConfig } from './lib/config'
import { bytes, rate } from './lib/format'
import { CFCard } from './components/CFCard'
import { NodeTable } from './components/NodeTable'
import { NodeFacts } from './components/NodeFacts'
import { WorldMap } from './components/WorldMap'
import { demoNodes, demoMe } from './lib/demo'
import manifest from '../theme.json'
import { flag } from './lib/flag'
import { onlineFirst } from './lib/display'
import { countryCode } from './lib/map'
const Detail = lazy(() => import('./components/NodeDetail').then(m => ({ default: m.NodeDetail })))
const isDemo = import.meta.env.DEV && new URLSearchParams(location.search).has('demo')
const defaults = Object.fromEntries(manifest.config.map(f => [f.key, f.default]))
function stored(key: string, fallback: string) { try { return localStorage.getItem('huilang.' + key) || fallback } catch { return fallback } }
function remember(key: string, value: string) { try { localStorage.setItem('huilang.' + key, value) } catch { /* Private browsing. */ } }
type Me = {site_name: string; authed: boolean; public_page: boolean; history_days?: number}
function Live() { const stream = useNodes(); return <Dashboard {...stream} /> }
function Demo() {
  const [nodes,setNodes] = useState(demoNodes)
  useEffect(() => {
    let tick = 0
    const timer = setInterval(() => {
      tick++
      setNodes(demoNodes.map(n => !n.metrics || !n.online ? n : {...n,metrics:{...n.metrics,
        cpu:Math.max(0,Math.min(100,n.metrics.cpu + Math.sin(tick/2+n.id)*8)),
        mem_used:Math.max(0,Math.min(n.metrics.mem_total,n.metrics.mem_used + Math.sin(tick/3+n.id)*n.metrics.mem_total*.025)),
        disk_used:Math.max(0,Math.min(n.metrics.disk_total,n.metrics.disk_used + Math.sin(tick/4+n.id)*n.metrics.disk_total*.008)),
      }}))
    },2000)
    return () => clearInterval(timer)
  }, [])
  return <Dashboard nodes={nodes} error={null} closed={false}/>
}
export default function App() { return isDemo ? <Demo/> : <Live /> }
function Dashboard({nodes, error, closed}: {nodes: Node[] | null; error: string | null; closed: boolean}) {
  const [me, setMe] = useState<Me | null>(isDemo ? demoMe : null)
  const [config, setConfig] = useState<Record<string, unknown>>(defaults)
  const [view, setView] = useState(stored('view', ''))
  const [theme, setTheme] = useState(stored('theme', 'auto'))
  const [lang, setLang] = useState(stored('lang', 'zh'))
  const [mobile, setMobile] = useState(() => matchMedia('(max-width:700px)').matches)
  const [country, setCountry] = useState<string | null>(null)
  const readId = () => Number(/^#\/node\/(\d+)$/.exec(location.hash)?.[1]) || null
  const [id, setId] = useState<number | null>(readId)
  const t = (zh: string, en: string) => lang === 'en' ? en : zh
  useEffect(() => {
    const media = matchMedia('(max-width:700px)')
    const sync = () => setMobile(media.matches)
    media.addEventListener('change',sync)
    return () => media.removeEventListener('change',sync)
  }, [])
  useEffect(() => {
    if (!isDemo) { api<Me>('/me').then(setMe).catch(() => {}); loadConfig().then(setConfig) }
    const sync = () => { setId(readId()); scrollTo(0, 0) }
    addEventListener('hashchange', sync)
    return () => removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'auto' && media.matches))
    apply(); media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
  useEffect(() => {
    document.title = me?.site_name || 'Monitor · Huilang'
    const background = String(config.background_url || '')
    try { const url = new URL(background, location.origin); document.body.style.setProperty('--wallpaper', ['http:', 'https:'].includes(url.protocol) && background ? `url(${JSON.stringify(url.href)})` : 'none') } catch { document.body.style.setProperty('--wallpaper', 'none') }
    document.body.style.setProperty('--panel-opacity', String(config.panel_opacity ?? 0.78))
  }, [config, me])
  const preferred = view || String(config.layout || 'bar')
  const layout = mobile && preferred === 'map' ? 'bar' : preferred
  const list = onlineFirst(nodes || [])
  const selected = list.filter(n => country === null || countryCode(n.country) === country)
  const regions = [...new Set(list.map(n => countryCode(n.country)).filter(Boolean))].sort()
  const active = selected.filter(n => n.online)
  const sum = (field: 'total_rx' | 'total_tx' | 'month_rx' | 'month_tx') => selected.reduce((s,n) => s + (Number(n[field]) || 0),0)
  const speed = (field: 'net_rx' | 'net_tx') => active.reduce((s, n) => s + (Number(n.metrics?.[field]) || 0), 0)
  const chosen = list.find(n => n.id === id)
  const change = (key: string, value: string, setter: (value: string) => void) => { remember(key, value); setter(value) }
  return <main className="monitor-shell">
    <header className="terminal-panel">
      <div className="window-bar"><div className="window-brand"><span className="window-dots" aria-hidden="true"><i/><i/><i/></span><a className="site-title" href="#/">{me?.site_name || t('探针名称','Monitor')}</a></div><div className="toolbar">
        {<nav className="header-views" aria-label={t('显示样式','Views')}>{[['bar','条形图','Bars'],['ring','环形图','Rings'],['list','列表','List'],['map','地图','Map']].map(([key,zh,en]) => <button key={key} className={key === 'map' ? 'mobile-hidden' : undefined} aria-pressed={layout === key} onClick={() => { change('view',key,setView); if(id !== null) location.hash = '/' }}>{t(zh,en)}</button>)}</nav>}
        <button className="mobile-hidden" aria-pressed={lang === 'en'} onClick={() => change('lang','en',setLang)}>EN</button><button className="mobile-hidden" aria-pressed={lang === 'zh'} onClick={() => change('lang','zh',setLang)}>中</button>
        <button aria-label={t('切换深浅色','Toggle color mode')} onClick={() => change('theme',document.documentElement.classList.contains('dark') ? 'light' : 'dark',setTheme)}>☾</button>
      </div></div>
      {isDemo && <div className="demo-label">{t('演示预览 · 模拟数据','DEMO · Simulated data')}</div>}
      {id === null && <>
        <div className="filter-row"><button aria-pressed={country === null} onClick={() => setCountry(null)}>{t('全部','All')} {list.length}</button>{regions.map(code => <button key={code} aria-pressed={country === code} onClick={() => setCountry(country === code ? null : code)}>{flag(code)} {code} <small>{list.filter(n => countryCode(n.country) === code).length}</small></button>)}</div>
      </>}
    </header>
    {Boolean(config.notice) && <aside className="notice terminal-panel">{String(config.notice)}</aside>}
    {(error || closed) && <div className="error terminal-panel" role="alert">{error || t('需要登录后查看','Sign in to view')} {closed ? <a href="/admin">{t('登录','Sign in')} →</a> : <button onClick={() => location.reload()}>{t('重试','Retry')}</button>}</div>}
    {nodes === null && !closed && <div className="terminal-panel empty">{error ? t('等待重新连接…','Waiting for reconnection…') : '$ ' + t('正在连接探针…','Connecting to monitor…')}</div>}
    {nodes && !closed && (id !== null ? <>{chosen ? <section className="terminal-panel detail">{isDemo ? <><NodeFacts node={chosen}/><p className="empty">{t('演示模式不查询历史；连接 hub 后显示资源和延迟图表。','History charts are available after connecting to your hub.')}</p></> : <Suspense fallback={<div className="empty">{t('正在加载历史…','Loading history…')}</div>}><Detail node={chosen} historyDays={me?.history_days || 7} mobile={mobile}/></Suspense>}</section> : <div className="terminal-panel empty">{t('节点不存在或不可见','Node not found or not visible')}</div>}</> : <>
      {Boolean(config.show_summary) && <section className="summary terminal-panel"><div className="desktop-summary"><label>{t('服务器','Servers')}</label><strong className="green">{t('在线','Online')}:{active.length} <span className="muted">|</span> <span className="red">{t('离线','Offline')}:{selected.length-active.length}</span></strong></div><div className="desktop-summary"><label>{t('总流量','Total traffic')}</label><strong><span className="green">{bytes(sum('total_rx'))} ↓</span> | <span className="blue">↑ {bytes(sum('total_tx'))}</span></strong></div><div className="summary-speed"><label>{t('实时速度','Live speed')}</label><strong><span className="green">↓ {rate(speed('net_rx'))}</span> | <span className="blue">↑ {rate(speed('net_tx'))}</span></strong></div><div className="desktop-summary"><label>{t('本月流量','Monthly traffic')}</label><strong>{bytes(sum('month_rx')+sum('month_tx'))}</strong></div></section>}
      {layout === 'map' && <WorldMap nodes={selected} onCountry={setCountry} lang={lang}/>}
      {selected.length === 0 && <div className="terminal-panel empty">{t(list.length ? '没有符合筛选条件的节点' : '暂无公开节点', list.length ? 'No matching nodes' : 'No public nodes')}</div>}
      {layout === 'list' && selected.length > 0 && <NodeTable nodes={selected} lang={lang}/>}
      {layout !== 'map' && layout !== 'list' && selected.length > 0 && <section className="node-overview"><div className="node-grid">{selected.map(n => <a key={n.id} className={'node-link ' + (!n.online ? 'offline' : '')} href={`#/node/${n.id}`}><CFCard node={n} view={layout} lang={lang} showPrice={Boolean(config.show_price)} showPing={!isDemo && Boolean(config.show_latency)}/></a>)}</div></section>}
    </>)}
    <footer><a href="https://github.com/guboysky/CF-Server" target="_blank" rel="noreferrer">HUILANG THEME v{manifest.version}</a> <span>·</span> Powered by <a href="https://github.com/monitor-probe/monitor" target="_blank" rel="noreferrer">monitor</a><span className="footer-note">{t('每 2 秒实时推送','Live updates every 2s')}</span></footer>
  </main>
}
