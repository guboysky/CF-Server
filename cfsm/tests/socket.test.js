import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSocket } from '../src/utils/socket.js'
test('socket retries exponentially, stops after six attempts, and never performs REST', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const sockets = []
  context.mock.method(globalThis, 'fetch', () => { throw new Error('REST is forbidden in socket transport') })
  globalThis.document = { hidden: false }; globalThis.location = { origin: 'https://frontend.example' }
  globalThis.localStorage = { getItem: () => 'jwt' }
  globalThis.WebSocket = class { constructor(url) { this.url = url; sockets.push(this) } close() {} send(value) { this.sent = JSON.parse(value) } }
  const connection = createSocket({ base: 'https://backend.example', config: {} }, 'one', ['one'], { status() {}, error() {}, timeout() {}, update() {} })
  assert.equal(sockets[0].url.searchParams.get('token'), 'jwt')
  assert.equal(sockets[0].url.searchParams.get('subscribe'), 'one')
  sockets[0].onopen()
  assert.deepEqual(sockets[0].sent, { type: 'subscribe', scope: 'one', ids: ['one'] })
  for (const delay of [1000, 2000, 4000, 8000, 16000, 30000]) {
    const before = sockets.length
    sockets.at(-1).onclose({ code: 1006 })
    context.mock.timers.tick(delay - 1)
    assert.equal(sockets.length, before)
    context.mock.timers.tick(1)
    assert.equal(sockets.length, before + 1)
  }
  sockets.at(-1).onclose({ code: 1006 })
  context.mock.timers.tick(1000000)
  assert.equal(sockets.length, 7)
  connection.close()
})
test('multiple backends share a single throttled render tick', context => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const sockets = [], events = []
  globalThis.document = { hidden: false }; globalThis.location = { origin: 'https://frontend.example' }
  globalThis.localStorage = { getItem: () => '' }
  globalThis.WebSocket = class { constructor() { sockets.push(this) } close() {} }
  const handlers = key => ({ status() {}, error() {}, timeout() {}, update: values => events.push([key, values.get('one').cpu]) })
  const a = createSocket({ base: 'https://a.example', config: {} }, 'all', ['one'], handlers('a'))
  const b = createSocket({ base: 'https://b.example', config: {} }, 'all', ['one'], handlers('b'))
  const message = cpu => ({ data: JSON.stringify({ type: 'batchUpdate', updates: [{ serverId: 'one', samples: [{ data: { cpu } }] }] }) })
  sockets[0].onmessage(message(10))
  context.mock.timers.tick(400)
  sockets[1].onmessage(message(20))
  context.mock.timers.tick(599)
  assert.equal(events.length, 0)
  context.mock.timers.tick(1)
  assert.deepEqual(events, [['a', 10], ['b', 20]])
  a.close(); b.close()
})
