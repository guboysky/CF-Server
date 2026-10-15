import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cardProbeValue, probeAverage, probeValueText, probeSamples, historyPercent, diskIo } from '../src/utils/probes.js'
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

test('CF resource histories use percentages and parse both disk IO payload formats', () => {
  assert.equal(historyPercent({ ram_used: 1024, ram_total: 4096 }, 'ram_used', 'ram_total'), 25)
  assert.equal(historyPercent({ disk_used: 0, disk_total: 100 }, 'disk_used', 'disk_total'), 0)
  assert.equal(historyPercent({ ram_total: 0, ram_used: 0 }, 'ram_used', 'ram_total'), 0)
  assert.equal(historyPercent({ ram_total: 100 }, 'ram_used', 'ram_total'), undefined)
  assert.deepEqual(diskIo('{"read_bps":0,"write_bps":1024}'), { read_bps: 0, write_bps: 1024 })
  assert.deepEqual(diskIo('invalid'), {})
})
