import assert from 'node:assert/strict'
import { onlineFirst, latencyPoints } from './display.ts'
const snapshot = [{id:1,online:false},{id:2,online:true},{id:3,online:false},{id:4,online:true}]
assert.deepEqual(onlineFirst(snapshot).map(n=>n.id),[2,4,1,3])
assert.deepEqual(snapshot.map(n=>n.id),[1,2,3,4])
assert.deepEqual(onlineFirst([]),[])
for(const width of [320,390,1280,1920,3840,NaN]) {
  const short = latencyPoints(width,6,false)
  const week = latencyPoints(width,168,false)
  assert.ok(week >= 90 && week <= 200)
  assert.ok(short >= week && short <= 360)
  assert.equal(latencyPoints(width,168,true),1440)
}
assert.equal(latencyPoints(1920,168,false),197)
console.log('stable online-first order and readable latency budgets verified')
