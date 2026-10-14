import manifest from '../../theme.json'
import { api } from './api'
type Field = {key: string; type: string; default: unknown; min?: number; max?: number; options?: {value: string}[]}
export function fits(f: Field, value: unknown): boolean {
  if (f.type === 'number') return typeof value === 'number' && Number.isFinite(value) && value >= (f.min ?? -Infinity) && value <= (f.max ?? Infinity)
  if (f.type === 'select') return Boolean(f.options?.some(o => o.value === value))
  return typeof value === typeof f.default
}
export function loadConfig(): Promise<Record<string, unknown>> {
  const pick = (saved: Record<string, unknown>) => Object.fromEntries(manifest.config.map(f => [f.key, fits(f,saved[f.key]) ? saved[f.key] : f.default]))
  return api<Record<string, unknown>>(`/themes/${manifest.short}/config`).then(pick).catch(() => pick({}))
}
