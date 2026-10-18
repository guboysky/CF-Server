import { reactive } from 'vue'
import { adminUrl } from './config.js'
export const verification = reactive({ queue: [] })
const challenges = new Map()
const tokenKey = site => `cfsm:turnstile:${site.base}`
export const verifiedToken = site => localStorage.getItem(tokenKey(site)) || (site.base === location.origin ? localStorage.getItem('turnstile_verified') : '')
export function clearVerification(site) {
  localStorage.removeItem(tokenKey(site))
  if (site.base === location.origin) localStorage.removeItem('turnstile_verified')
  site.turnstileToken = ''
}
export function challenge(site) {
  if (challenges.has(site.base)) return challenges.get(site.base)
  const promise = new Promise((resolve, reject) => verification.queue.push({ site, resolve, reject }))
  challenges.set(site.base, promise)
  return promise.finally(() => challenges.delete(site.base))
}
export function completeChallenge(token) {
  const item = verification.queue.shift()
  if (!item) return
  item.site.turnstileToken = token
  item.resolve()
}
export function cancelChallenge() {
  verification.queue.shift()?.reject(new Error('Turnstile verification cancelled'))
}
export function redirectLogin(site) {
  localStorage.removeItem('jwt_token')
  location.assign(adminUrl(site.base))
}
// All data requests pass here; only a failed 403 request can be retried once.
export async function request(site, path, { method = 'GET', body, bootstrap = false, retried = false } = {}) {
  const enabled = !bootstrap && site.config?.turnstile_enabled === true
  const headers = { Accept: 'application/json' }
  const jwt = localStorage.getItem('jwt_token')
  if (jwt) headers.Authorization = `Bearer ${jwt}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (enabled) {
    const verified = verifiedToken(site)
    if (verified) headers['X-Turnstile-Verified'] = verified
    else {
      if (!site.turnstileToken) await challenge(site)
      headers['X-Turnstile-Token'] = site.turnstileToken
    }
  }
  const response = await fetch(`${site.base}${path}`, { method, headers, credentials: 'include', signal: AbortSignal.timeout(20000), body: body === undefined ? undefined : JSON.stringify(body) })
  if (response.status === 401) { redirectLogin(site); throw new Error('Unauthorized') }
  if (response.status === 403 && enabled) {
    clearVerification(site)
    if (!retried) {
      await challenge(site)
      return request(site, path, { method, body, retried: true })
    }
  }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${path}`)
  const data = await response.json()
  if ((enabled || (bootstrap && data?.turnstile_enabled === true)) && data?.turnstile_verified) {
    localStorage.setItem(tokenKey(site), data.turnstile_verified)
    if (site.base === location.origin) localStorage.setItem('turnstile_verified', data.turnstile_verified)
    site.turnstileToken = ''
  }
  if (enabled && headers['X-Turnstile-Token'] && !data?.turnstile_verified) {
    site.turnstileToken = ''
    throw new Error('Backend did not return turnstile_verified. Apply the documented backend compatibility patch before enabling Turnstile.')
  }
  return data
}
