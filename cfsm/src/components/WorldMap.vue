<script>
import worldUrl from '../assets/world.json?url'
let worldPromise
function loadWorld() { return worldPromise ??= fetch(worldUrl).then(response => { if (!response.ok) throw new Error('Map unavailable'); return response.json() }).catch(error => { worldPromise = null; throw error }) }
</script>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { mapRegions } from '../utils/map.js'
import { country, region, text } from '../composables/useView.js'
const props = defineProps({ items: Array })
const features = ref([]), failed = ref(false), zoom = ref(1)
onMounted(async () => { try { features.value = (await loadWorld()).features } catch { failed.value = true } })
const regions = computed(() => mapRegions(props.items.map(item => ({ country: region(item.server.region) })), features.value))
const project = point => `${((point[0] + 180) * 2).toFixed(1)},${((90 - point[1]) * 2).toFixed(1)}`
function path(feature) { const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates; return polygons.map(polygon => polygon.map(ring => 'M' + ring.map(project).join('L') + 'Z').join('')).join('') }
</script>
<template><section class="world-map terminal-panel"><div class="map-toolbar"><span>{{ text('节点分布 / 国家地区（非精确位置）', 'NODE DISTRIBUTION / COUNTRY') }}</span><span><button :aria-label="text('缩小', 'Zoom out')" @click="zoom = Math.max(1, zoom - 0.5)">−</button><button :aria-label="text('放大', 'Zoom in')" @click="zoom = Math.min(3, zoom + 0.5)">+</button><button :aria-label="text('重置缩放', 'Reset zoom')" @click="zoom = 1">↺</button></span></div><div class="map-scroll"><svg viewBox="0 0 720 360" :style="{ width: `${zoom * 100}%` }" :aria-label="text('世界地图', 'World map')"><path v-for="(feature, index) in features" :key="index" :d="path(feature)" :class="{ 'map-active': regions.some(item => item.code === region(feature.properties.iso_a2)) }" fill-rule="evenodd"><title>{{ feature.properties.name_zh || feature.properties.name }}</title></path><g v-for="item in regions.filter(item => item.point)" :key="item.code" class="map-marker" :data-country="item.code" :transform="`translate(${(item.point[0] + 180) * 2} ${(90 - item.point[1]) * 2})`" role="button" tabindex="0" :aria-label="`${item.code} · ${item.count}`" @click="country = item.code" @keydown.enter.prevent="country = item.code" @keydown.space.prevent="country = item.code"><circle r="5.5"/><text text-anchor="middle" dominant-baseline="central">{{ item.count }}</text></g></svg></div><p v-if="failed" role="alert">{{ text('地图加载失败', 'Map could not be loaded') }}</p><div class="map-countries"><button v-for="item in regions" :key="item.code" @click="country = item.code">{{ item.code }} · {{ item.count }}{{ item.point ? '' : text('（未能定位）', ' (unmapped)') }}</button></div><small>{{ text('选择国家后切换条形图或列表查看节点。', 'Select a country, then switch to Bars or List.') }}</small></section></template>
