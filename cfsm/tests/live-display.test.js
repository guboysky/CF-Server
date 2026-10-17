import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sparklineBounds } from '../src/matrix/sparkline.js'
import { extendProbeWindows } from '../src/utils/probeTrend.js'
import { collectBatch } from '../src/utils/metrics.js'
import { observeDailyTraffic, observeDailyBatch, dailyTraffic, localDay } from '../src/utils/dailyTraffic.js'
test('latency scale reveals measured variation, retains flat data and excludes gaps',()=>{
 const bounds=sparklineBounds([null,false,undefined,240,241,245],true)
 assert.ok(bounds.min>230);assert.ok(bounds.max<250)
 assert.deepEqual(sparklineBounds([240,240],true),{min:238,max:242})
 assert.deepEqual(sparklineBounds([0,20]),{min:0,max:20})
 assert.deepEqual(sparklineBounds([null,false],true),{min:0,max:1})
})
test('one render flush preserves every real probe sample and does not invent missing measurements',()=>{
 const now=Date.now(),samples=[],pending=new Map()
 collectBatch({type:'batchUpdate',updates:[{serverId:'one',samples:[{ts:now-2000,data:{ping_ct:240,loss_ct:0}},{ts:now-1000,data:{ping_ct:null,loss_ct:2}},{ts:now,data:{cpu:20,ping_cu:0}}]}]},pending,new Set(['one']),(id,sample)=>samples.push(sample))
 const result=extendProbeWindows({ping:[{ts:now-7200000,ct:200},{ts:now-3000,ct:230}],loss:[]},pending.get('one'),samples,now)
 assert.deepEqual(result.ping.map(p=>p.ct),[230,240,null,undefined])
 assert.equal(result.ping.at(-1).cu,0);assert.deepEqual(result.loss.map(p=>p.ct),[0,2])
 assert.equal(result.cpu,20)
})
test('observed traffic is site scoped, survives refresh, handles resets, and rolls over at local midnight',()=>{
 const now=new Date(2026,9,17,12).getTime(),store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}
 let value=observeDailyTraffic('test-a',{id:'one',net_rx:100,net_tx:200},now,storage)
 assert.deepEqual(dailyTraffic(value,'rx',now),{value:0,partial:true,since:now})
 value=observeDailyTraffic('test-a',{id:'one',net_rx:160,net_tx:250},now+31000,storage)
 assert.equal(dailyTraffic(value,'rx',now).value,60)
 value=observeDailyTraffic('test-a',{id:'one',net_rx:10,net_tx:null},now+62000,storage)
 assert.equal(dailyTraffic(value,'rx',now).value,70);assert.equal(value.net_tx_observed,50)
 assert.equal(observeDailyTraffic('test-b',{id:'one',net_rx:999},now,storage).net_rx_observed,0)
 value=observeDailyTraffic('test-a',{id:'one',net_rx:20},now+86400000,storage)
 assert.equal(value.net_rx_observed,0)
 assert.equal(dailyTraffic({...value,net_rx_daily:123,traffic_daily_day:localDay(now)},'rx',now+86400000).value,0)
 assert.equal(dailyTraffic({...value,net_rx_daily:0},'rx',now+86400000).value,0)
})

test('backend daily totals extend through real reports, including a reset inside one flush',()=>{
 const now=Date.now(),initial={id:'two',net_rx:100,last_updated:now,net_rx_daily:50,traffic_daily_at:now,traffic_daily_day:localDay(now)}
 const before=observeDailyTraffic('backend-test',initial,now)
 const after=observeDailyBatch('backend-test',before,{net_rx:20,last_updated:now+1000},[{ts:now+100,data:{net_rx:120}},{ts:now+200,data:{net_rx:10}},{ts:now+1000,data:{net_rx:20}}],now+1000)
 assert.equal(dailyTraffic(after,'rx',now+1000).value,90)
 const stale=observeDailyTraffic('backend-test',{...after,net_rx:1,last_updated:now-1000},now+2000)
 assert.equal(dailyTraffic(stale,'rx',now+2000).value,90)
})
