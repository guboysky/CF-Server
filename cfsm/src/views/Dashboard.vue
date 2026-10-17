<script setup>
import { computed } from 'vue'
import { state } from '../composables/useMonitor.js'
import { selectedNodes, layout, now, region, text } from '../composables/useView.js'
import { themeOptions, language } from '../composables/useTheme.js'
import { bytes, online, percent, timestamp } from '../utils/metrics.js'
import { osIcon, traffic } from '../utils/display.js'
import ServerCard from '../components/ServerCard.vue'
import WorldMap from '../components/WorldMap.vue'
const active = computed(() => selectedNodes.value.filter(item => online(item.server, now.value)))
const total = field => selectedNodes.value.reduce((sum, item) => sum + (Number(item.server[field]) || 0), 0)
const speed = field => active.value.reduce((sum, item) => sum + (Number(item.server[field]) || 0), 0)
const fraction = (server, used, max) => online(server, now.value) && Number(server[max]) > 0 ? `${percent(server[used], server[max]).toFixed(1)}%` : '—'
</script>
<template>
  <section v-if="themeOptions.show_summary !== false" class="summary terminal-panel"><div class="desktop-summary"><label>{{ text('服务器', 'Servers') }}</label><strong class="green">{{ text('在线', 'Online') }}:{{ active.length }} <span class="muted">|</span> <span class="red">{{ text('离线', 'Offline') }}:{{ selectedNodes.length - active.length }}</span></strong></div><div class="desktop-summary"><label>{{ text('总流量', 'Total traffic') }}</label><strong><span class="green">{{ bytes(total('net_rx')) }} ↓</span> | <span class="blue">↑ {{ bytes(total('net_tx')) }}</span></strong></div><div class="summary-speed"><label>{{ text('实时速度', 'Live speed') }}</label><strong><span class="green">↓ {{ bytes(speed('net_in_speed')) }}/s</span> | <span class="blue">↑ {{ bytes(speed('net_out_speed')) }}/s</span></strong></div><div class="desktop-summary"><label>{{ text('本月流量', 'Monthly traffic') }}</label><strong>{{ selectedNodes.some(item => item.server.net_rx_monthly !== undefined || item.server.net_tx_monthly !== undefined) ? bytes(total('net_rx_monthly') + total('net_tx_monthly')) : '—' }}</strong></div></section>
  <p v-if="state.loading && !selectedNodes.length" class="terminal-panel empty">{{ text('正在连接探针…', 'Connecting…') }}</p>
  <WorldMap v-else-if="layout === 'map'" :items="selectedNodes"/>
  <div v-else-if="layout === 'list' && selectedNodes.length" class="table-scroll terminal-panel"><table class="node-table"><thead><tr><th>{{ text('主机名', 'Host') }}</th><th>{{ text('地区', 'Region') }}</th><th>{{ text('系统 / 架构', 'OS / Arch') }}</th><th>CPU</th><th>RAM</th><th>DISK</th><th>USE</th><th>TCP/UDP</th><th>{{ text('下载', 'Download') }}</th><th>{{ text('上传', 'Upload') }}</th><th>{{ text('更新', 'Updated') }}</th></tr></thead><tbody><tr v-for="item in selectedNodes" :key="`${item.siteIndex}:${item.server.id}`"><td><RouterLink :to="{ path: `/server/${item.server.id}`, query: { site: item.siteIndex } }"><i class="node-dot" :class="{ red: !online(item.server, now) }"/><img v-if="osIcon(item.server.os)" class="os-icon" :src="`${item.site.base}/os-icons/${osIcon(item.server.os)}`" :alt="item.server.os">{{ item.server.name }}</RouterLink></td><td>{{ region(item.server.region) || '—' }}</td><td>{{ item.server.os || '—' }} / {{ item.server.arch || '—' }}</td><td>{{ online(item.server, now) && item.server.cpu !== undefined ? `${Number(item.server.cpu).toFixed(1)}%` : '—' }}</td><td>{{ fraction(item.server, 'ram_used', 'ram_total') }}</td><td>{{ fraction(item.server, 'disk_used', 'disk_total') }}</td><td>{{ item.site.sysConfig.show_tf !== false ? traffic(item.server).limit ? `${traffic(item.server).percentage.toFixed(1)}%` : '∞' : '—' }}</td><td>{{ online(item.server, now) ? `${item.server.tcp_conn ?? '—'}/${item.server.udp_conn ?? '—'}` : '—' }}</td><td class="green">{{ online(item.server, now) ? `${bytes(item.server.net_in_speed)}/s` : '—' }}</td><td class="blue">{{ online(item.server, now) ? `${bytes(item.server.net_out_speed)}/s` : '—' }}</td><td>{{ timestamp(item.server.last_updated) ? new Date(timestamp(item.server.last_updated)).toLocaleTimeString(language) : '—' }}</td></tr></tbody></table></div>
  <section v-else-if="selectedNodes.length" class="node-grid"><ServerCard v-for="item in selectedNodes" :key="`${item.siteIndex}:${item.server.id}`" v-bind="item" :view="layout"/></section>
  <p v-else class="terminal-panel empty">{{ text('暂无匹配节点', 'No matching nodes') }}</p>
</template>
