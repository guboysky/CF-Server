<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { state, changeHours } from '../composables/useMonitor.js'
import { t, themeOptions, language } from '../composables/useTheme.js'
import { HOURS, probes, probeLabel, probeText, present, bytes, percent, gpuInfo, online, timestamp } from '../utils/metrics.js'
import { osIcon, validRegion, uptimeText, traffic, loadValues, probeTone } from '../utils/display.js'
import NodeFacts from '../components/NodeFacts.vue'
import HistoryChart from '../components/HistoryChart.vue'
const server = computed(() => state.detail), site = computed(() => state.sites[state.page?.site || 0])
const router = useRouter()
const nodeChoices = computed(() => {
  const cached = state.sites.flatMap((site, siteIndex) => site.servers.filter(item => item.is_hidden !== '1').map(item => ({ key: `${siteIndex}:${item.id}`, site: siteIndex, id: String(item.id), name: item.name || String(item.id) })))
  const current = { key: `${state.page?.site || 0}:${state.page?.id}`, site: state.page?.site || 0, id: String(state.page?.id), name: server.value?.name || String(state.page?.id) }
  return cached.some(item => item.key === current.key) ? cached : [current, ...cached]
})
const selectedNode = computed(() => `${state.page?.site || 0}:${state.page?.id}`)
const nodeIndex = computed(() => nodeChoices.value.findIndex(item => item.key === selectedNode.value))
function chooseNode(key) {
  const node = nodeChoices.value.find(item => item.key === key)
  if (node && key !== selectedNode.value) router.push({ path: `/server/${node.id}`, query: { site: node.site } })
}
function adjacentNode(offset) { const node = nodeChoices.value[nodeIndex.value + offset]; if (node) chooseNode(node.key) }
const probeMode = ref('ping'), hiddenProbes = ref([])
const numeric = key => state.rows.map(row => row[key] === null || row[key] === false || row[key] === undefined ? row[key] : Number(row[key]))
const times = computed(() => state.rows.map(row => row.timestamp ?? row.last_updated))
const rangeLabel = hours => hours === 0.167 ? '10 min' : hours === 0.5 ? '30 min' : hours < 24 ? `${hours} h` : `${hours / 24} d`
const charts = computed(() => {
  const current = server.value || {}
  const list = [
    { title: t('cpuAndLoad'), icon: 'cpu', summary: `${Number(current.cpu || 0).toFixed(1)}%`, unit: '%', max: Math.max(10, Math.ceil(Math.max(0, ...numeric('cpu').filter(value => typeof value === 'number')) / 10) * 10), series: [{ label: 'CPU', values: numeric('cpu'), fill: true }, ...(state.rows.some(row => loadValues(row.load_avg).length) ? [{ label: t('load'), values: state.rows.map(row => loadValues(row.load_avg)[0]), right: true, color: '#91b3da' }] : [])] },
    { title: t('memorySwap'), icon: 'memory', summary: `${bytes(Number(current.ram_used) * 1048576)} · ${bytes(Number(current.ram_total) * 1048576)}`, unit: 'bytes', series: [{ label: 'RAM', fill: true, values: numeric('ram_used').map(value => typeof value === 'number' ? value * 1048576 : value) }, { label: t('ramTotal'), values: numeric('ram_total').map(value => typeof value === 'number' ? value * 1048576 : value), dashed: true }, ...(Number(current.swap_total) > 0 ? [{ label: 'Swap', values: numeric('swap_used').map(value => typeof value === 'number' ? value * 1048576 : value), color: '#7f90a8' }, { label: t('swapTotal'), values: numeric('swap_total').map(value => typeof value === 'number' ? value * 1048576 : value), dashed: true, color: '#c2cddd' }] : [])] },
    { title: t('disk'), icon: 'disk', summary: `${bytes(Number(current.disk_used) * 1048576)} · ${bytes(Number(current.disk_total) * 1048576)}`, unit: 'bytes', series: [{ label: t('diskUsed'), fill: true, values: numeric('disk_used').map(value => typeof value === 'number' ? value * 1048576 : value) }, { label: t('diskTotal'), values: numeric('disk_total').map(value => typeof value === 'number' ? value * 1048576 : value), dashed: true }] }
  ]
  if (themeOptions.value.show_network !== false) list.push({ title: t('realtimeNetwork'), icon: 'network', unitLabel: t('speed'), summary: `↑ ${bytes(current.net_out_speed)}/s · ↓ ${bytes(current.net_in_speed)}/s`, unit: 'bytes', series: [{ label: `${t('download')} /s`, fill: true, color: '#9cbbe2', values: numeric('net_in_speed') }, { label: `${t('upload')} /s`, values: numeric('net_out_speed'), color: '#397bc6' }] })
  if (present(current.tcp_conn) || present(current.udp_conn)) list.push({ title: t('connections'), icon: 'traffic', unitLabel: t('connectionCount'), summary: `TCP: ${current.tcp_conn ?? '—'} · UDP: ${current.udp_conn ?? '—'}`, series: [{ label: 'TCP', values: numeric('tcp_conn') }, { label: 'UDP', values: numeric('udp_conn') }] })
  if (present(current.processes)) list.push({ title: t('processes'), icon: 'pulse', unitLabel: t('processes'), summary: String(current.processes), series: [{ label: t('processes'), fill: true, values: numeric('processes') }] })
  if (current.disk && typeof current.disk === 'object') list.push({ title: 'Disk IO', icon: 'disk', summary: `R ${bytes(current.disk.read_bps)}/s · W ${bytes(current.disk.write_bps)}/s`, unit: 'bytes', series: ['read_bps', 'write_bps'].map((field, index) => ({ label: index ? 'W /s' : 'R /s', values: state.rows.map(row => { let disk = row.disk; if (typeof disk === 'string') { try { disk = JSON.parse(disk) } catch { disk = null } } return disk?.[field] }) })) })
  for (const gpu of gpuInfo(current.gpu_info)) list.push({ title: gpu.name || 'GPU', icon: 'cpu', summary: `${gpu.info ?? '—'}%`, unit: '%', max: 100, series: [{ label: 'GPU', fill: true, values: state.rows.map(row => { const value = gpuInfo(row.gpu_info).find(item => String(item.id) === String(gpu.id))?.info; return value === null || value === undefined ? undefined : Number(value) }) }] })
  return list
})
const probeKeys = computed(() => probes.filter(key => present(server.value?.[`ping_${key}`]) || present(server.value?.[`loss_${key}`]) || state.rows.some(row => present(row[`ping_${key}`]) || present(row[`loss_${key}`]))))
const probeSeries = computed(() => probeKeys.value.filter(key => !hiddenProbes.value.includes(key)).map(key => ({ label: probeLabel(site.value.config, key), values: numeric(`${probeMode.value}_${key}`) })))
function toggleProbe(key) { hiddenProbes.value = hiddenProbes.value.includes(key) ? hiddenProbes.value.filter(value => value !== key) : [...hiddenProbes.value, key] }
</script>
<template>
  <p v-if="state.loading && !server" class="terminal-panel empty">{{ t('loading') }}</p>
  <section v-if="server" class="detail terminal-panel">
    <NodeFacts :server="server" :site="site"/>
    <div class="detail-navigation"><button :disabled="nodeIndex <= 0" @click="adjacentNode(-1)">←</button><select :value="selectedNode" :aria-label="t('switchNode')" :disabled="nodeChoices.length < 2" @change="chooseNode($event.target.value)"><option v-for="node in nodeChoices" :key="node.key" :value="node.key">{{ node.name }}</option></select><button :disabled="nodeIndex >= nodeChoices.length - 1" @click="adjacentNode(1)">→</button></div>
    <div class="range-toolbar"><div class="range-tabs"><button v-for="hours in [0.167, 1, 6, 12, 24, 168]" :key="hours" :aria-pressed="state.hours === hours" @click="hours !== state.hours && changeHours(hours)">{{ hours === 0.167 ? t('realtime') : rangeLabel(hours) }}</button></div><select :value="state.hours" @change="changeHours(Number($event.target.value))" :aria-label="t('history')"><option v-for="hours in HOURS" :key="hours" :value="hours">{{ rangeLabel(hours) }}</option></select></div>
    <p v-if="state.historyLoading" role="status">{{ t('loading') }}</p>
    <div class="chart-grid"><HistoryChart v-for="chart in charts" :key="chart.title" v-bind="chart" :times="times"/></div>
    <section v-if="probeKeys.length" class="probes-section"><div class="range-toolbar"><div class="range-tabs"><button :aria-pressed="probeMode === 'ping'" @click="probeMode = 'ping'">{{ t('latency') }}</button><button :aria-pressed="probeMode === 'loss'" @click="probeMode = 'loss'">{{ t('loss') }}</button></div><small>{{ rangeLabel(state.hours) }} · {{ t('sharedHistory') }}</small></div><div class="probe-selectors"><button v-for="key in probeKeys" :key="key" :aria-pressed="!hiddenProbes.includes(key)" @click="toggleProbe(key)">{{ probeLabel(site.config, key) }} <span v-if="present(server[`ping_${key}`])">{{ probeText(server[`ping_${key}`], ' ms', t('timeout')) }}</span></button></div><HistoryChart :title="t(probeMode === 'ping' ? 'latency' : 'loss')" icon="network" :series="probeSeries" :times="times" :unit="probeMode === 'ping' ? 'ms' : '%'" :max="probeMode === 'loss' ? 100 : undefined"/></section>
  </section>
</template>
