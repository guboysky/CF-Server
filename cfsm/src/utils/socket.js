import { collectBatch } from './metrics.js'
// Share one render tick across all backends, including staggered WS messages.
const scheduled = new Set()
let batchTimer
function schedule(flush) {
  scheduled.add(flush)
  if (!batchTimer) batchTimer = setTimeout(() => {
    batchTimer = null
    const callbacks = [...scheduled]
    scheduled.clear()
    callbacks.forEach(callback => callback())
  }, 1000)
}
function unschedule(flush) {
  scheduled.delete(flush)
  if (!scheduled.size) { clearTimeout(batchTimer); batchTimer = null }
}
// One lifetime budget across reconnects; only explicit Continue grants a new budget.
export function createSocket(site, scope, ids, handlers) {
  let socket, retryTimer, lifetimeTimer
  let stopped = false, attempts = 0, expired = false
  const pending = new Map(), allowed = new Set(ids.map(String))
  const minutes = Number(site.config.frontend_ws_timeout_minutes) || 0
  const flush = () => {
    if (!stopped && pending.size) { handlers.update(new Map(pending)); pending.clear() }
  }
  const connect = () => {
    if (stopped || expired || document.hidden) return
    const url = new URL('/api/ws', site.base)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.searchParams.set('subscribe', scope)
    const token = localStorage.getItem('jwt_token')
    if (site.base !== location.origin && token) url.searchParams.set('token', token)
    socket = new WebSocket(url)
    socket.onopen = () => {
      if (stopped) { socket.close(); return }
      socket.send(JSON.stringify({ type: 'subscribe', scope, ids }))
      handlers.status('live')
    }
    socket.onmessage = event => {
      if (stopped) return
      try {
        const message = JSON.parse(event.data)
        collectBatch(message, pending, allowed)
        if (pending.size) schedule(flush)
      } catch (error) { handlers.error(error.message) }
    }
    socket.onerror = () => socket.close()
    socket.onclose = event => {
      if (stopped) return
      handlers.status('disconnected')
      if ([1008, 4001, 4003, 4401, 4403].includes(event.code)) {
        stopped = true
        handlers.error(`WebSocket authentication rejected (${event.code})`)
        return
      }
      if (attempts >= 6) { handlers.error('WebSocket reconnect limit reached'); return }
      retryTimer = setTimeout(connect, Math.min(30000, 1000 * 2 ** attempts++))
    }
  }
  function close() {
    stopped = true
    clearTimeout(retryTimer); clearTimeout(lifetimeTimer); unschedule(flush)
    pending.clear()
    socket?.close()
    handlers.status('paused')
  }
  if (minutes > 0) lifetimeTimer = setTimeout(() => { expired = true; close(); handlers.timeout() }, minutes * 60000)
  connect()
  return { close }
}
