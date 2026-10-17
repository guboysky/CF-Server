import { ref } from 'vue'
const mapKey = 'cfsm-matrix:map:v2'
const readMap = () => { try { return localStorage.getItem(mapKey) !== 'shown' } catch { return true } }
export const collapsed = ref(readMap())
export function toggleMap() {
  collapsed.value = !collapsed.value
  try { localStorage.setItem(mapKey, collapsed.value ? 'hidden' : 'shown') } catch {}
}
