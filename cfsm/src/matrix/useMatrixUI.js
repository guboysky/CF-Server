import { ref } from 'vue'
const readMap = () => { try { return localStorage.getItem('cfsm-matrix:map') === 'hidden' } catch { return false } }
export const collapsed = ref(readMap())
export function toggleMap() {
  collapsed.value = !collapsed.value
  try { localStorage.setItem('cfsm-matrix:map', collapsed.value ? 'hidden' : 'shown') } catch {}
}
