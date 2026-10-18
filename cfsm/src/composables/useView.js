import { ref, computed } from 'vue'
import { state } from './useMonitor.js'
import { themeOptions, language, localeOverride, appearanceOverride } from './useTheme.js'
import { online, timestamp } from '../utils/metrics.js'
const read = key => { try { return localStorage.getItem(`cfsm-huilang:${key}`) || '' } catch { return '' } }
const save = (key, value) => { try { localStorage.setItem(`cfsm-huilang:${key}`, value) } catch {} }
const preferred = ref(read('view'))
export const mobile = ref(matchMedia('(max-width:700px)').matches)
export const country = ref('')
export const now = ref(Date.now())
export const layout = computed(() => {
  const view = preferred.value || themeOptions.value.layout
  return mobile.value && view === 'map' ? 'bar' : ['bar', 'ring', 'list', 'map'].includes(view) ? view : 'bar'
})
export function setView(value) { preferred.value = value; save('view', value) }
export function setLanguage(value) { localeOverride.value = value; save('language', value); document.documentElement.lang = value }
export function toggleAppearance() { const value = document.documentElement.classList.contains('dark') ? 'light' : 'dark'; appearanceOverride.value = value; save('appearance', value); document.documentElement.classList.toggle('dark', value === 'dark') }
localeOverride.value = read('language')
appearanceOverride.value = read('appearance')
export const region = value => typeof value === 'string' && /^[a-z]{2}$/i.test(value.trim()) ? value.trim().toUpperCase() : ''
export const nodes = computed(() => state.sites.flatMap((site, siteIndex) => site.servers.filter(server => server.is_hidden !== '1').map(server => ({ server, site, siteIndex }))).sort((a, b) => Number(online(b.server, now.value)) - Number(online(a.server, now.value))))
export const selectedNodes = computed(() => nodes.value.filter(item => !country.value || region(item.server.region) === country.value))
export const regions = computed(() => [...new Set(nodes.value.map(item => region(item.server.region)).filter(Boolean))].sort())
let deadline
export function refreshClock() {
  clearTimeout(deadline); now.value = Date.now()
  const next = [...nodes.value.map(item => timestamp(item.server.last_updated) + 300000), timestamp(state.detail?.last_updated) + 300000].filter(value => value > now.value)
  if (next.length) deadline = setTimeout(refreshClock, Math.max(1000, Math.min(...next) - now.value + 1))
}
export function clearClock() { clearTimeout(deadline) }
export const text = (zh, en, es = en) => language.value === 'zh' ? zh : language.value === 'es' ? es : en
