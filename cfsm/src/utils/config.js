export const meta = name => document.querySelector(`meta[name="${name}"]`)?.content || ''
export const apiBases = [...new Set((meta('apiBase') || location.origin).split(',').map(base => new URL(base.trim(), location.origin).origin))]
export const adminUrl = base => `${base}/admin#/admin`
