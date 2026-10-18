<script>
import worldUrl from '../assets/world.json?url'
let worldPromise
const load = () => worldPromise ??= fetch(worldUrl).then(response => { if (!response.ok) throw Error('地图加载失败'); return response.json() }).catch(error => { worldPromise = null; throw error })
</script>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { mapRegions } from '../utils/map.js'
import { country, region, now } from '../composables/useView.js'
import { running } from './data.js'
import Icon from '../components/Icon.vue'
const props = defineProps({ items: Array })
const features = ref([]), error = ref(''), hover = ref('')
onMounted(async () => { try { features.value = (await load()).features } catch (e) { error.value = e.message } })
const groups = computed(() => mapRegions(props.items.map(item => ({country: region(item.server.region)})), features.value).map(item => {
  const nodes = props.items.filter(node => region(node.server.region) === item.code)
  return {...item, nodes, online: nodes.filter(node => running(node.server,now.value)).length}
}))
const project = point => `${((point[0]+180)*2).toFixed(1)},${((90-point[1])*2).toFixed(1)}`
function path(feature) { const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates; return polygons.map(polygon => polygon.map(ring => 'M'+ring.map(project).join('L')+'Z').join('')).join('') }
function select(code) { country.value = country.value === code ? '' : code }
</script>
<template><section class="matrix-map box"><div class="section-heading"><Icon name="globe"/><div><strong>全球节点平面拓扑分布 <small class="chip mono">FLAT MATRIX</small></strong><p>全球视野一览无余 · 接入 {{ items.length }} 台 · 在线 {{ items.filter(item=>running(item.server,now)).length }} 台 · 覆盖 {{ groups.length }} 个地区</p></div></div><div class="map-layout"><div class="flat-map"><svg viewBox="0 0 720 300" role="img" aria-label="全球节点地图"><g class="map-grid"><line v-for="n in 13" :key="`v${n}`" :x1="(n-1)*60" :x2="(n-1)*60" y1="0" y2="360"/><line v-for="n in 7" :key="`h${n}`" x1="0" x2="720" :y1="(n-1)*60" :y2="(n-1)*60"/></g><path v-for="(feature,index) in features" :key="index" :d="path(feature)" fill-rule="evenodd"/><g v-for="group in groups.filter(group=>group.point)" :key="group.code" class="map-marker" :class="{selected:country===group.code,down:!group.online}" :transform="`translate(${(group.point[0]+180)*2} ${(90-group.point[1])*2})`" role="button" tabindex="0" :aria-label="`${group.code} ${group.online}/${group.count}`" @click="select(group.code)" @keydown.enter="select(group.code)" @keydown.space.prevent="select(group.code)" @mouseenter="hover=group.code" @mouseleave="hover=''" @focus="hover=group.code"><circle r="8" class="halo"/><circle r="3.5"/><title>{{ group.code }} · {{ group.online }}/{{ group.count }} 在线 · {{ group.nodes.map(item=>item.server.name).join('、') }}</title></g><text x="8" y="13">180°W</text><text x="330" y="13">0° (UTC)</text><text x="677" y="13">180°E</text></svg><div class="map-hint">{{ hover ? groups.find(group=>group.code===hover)?.nodes.map(item=>item.server.name).join(' · ') : '悬停亮点查看地区节点 · 点击亮点筛选地区' }}</div><small v-if="error" role="alert">{{ error }}</small></div><div class="region-list"><div class="spread"><strong>地区测控列表</strong><small>共 {{ groups.length }} 个区域</small></div><button v-for="group in groups" :key="group.code" :aria-pressed="country===group.code" @click="select(group.code)"><span><img class="flag" :src="`${group.nodes[0]?.site.base}/flags/${group.code.toLowerCase()}.svg`" alt="">{{ group.code }} <small>({{ group.code }})</small></span><b>{{ group.online }}/{{ group.count }} ↗</b><i :style="{width:`${group.online/group.count*100}%`}"/></button><p v-if="!groups.length" class="muted">暂无可定位节点</p></div></div></section></template>
