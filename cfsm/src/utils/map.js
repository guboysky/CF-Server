export { normalizeCountry as countryCode } from './country.js'
import { normalizeCountry as countryCode } from './country.js'
// Representative region positions, independent of combined country outlines.
const REGIONS = {HK:[114.16,22.31],MO:[113.54,22.20],TW:[120.96,23.69],SG:[103.81,1.35]}
function pointOf(features) {
  let largest = 0, point = null
  for(const f of features) {
    const polygons = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates)
    for(const polygon of polygons) {
      const ring = polygon[0] || []
      let area = 0, x = 0, y = 0
      for(let i=0;i<ring.length;i++) {
        const a=ring[i], b=ring[(i+1)%ring.length]
        const cross=a[0]*b[1]-b[0]*a[1]
        area+=cross; x+=(a[0]+b[0])*cross; y+=(a[1]+b[1])*cross
      }
      if(Math.abs(area)>largest) {largest=Math.abs(area); point=[x/(3*area),y/(3*area)]}
    }
  }
  return point && point.every(Number.isFinite) ? point : null
}
export function mapRegions(nodes,features) {
  const counts = new Map()
  for(const node of nodes) {const code=countryCode(node.country); if(code) counts.set(code,(counts.get(code)||0)+1)}
  return [...counts].map(([code,count]) => ({code,count,point:REGIONS[code] || pointOf(features.filter(f=>countryCode(f.properties.iso_a2)===code))}))
}
