<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
const props = defineProps({ value: Number, swap: Number })
const valid = computed(() => typeof props.value === 'number' && Number.isFinite(props.value))
const ready = ref(false)
let frame
onMounted(() => { frame = requestAnimationFrame(() => { ready.value = true }) })
onBeforeUnmount(() => cancelAnimationFrame(frame))
const offset = value => 264 * (1 - (ready.value ? Math.max(0, Math.min(100, value || 0)) : 0) / 100)
</script>
<template><div class="metric-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" stroke-width="6" class="metric-ring-track"/><circle v-if="valid" cx="50" cy="50" r="42" fill="none" stroke-width="6" :stroke="value >= 80 ? 'var(--orange)' : 'var(--green)'" stroke-dasharray="264" :stroke-dashoffset="offset(value)" transform="rotate(-90 50 50)" class="metric-ring-progress"/><circle v-if="typeof swap === 'number'" cx="50" cy="50" r="34" fill="none" stroke-width="3" stroke="var(--blue)" stroke-dasharray="214" :stroke-dashoffset="offset(swap) * 214 / 264" transform="rotate(-90 50 50)" class="metric-ring-progress"/></svg><span class="metric-ring-value">{{ valid ? value.toFixed(1) : '—' }}<small v-if="valid">%</small></span></div></template>
