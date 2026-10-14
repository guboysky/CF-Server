import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mapRegions, countryCode, type MapFeature } from './map.ts'
const features = JSON.parse(readFileSync(new URL('../../public/world.json',import.meta.url),'utf8')).features as MapFeature[]
const codes=['CH','FR','HK','MO','TW','CN','SG','JP','US','AU','DE','CA']
const regions=mapRegions([...codes.map(country=>({country})),{country:' hk '}],features)
for(const code of codes) {
  const region=regions.find(r=>r.code===code)!
  assert.ok(region.point && region.point.every(Number.isFinite),`Missing map location: ${code}`)
  assert.equal(region.count,code==='HK'?2:1)
}
assert.equal(countryCode(' ch '),'CH')
assert.equal(countryCode('unknown'),'')
assert.notDeepEqual(regions.find(r=>r.code==='HK')!.point,regions.find(r=>r.code==='CN')!.point)
assert.ok(regions.find(r=>r.code==='CH')!.point![0] > 5 && regions.find(r=>r.code==='CH')!.point![0] < 11)
assert.ok(regions.find(r=>r.code==='FR')!.point![0] > -5 && regions.find(r=>r.code==='FR')!.point![0] < 9)
console.log('map regions and node counts verified, including HK/MO/TW/CH/FR')
