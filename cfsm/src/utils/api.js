import { request } from './http.js'
import { HOURS } from './metrics.js'
export const config = site => site.configPromise ??= request(site, '/api/config', { bootstrap: true }).then(data => (site.config = data))
export function servers(site, resume = false) {
  if (!site.serversPromise || resume) site.serversPromise = request(site, '/api/servers')
  return site.serversPromise
}
export const server = (site, id) => request(site, `/api/server?id=${encodeURIComponent(id)}`)
export function history(site, id, hours) {
  if (!HOURS.includes(hours)) throw new Error('Invalid history range')
  return request(site, `/api/history/all?id=${encodeURIComponent(id)}&hours=${hours}`)
}
export function saveOptions(site, options) {
  if (!options || Array.isArray(options) || typeof options !== 'object') throw new Error('invalidThemeOptionsFormat')
  return request(site, '/api/theme_options', { method: 'POST', body: { theme_options: options } })
}
