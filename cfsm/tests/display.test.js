import { test } from 'node:test'
import assert from 'node:assert/strict'
import { traffic, probeWindow, loadValues, billing, probeTone, uptimeDays, uptimeText, expiryDate } from '../src/utils/display.js'
import { probeText, timestamp, probeLabel } from '../src/utils/metrics.js'
import { timeTicks } from '../src/utils/chart.js'
test('traffic quota is in GiB, monthly counters and calculation mode are respected', () => {
  const server = { traffic_limit: 2, net_rx: 100e9, net_tx: 100e9, net_rx_monthly: 1024 ** 3, net_tx_monthly: 0 }
  assert.equal(traffic(server).percentage, 50)
  assert.equal(traffic({ ...server, traffic_calc_type: 'ul' }).percentage, 0)
  assert.equal(traffic({ ...server, traffic_calc_type: 'max' }).percentage, 50)
  assert.equal(traffic({ net_rx: 1024, net_tx: 2048 }).used, 3072)
  assert.equal(traffic({ traffic_limit: 0 }).limit, 0)
})
test('probe windows keep absent and timeout buckets, including zero measurements', () => {
  const server = { ping: [{ ct: false }, { ct: null }, { ct: 0, cu: 10 }, { cm: 0 }] }
  assert.deepEqual(probeWindow(server, 'ping', 'ct'), [false, null, 0, undefined])
  assert.deepEqual(probeWindow(server, 'ping', 'cu'), [undefined, undefined, 10, undefined])
  assert.deepEqual(probeWindow(server, 'ping', 'cm'), [undefined, undefined, undefined, 0])
  assert.equal(probeTone(false), 'absent'); assert.equal(probeTone(null), 'bad')
  assert.equal(probeTone(0, true), 'good')
})
test('uptime, pricing and load render only provided information', () => {
  assert.equal(billing({ price: '0' }, 'zh'), '免费')
  assert.equal(billing({ price: '-1' }, 'en'), 'Free')
  assert.equal(billing({ price: '' }, 'zh'), '')
  assert.equal(billing({ price: '33.15', currency: '$', billing_cycle: 'month' }, 'zh'), '$33.15 / 月')
  assert.deepEqual(loadValues('0.07, 0.03, 0.00'), [0.07, 0.03, 0])
  assert.equal(uptimeDays(undefined), null)
  assert.equal(timestamp('1700000000'), 1700000000000)
  assert.equal(timestamp('1700000000000'), 1700000000000)
  assert.equal(uptimeDays('1700000000', 1700000000000 + 5 * 86400000), 5)
  assert.equal(probeText(20.3333333333333, ' ms'), '20.3 ms')
  assert.equal(uptimeText(1700000000000, 1700000000000 + 3 * 3600000), '3小时0分')
  assert.equal(uptimeText(1700000000000, 1700000000000 + 3 * 86400000 + 3660000), '3天1小时1分')
  assert.equal(uptimeText(undefined), '—')
  assert.equal(expiryDate(new Date(2026, 10, 1).getTime()), '2026.11.1')
  assert.equal(expiryDate(undefined), '—')
})

test('probe names prefer configured names and translate default carrier codes', () => {
  assert.equal(probeLabel({ default_language: 'zh', custom_ct_name: 'CT' }, 'ct'), '电信')
  assert.equal(probeLabel({ default_language: 'zh', custom_ct_name: '广东电信' }, 'ct'), '广东电信')
  assert.equal(probeLabel({ default_language: 'en' }, 'cu'), 'CU')
  assert.equal(probeLabel({ default_language: 'zh', node_1_name: '香港腾讯' }, 'node_1'), '香港腾讯')
})

test('time ticks stay spaced independently of clustered samples', () => {
  const start = 1700000000000, end = start + 600000, width = 1200
  const ticks = timeTicks(start, end, width)
  assert.ok(ticks.length > 3)
  for (let index = 1; index < ticks.length; index++) assert.ok((ticks[index].ratio - ticks[index - 1].ratio) * width >= 85)
  assert.ok(ticks.every(tick => tick.value >= start && tick.value <= end))
  assert.ok(timeTicks(start, start + 20000, 280).every(tick => tick.seconds))
  assert.deepEqual(timeTicks(undefined, undefined, 300), [])
})
