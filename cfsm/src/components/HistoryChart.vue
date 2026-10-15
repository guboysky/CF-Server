<script setup>
import { computed, ref, onMounted, onBeforeUnmount, useId } from 'vue'
import Icon from './Icon.vue'
import { bytes, timestamp } from '../utils/metrics.js'
import { timeTicks } from '../utils/chart.js'
import { t } from '../composables/useTheme.js'
const props = defineProps({ title: String, icon: String, series: { type: Array, default: () => [] }, times: { type: Array, default: () => [] }, summary: String, max: Number, unit: String, unitLabel: String })
const hidden = ref([]), hovered = ref(null), plot = ref(null), size = ref({ width: 600, height: 210 }), id = useId()
let observer
onMounted(() => {
  observer = new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect
    if (width > 0 && height > 0) size.value = { width: Math.round(width), height: Math.round(height) }
  })
  observer.observe(plot.value)
})
onBeforeUnmount(() => observer?.disconnect())
const colors = ['#397bc6', '#8eb2df', '#557da9', '#bfd2ea', '#275f9e', '#a3c4ed', '#7396c4', '#cbdcf0']
const visible = computed(() => props.series.map((series, index) => ({ ...series, index, color: series.color || colors[index % colors.length] })).filter(series => !hidden.value.includes(series.index)))
const numeric = value => typeof value === 'number' && Number.isFinite(value)
const ceiling = values => {
  const largest = Math.max(0, ...values)
  if (largest === 0) return 1
  const scale = 10 ** Math.floor(Math.log10(largest))
  return Math.ceil(largest / scale / 2) * scale * 2
}
const limits = computed(() => ({ left: props.max || ceiling(visible.value.filter(series => !series.right).flatMap(series => series.values.filter(numeric))), right: ceiling(visible.value.filter(series => series.right).flatMap(series => series.values.filter(numeric))) }))
const bounds = computed(() => ({ left: props.unit === 'bytes' ? 72 : 52, right: size.value.width - (props.series.some(series => series.right) ? 40 : 22), top: 18, bottom: size.value.height - 33 }))
const timesMs = computed(() => props.times.map(timestamp))
const x = index => {
  const ratio = timesMs.value.length > 1 && timesMs.value.at(-1) > timesMs.value[0] ? (timesMs.value[index] - timesMs.value[0]) / (timesMs.value.at(-1) - timesMs.value[0]) : index / Math.max(1, props.times.length - 1)
  return bounds.value.left + ratio * (bounds.value.right - bounds.value.left)
}
const y = (value, right) => bounds.value.bottom - Math.max(0, Math.min(1, value / limits.value[right ? 'right' : 'left'])) * (bounds.value.bottom - bounds.value.top)
const paths = computed(() => visible.value.map(series => {
  const segments = []; let segment = []
  const finish = () => { if (segment.length) segments.push(segment); segment = [] }
  series.values.forEach((value, index) => {
    if (!numeric(value)) { finish(); return }
    segment.push({ x: x(index), y: y(value, series.right) })
  })
  finish()
  return { ...series, segments: segments.map(points => {
    const path = points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')
    return { path, area: `${path} L${points.at(-1).x},${bounds.value.bottom} L${points[0].x},${bounds.value.bottom} Z` }
  }) }
}))
const format = value => props.unit === 'bytes' ? bytes(value) : `${Number(value.toFixed(value < 1 && value > 0 ? 2 : 1))}${props.unit || ''}`
const time = value => timestamp(value) ? new Date(timestamp(value)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
const ticks = computed(() => timeTicks(timesMs.value[0], timesMs.value.at(-1), bounds.value.right - bounds.value.left))
const tickLabel = tick => new Date(tick.value).toLocaleString([], { ...(tick.date ? { month: 'numeric', day: 'numeric' } : {}), hour: '2-digit', minute: '2-digit', ...(tick.seconds ? { second: '2-digit' } : {}) })
const tooltipStyle = computed(() => ({ left: `${Math.max(5, Math.min(size.value.width - 185, x(hovered.value || 0) + 12))}px` }))
function hover(event) {
  const rect = event.currentTarget.getBoundingClientRect(), position = (event.clientX - rect.left) / rect.width * size.value.width
  let best = 0
  for (let index = 1; index < props.times.length; index++) if (Math.abs(x(index) - position) < Math.abs(x(best) - position)) best = index
  hovered.value = props.times.length ? best : null
}
function toggle(index) { hidden.value = hidden.value.includes(index) ? hidden.value.filter(value => value !== index) : [...hidden.value, index] }
</script>
<template>
  <article class="chart-card panel" :data-icon="icon || 'pulse'">
    <div class="chart-heading"><h3><span class="chart-icon"><Icon :name="icon || 'pulse'" :size="18"/></span>{{ title }}</h3><span>{{ summary }}</span></div>
    <div class="chart-subtitle">{{ unitLabel || (unit === 'bytes' ? t('capacity') : unit || t('samples')) }}<span v-if="series.some(series => series.right)">{{ t('load') }}</span></div>
    <div ref="plot" class="history-plot" @pointerleave="hovered = null">
      <svg :viewBox="`0 0 ${size.width} ${size.height}`" preserveAspectRatio="none" role="img" :aria-label="title" @pointermove="hover">
        <defs><linearGradient v-for="series in visible" :key="series.index" :id="`${id}-${series.index}`" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" :stop-color="series.color" stop-opacity=".14"/><stop offset="100%" :stop-color="series.color" stop-opacity=".015"/></linearGradient></defs>
        <g v-for="n in 5" :key="n"><line :x1="bounds.left" :x2="bounds.right" :y1="bounds.top + (n - 1) * (bounds.bottom - bounds.top) / 4" :y2="bounds.top + (n - 1) * (bounds.bottom - bounds.top) / 4" class="gridline"/><text :x="bounds.left - 9" :y="bounds.top + 4 + (n - 1) * (bounds.bottom - bounds.top) / 4" text-anchor="end">{{ format(limits.left * (5 - n) / 4) }}</text><text v-if="series.some(series => series.right)" :x="bounds.right + 10" :y="bounds.top + 4 + (n - 1) * (bounds.bottom - bounds.top) / 4">{{ Number((limits.right * (5 - n) / 4).toFixed(2)) }}</text></g>
        <g v-for="series in paths" :key="series.index"><g v-for="(segment, index) in series.segments" :key="index"><path v-if="series.fill" :d="segment.area" :fill="`url(#${id}-${series.index})`"/><path :d="segment.path" fill="none" :stroke="series.color" :stroke-dasharray="series.dashed ? '5 3' : undefined" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></g></g>
        <text v-for="tick in ticks" :key="tick.value" class="time-tick" :x="bounds.left + tick.ratio * (bounds.right - bounds.left)" :y="size.height - 8" text-anchor="middle">{{ tickLabel(tick) }}</text>
        <g v-if="hovered !== null"><line :x1="x(hovered)" :x2="x(hovered)" y1="15" :y2="bounds.bottom" class="hover-line"/><circle v-for="series in visible.filter(series => numeric(series.values[hovered]))" :key="series.index" :cx="x(hovered)" :cy="y(series.values[hovered], series.right)" r="3.2" :fill="series.color" stroke="var(--card)" stroke-width="1.5"/></g>
      </svg>
      <div v-if="!times.length" class="plot-empty">{{ t('noHistory') }}</div>
      <div v-if="hovered !== null" class="chart-tooltip" :style="tooltipStyle"><strong>{{ time(times[hovered]) }}</strong><div v-for="series in visible.filter(series => series.values[hovered] !== false && series.values[hovered] !== undefined)" :key="series.index"><i :style="{ background: series.color }"></i>{{ series.label }} <b>{{ series.values[hovered] === null ? t('timeout') : series.right ? series.values[hovered] : format(series.values[hovered]) }}</b></div></div>
    </div>
    <div class="chart-legend"><button v-for="(series, index) in series" :key="index" :class="{ 'legend-hidden': hidden.includes(index) }" :aria-pressed="!hidden.includes(index)" @click="toggle(index)"><i :class="{ dashed: series.dashed }" :style="{ '--series-color': series.color || colors[index % colors.length] }"></i>{{ series.label }}</button></div>
  </article>
</template>
