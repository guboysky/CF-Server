<script setup>
import { computed } from 'vue'
import { number } from './data.js'
const props = defineProps({ values: { type: Array, default: () => [] }, color: { type: String, default: 'currentColor' }, fill: Boolean })
const paths = computed(() => {
  const valid = props.values.map(number).filter(value => value !== null), max = Math.max(1, ...valid), min = Math.min(0, ...valid)
  const groups = []; let points = []
  props.values.forEach((value, index) => { const n = number(value); if (n === null) { if (points.length) groups.push(points); points = []; return }; points.push([index / Math.max(1, props.values.length - 1) * 160, 25 - (n - min) / (max - min) * 23]) })
  if (points.length) groups.push(points)
  return groups.map(points => ({ line: points.map((p, i) => `${i ? 'L' : 'M'}${p.join(',')}`).join(' '), area: `M${points[0][0]},28 L${points.map(p => p.join(',')).join(' L')} L${points.at(-1)[0]},28 Z` }))
})
</script>
<template><svg class="sparkline" viewBox="0 0 160 28" preserveAspectRatio="none" aria-hidden="true"><g v-for="(p,index) in paths" :key="index"><path v-if="fill" :d="p.area" :fill="color" opacity=".12"/><path :d="p.line" :stroke="color" fill="none" stroke-width="1.25" vector-effect="non-scaling-stroke"/></g></svg></template>
