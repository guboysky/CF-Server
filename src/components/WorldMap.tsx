import { useEffect, useState } from 'react'
import type { Node } from '../lib/api'
import { countryCode, mapRegions, type MapFeature } from '../lib/map'
export function WorldMap({nodes,onCountry,lang}: {nodes: Node[]; onCountry: (code: string) => void; lang: string}) {
  const [features,setFeatures] = useState<MapFeature[]>([])
  const [failed,setFailed] = useState(false)
  const [zoom,setZoom] = useState(1)
  useEffect(() => { let active = true; fetch('/world.json').then(r => {if (!r.ok) throw new Error(); return r.json()}).then(d => {if(active) setFeatures(d.features)}).catch(() => {if(active) setFailed(true)}); return () => {active = false} }, [])
  const regions = mapRegions(nodes,features)
  const countries = regions.map(r=>r.code)
  const project = (p: number[]) => `${((p[0] + 180)*2).toFixed(1)},${((90-p[1])*2).toFixed(1)}`
  return <section className="terminal-panel world-map"><div className="map-toolbar"><span>{lang === 'en' ? 'NODE DISTRIBUTION / COUNTRY' : '节点分布 / 国家地区（非精确位置）'}</span><span><button aria-label="Zoom out" onClick={() => setZoom(Math.max(1,zoom-0.5))}>−</button><button aria-label="Zoom in" onClick={() => setZoom(Math.min(3,zoom+0.5))}>+</button><button onClick={() => setZoom(1)}>↺</button></span></div><div className="map-scroll"><svg viewBox="0 0 720 360" style={{width: `${zoom*100}%`}} aria-label={lang === 'en' ? 'World map' : '世界地图'}>{features.map((f,i) => {
    const code = countryCode(f.properties.iso_a2)
    const polygons = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][]
    const d = polygons.map(poly => poly.map(ring => 'M'+ring.map(project).join('L')+'Z').join('')).join('')
    return <path key={i} d={d} className={countries.includes(code) ? 'map-active' : ''} fillRule="evenodd"><title>{f.properties.name_zh || f.properties.name || code}{countries.includes(code) ? ` · ${nodes.filter(n => countryCode(n.country) === code).length}` : ''}</title></path>
  })}{regions.filter(r=>r.point).map(r=>{const p=r.point!;const x=(p[0]+180)*2,y=(90-p[1])*2;return <g key={r.code} className="map-marker" data-country={r.code} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={`${r.code} · ${r.count}`} onClick={()=>onCountry(r.code)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onCountry(r.code)}}}><title>{r.code} · {r.count}</title><circle r="5.5"/><text textAnchor="middle" dominantBaseline="central">{r.count}</text></g>})}</svg></div>{failed && <p role="alert">{lang === 'en' ? 'Map could not be loaded' : '地图加载失败'}</p>}<div className="map-countries">{countries.map(c => <button key={c} onClick={() => onCountry(c)}>{c} · {nodes.filter(n => countryCode(n.country) === c).length}{regions.find(r=>r.code===c)?.point ? '' : (lang === 'en' ? ' (unmapped)' : '（未能定位）')}</button>)}{nodes.some(n => !countryCode(n.country)) && <span>{lang === 'en' ? 'Unknown country' : '未知国家'} · {nodes.filter(n => !countryCode(n.country)).length}</span>}</div><small>{lang === 'en' ? 'Select a country, then switch to Bars or List to inspect nodes.' : '选择国家后切换条形图或列表查看节点。'}</small></section>
}
