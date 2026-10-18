import { reactive } from 'vue'
import { apiBases } from '../utils/config.js'
import * as api from '../utils/api.js'
import { redirectLogin } from '../utils/http.js'
import { createSocket } from '../utils/socket.js'
import { historyCadence, liveHistoryRows, mergeDetailHistory } from '../utils/detailHistory.js'
import { observeDailyTraffic, observeDailyBatch } from '../utils/dailyTraffic.js'
import { extendProbeWindows } from '../utils/probeTrend.js'
export const state = reactive({ ready: false, error: '', page: null, loading: false, detail: null, rows: [], hours: 6, historyInterval: 60000, historyLoading: false, sites: apiBases.map(base => ({ base, config: null, servers: [], stats: {}, sysConfig: {}, status: 'paused', expired: false, socket: null })) })
let generation = 0, historyGeneration = 0, historyQueue = []
export async function initialize() {
  try {
    await Promise.all(state.sites.map(async site => {
      await api.config(site)
      if (site.config.is_public !== true && site.config.authorization !== true && !localStorage.getItem('jwt_token')) {
        redirectLogin(site)
        throw new Error('Authentication required')
      }
    }))
    state.ready = true
  } catch (error) { state.error = error.message }
}
function stop() {
  for (const site of state.sites) { site.socket?.close(); site.socket = null }
}
function startSocket(site, page, epoch) {
  if (document.hidden || site.expired || epoch !== generation) return
  const detail = page.id !== undefined
  const ids = detail ? [page.id] : site.servers.map(server => server.id)
  if (!ids.length) { site.status = 'empty'; return }
  site.socket = createSocket(site, detail ? String(page.id) : 'all', ids, {
    status: status => { site.status = status },
    error: message => { state.error = `${site.base}: ${message}` },
    timeout: () => { site.expired = true },
    update: (updates, samples = new Map()) => {
      if (epoch !== generation) return
      if (detail) {
        const update = updates.get(String(page.id))
        if (!update) return
        state.detail = observeDailyBatch(site.base, state.detail, update, samples.get(String(page.id)))
        const measured = liveHistoryRows(samples.get(String(page.id)) || [])
        if (state.historyLoading) historyQueue = mergeDetailHistory(historyQueue, measured, state.hours)
        state.rows = mergeDetailHistory(state.rows, measured, state.hours)
      } else {
        // Unchanged cards retain object identity. No reactive mutation per WS sample.
        site.servers = site.servers.map(server => updates.has(String(server.id)) ? observeDailyBatch(site.base, server, extendProbeWindows(server, updates.get(String(server.id)), samples.get(String(server.id))), samples.get(String(server.id))) : server)
      }
    }
  })
}
export async function setPage(page, resume = false) {
  const epoch = ++generation
  stop()
  state.page = page
  state.error = ''
  state.loading = true
  if (!resume) { state.hours = 6; historyQueue = []; state.rows = []; state.detail = null; historyGeneration++ }
  try {
    if (page.id !== undefined) {
      const site = state.sites[page.site || 0]
      if (!site) throw new Error('Unknown site')
      const current = await api.server(site, page.id)
      if (epoch !== generation) return
      state.detail = observeDailyTraffic(site.base, current)
      // History is fetched on entering a detail route or a user range change only.
      if (!resume) await changeHours(6)
      startSocket(site, page, epoch)
    } else {
      await Promise.all(state.sites.map(async site => {
        const data = await api.servers(site, resume)
        if (epoch !== generation) return
        site.servers = (data.servers || []).map(server => observeDailyTraffic(site.base, server))
        site.stats = data.stats || {}
        site.sysConfig = data.sysConfig || {}
        startSocket(site, page, epoch)
      }))
    }
  } catch (error) { if (epoch === generation) state.error = error.message }
  finally { if (epoch === generation) state.loading = false }
}
export async function changeHours(hours) {
  const page = state.page, epoch = generation, ticket = ++historyGeneration
  if (!page?.id) return
  state.hours = hours
  state.historyLoading = true
  historyQueue = []
  try {
    const rows = await api.history(state.sites[page.site || 0], page.id, hours)
    if (epoch === generation && ticket === historyGeneration) {
      const history = Array.isArray(rows) ? rows : []
      state.historyInterval = historyCadence(history)
      state.rows = mergeDetailHistory(history, historyQueue, hours)
      historyQueue = []
    }
  } catch (error) { if (epoch === generation) state.error = error.message }
  finally { if (ticket === historyGeneration) state.historyLoading = false }
}
export function continueLive(site) {
  site.expired = false
  if (state.page?.id !== undefined && state.sites[state.page.site || 0] !== site) return
  if (!document.hidden && state.page) startSocket(site, state.page, generation)
}
export function onVisibility() {
  if (document.hidden) { ++generation; stop() }
  else if (state.ready && state.page) void setPage(state.page, true)
}
export const dispose = () => { ++generation; stop() }
