import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeMetrics, collectBatch, present, probeText, gpuInfo, bytes, priceText, HOURS, online } from '../src/utils/metrics.js'
test('incremental samples preserve report fields, with latest value per server', () => {
  const pending = new Map()
  collectBatch({ type: 'batchUpdate', updates: [{ serverId: 'a', samples: [{ ts: 10, data: { cpu: 10, disk: { read_bps: 5 }, gpu_info: [{ id: 0 }], ping_ct: null } }, { ts: 11, payload: { cpu: 20, ram_used: 128 } }, { ts: 12, metrics: { cpu: 0 } }] }, { serverId: 'other', samples: [{ data: { cpu: 99 } }] }] }, pending, new Set(['a']))
  assert.equal(pending.size, 1)
  assert.deepEqual(mergeMetrics({ name: 'Node', net_rx: 1024 }, pending.get('a')), { name: 'Node', net_rx: 1024, cpu: 0, disk: { read_bps: 5 }, gpu_info: [{ id: 0 }], ping_ct: null, ram_used: 128, last_updated: 12 })
  assert.equal(mergeMetrics({ cpu: 10 }, { cpu: undefined }).cpu, 10)
})
test('probe false/null/zero have distinct meanings', () => {
  assert.equal(present(false), false); assert.equal(present(undefined), false)
  assert.equal(present(null), true); assert.equal(present(0), true)
  assert.equal(probeText(null, '%'), 'Timeout'); assert.equal(probeText(0, '%'), '0%')
  assert.equal(probeText(false, ' ms'), '—')
})
test('units, free price, GPU history and online window', () => {
  assert.equal(bytes(1048576), '1.0 MiB')
  assert.equal(priceText('0'), 'Free'); assert.equal(priceText('-1'), 'Free'); assert.equal(priceText(''), '')
  assert.deepEqual(gpuInfo('[{"id":0,"name":"GPU","info":{}}]'), [{ id: 0, name: 'GPU', info: {} }])
  assert.deepEqual(gpuInfo('invalid'), [])
  assert.equal(online({ last_updated: 1700000000000 }, 1700000299999), true)
  assert.equal(online({ last_updated: 1700000000000 }, 1700000300000), false)
  assert.deepEqual(HOURS, [0.167, 0.5, 1, 6, 12, 24, 48, 96, 168])
})
