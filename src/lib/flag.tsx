const flags = Object.fromEntries(Object.entries(import.meta.glob<string>('/node_modules/country-flag-icons/3x2/*.svg', {query: '?url', import: 'default', eager: true})).map(([path,url]) => [path.match(/([\w-]+)\.svg$/)![1],url]))
function CountryFlag({code}: {code: string}) {
  const normalized=normalizeCountry(code)
  const [failed,setFailed]=useState('')
  if(!normalized) return null
  return flags[normalized] && failed!==normalized ? <img className="country-flag" src={flags[normalized]} alt={normalized} onError={()=>setFailed(normalized)}/> : <span className="flag-fallback" title={normalized}>{normalized}</span>
}
export function flag(code: string) { return <CountryFlag code={code}/> }
import { useState } from 'react'
import { normalizeCountry } from './country'
