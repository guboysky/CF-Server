import { selectProbeBlocks } from '../src/utils/probes.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cardProbeValue, probeAverage, probeValueText, probeSamples, historyPercent, diskIo, hourlyProbeServer } from '../src/utils/probes.js'
import { probeTone } from '../src/utils/display.js'

test('CF window uses latest valid ping and mean measured loss, including zero', () => {
  const server = { ping_ct: 90, loss_ct: 0,
    ping: [{ ts: 1700000003, ct: null }, { ts: 1700000001, ct: 80 }, { ts: 1700000002, ct: 0 }],
    loss: [{ ts: 1700000001, ct: 0 }, { ts: 1700000002, ct: 20 }, { ts: 1700000003, ct: null }] }
  assert.equal(cardProbeValue(server, 'ping', 'ct', true), 0)
  assert.equal(cardProbeValue(server, 'loss', 'ct', true), 10)
  assert.equal(cardProbeValue(server, 'loss', 'ct', false), 0)
  assert.deepEqual(probeSamples(server, 'ping', 'ct'), [80, 0, null])
  assert.equal(probeAverage([null, undefined, false, '', 'false', NaN]), null)
  assert.equal(probeAverage([0, '2', null, false]), 1)
  assert.equal(probeValueText(0.004, true), '<0.01%')
  assert.equal(probeValueText(0.04, true), '0.04%')
  assert.equal(probeValueText(null, true), '—')
})

test('CF color thresholds distinguish measured loss from missing samples', () => {
  assert.equal(probeTone(null, true), 'absent')
  assert.equal(probeTone(null), 'bad')
  assert.deepEqual([0, 0.2, 5, 20].map(value => probeTone(value, true)), ['good', 'info', 'warn', 'bad'])
  assert.deepEqual([0, 80, 160, 240].map(value => probeTone(value)), ['good', 'info', 'warn', 'bad'])
})
test('card 1H trend clips the backend two-hour window by actual timestamps', () => {
  const now = 1700000000000
  const server = { ping: [{ ts: now - 7200000, ct: 400 }, { ts: now - 3600000, ct: 0 }, { timestamp: (now - 60000) / 1000, ct: null }], loss: [{ ts: now - 7200000, ct: 100 }, { ts: now - 60000, ct: 2 }] }
  const clipped = hourlyProbeServer(server, now)
  assert.deepEqual(probeSamples(clipped, 'ping', 'ct'), [0, null])
  assert.equal(cardProbeValue(clipped, 'loss', 'ct', true), 2)
  assert.equal(server.ping.length, 3)
})

test('CF resource histories use percentages and parse both disk IO payload formats', () => {
  assert.equal(historyPercent({ ram_used: 1024, ram_total: 4096 }, 'ram_used', 'ram_total'), 25)
  assert.equal(historyPercent({ disk_used: 0, disk_total: 100 }, 'disk_used', 'disk_total'), 0)
  assert.equal(historyPercent({ ram_total: 0, ram_used: 0 }, 'ram_used', 'ram_total'), 0)
  assert.equal(historyPercent({ ram_total: 100 }, 'ram_used', 'ram_total'), undefined)
  assert.deepEqual(diskIo('{"read_bps":0,"write_bps":1024}'), { read_bps: 0, write_bps: 1024 })
  assert.deepEqual(diskIo('invalid'), {})
})

test('paired probe blocks keep missing/timeout/zero distinct and preserve measured spikes without repeating samples',()=>{
 const points=[{time:1,value:0},{time:2,value:null},{time:3,value:false},{time:4,value:undefined},{time:5,value:20}]
 const slots=selectProbeBlocks(points)
 assert.equal(slots.length,3);assert.equal(slots.filter(p=>p.missing).length,0);assert.deepEqual(slots.map(p=>p.value),[0,null,20]);assert.deepEqual(selectProbeBlocks([]),[{missing:true}])
 const dense=Array.from({length:100},(_,i)=>({time:i+1,value:i===22?8:0}))
 const loss=selectProbeBlocks(dense,true)
 assert.equal(loss.length,20);assert.ok(loss.some(point=>point.value===8));assert.equal(new Set(loss.map(p=>p.time)).size,20);assert.ok(loss.every(point=>dense.includes(point)))
 dense[33]={time:34,value:null};assert.ok(selectProbeBlocks(dense).some(point=>point.value===null))
})
