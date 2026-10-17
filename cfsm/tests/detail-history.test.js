import { niceCeiling, tickLabel } from '../src/utils/chart.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { historyCadence, liveHistoryRows, mergeDetailHistory } from '../src/utils/detailHistory.js'
import { activityBuckets, size } from '../src/matrix/data.js'
import { rowDiskIo } from '../src/utils/probes.js'

test('detail batches keep all measured timestamps without copying stale snapshot metrics',()=>{
 const now=1700000000000
 const live=liveHistoryRows([{ts:now-1000,data:{cpu:30,ping_ct:0}},{ts:now,data:{cpu:40,loss_ct:null}}])
 const rows=mergeDetailHistory([{timestamp:now-2000,cpu:20,ram_used:1024}],live,6,now)
 assert.deepEqual(rows.map(row=>row.cpu),[20,30,40])
 assert.equal(rows[1].ram_used,undefined);assert.equal(rows[2].ping_ct,undefined)
 assert.equal(rows[1].ping_ct,0);assert.equal(rows[2].loss_ct,null)
 assert.equal(mergeDetailHistory(rows,[{timestamp:now,cpu:50}],6,now).at(-1).cpu,50)
})
test('long live sessions retain the six-hour range, real CPU/network peaks and a bounded point count',()=>{
 const now=1700000000000, rows=Array.from({length:4000},(_,i)=>({timestamp:now-21600000+i*5400,cpu:i===700?100:10,net_in_speed:i===3000?1000000:1024}))
 const compact=mergeDetailHistory([],rows,6,now)
 assert.ok(compact.length<=2000);assert.equal(compact[0].timestamp,rows[0].timestamp);assert.equal(compact.at(-1).timestamp,rows.at(-1).timestamp)
 assert.ok(compact.some(row=>row.cpu===100));assert.ok(compact.some(row=>row.net_in_speed===1000000))
 assert.ok(compact.every(row=>rows.some(original=>original.timestamp===row.timestamp)))
 assert.equal(historyCadence([{timestamp:now-360000},{timestamp:now-180000},{timestamp:now}]),180000)
})
test('coverage ends at now, leaving an offline node latest periods empty; missing quantities are not zero',()=>{
 const now=1700000000000, rows=[{timestamp:now-3600000,cpu:10},{timestamp:now-1800000,cpu:20}]
 const buckets=activityBuckets(rows,1,now,4)
 assert.deepEqual(buckets.map(bucket=>bucket.count),[1,0,1,0]);assert.equal(buckets.at(-1).end,now)
 assert.equal(size(null),'—');assert.equal(size(undefined),'—');assert.equal(size(false),'—');assert.equal(size(0),'0 B')
})
test('detail Disk IO accepts flattened CF history columns as well as live nested payloads',()=>{
 assert.deepEqual(rowDiskIo({disk_read_bps:0,disk_write_bps:2048,disk_util:null}),{read_bps:0,write_bps:2048})
 assert.deepEqual(rowDiskIo({disk:'{"read_bps":1024}',disk_read_bps:10,disk_util:20}),{read_bps:1024,util:20})
})

test('chart scales do not turn a 100% CPU peak into a 200% axis, and multiday ticks carry dates',()=>{
 assert.equal(niceCeiling(100),100);assert.equal(niceCeiling(100.000000000001),100)
 assert.equal(niceCeiling(35),50);assert.equal(niceCeiling(0),1)
 const tick={value:new Date(2026,9,17,10).getTime(),date:true}
 assert.ok(tickLabel(tick).includes('10/17'));assert.ok(tickLabel(tick).includes('10:00'))
})
