import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mapRegions, countryCode } from '../src/utils/map.js'
test('bundled world geometry has distinct accurate representative country positions', () => {
 const features = JSON.parse(readFileSync(new URL('../src/assets/world.json',import.meta.url),'utf8')).features
 const codes=['CH','FR','HK','MO','TW','CN','SG','JP','US','AU','DE','CA']
 const regions=mapRegions([...codes.map(country=>({country})),{country:' hk '}],features)
 for(const code of codes) { const r=regions.find(r=>r.code===code); assert.ok(r.point && r.point.every(Number.isFinite),code); assert.equal(r.count,code==='HK'?2:1) }
 assert.equal(countryCode(' ch '),'CH'); assert.equal(countryCode('unknown'),'')
 assert.notDeepEqual(regions.find(r=>r.code==='HK').point,regions.find(r=>r.code==='CN').point)
 assert.ok(regions.find(r=>r.code==='CH').point[0] > 5 && regions.find(r=>r.code==='CH').point[0] < 11)
})
