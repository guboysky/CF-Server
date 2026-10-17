<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { probes, probeLabel, timestamp } from '../utils/metrics.js'
import { osIcon, traffic, daysLeft, loadValues, probeTone } from '../utils/display.js'
import { cardProbeValue, probeSamples, probeValueText, hourlyProbeServer } from '../utils/probes.js'
import { now, region } from '../composables/useView.js'
import { themeOptions } from '../composables/useTheme.js'
import { memory, size, ratio, percentage, running, uptime, virtualization } from './data.js'
import Sparkline from './Sparkline.vue'
const props = defineProps({ server: Object, site: Object, siteIndex: Number })
const router = useRouter(), live = computed(() => running(props.server, now.value)), reported = computed(() => timestamp(props.server.last_updated) > 0)
const quota = computed(() => traffic(props.server)), days = computed(() => props.site.sysConfig.show_expire !== false ? daysLeft(props.server.expire_date, now.value) : null)
const keys = computed(() => probes.filter(key => props.server[`ping_${key}`] !== false && (props.server[`ping_${key}`] !== undefined || probeSamples(props.server, 'ping', key).some(value => value !== false && value !== undefined))))
const windows = computed(() => props.site.sysConfig.show_three_net_details === true)
const trendServer = computed(() => hourlyProbeServer(props.server, now.value))
const measurements = computed(() => [
  { name: `CPU ${props.server.cpu_cores || '—'} 核`, value: live.value ? props.server.cpu : null, detail: live.value ? loadValues(props.server.load_avg).map(v => v.toFixed(2)).join(' ') || '—' : '未就绪' },
  { name: '内存', value: live.value ? ratio(props.server.ram_used, props.server.ram_total) : null, detail: reported.value ? `${memory(props.server.ram_used)} / ${memory(props.server.ram_total)}` : '未就绪' },
  { name: '磁盘', value: live.value ? ratio(props.server.disk_used, props.server.disk_total) : null, detail: reported.value ? `${memory(props.server.disk_used)} / ${memory(props.server.disk_total)}` : '未就绪' },
  ...(props.site.sysConfig.show_tf !== false ? [{ name: '流量', value: quota.value.limit ? quota.value.percentage : null, detail: reported.value ? quota.value.detail.replaceAll('iB', 'B') : '未就绪', infinite: !quota.value.limit }] : [])
])
function open() { router.push({ path: `/server/${props.server.id}`, query: { site: props.siteIndex } }) }
</script>
<template><article class="matrix-card cf-card box" :class="{offline: !live}" role="link" tabindex="0" @click="open" @keydown.enter.self="open">
  <div class="node-title"><strong><img v-if="region(server.region)" class="flag" :src="`${site.base}/flags/${region(server.region).toLowerCase()}.svg`" :alt="region(server.region)"><img v-if="osIcon(server.os)" class="os-icon" :src="`${site.base}/os-icons/${osIcon(server.os)}`" :alt="server.os"><span :title="server.name">{{ server.name || server.id }}</span></strong><span class="node-badges"><span class="chip state-chip"><i :class="{up: live}"/>{{ live ? `在线 ${uptime(server, now)}` : reported ? '离线' : '未接入' }}</span><span class="chip expiry-chip" v-if="days !== null">{{ days >= 0 ? `${days} 天后到期` : `已到期 ${-days} 天` }}</span></span></div>
  <div class="node-sub"><span>{{ reported ? `${virtualization(server)} · ${server.arch || '—'}` : '等待首次上报' }}</span></div>
  <div class="card-metrics"><div v-for="meter in measurements" :key="meter.name" class="card-metric"><div><span>{{ meter.name }}</span><b>{{ meter.infinite ? '∞' : percentage(meter.value) }}</b></div><div class="track"><i :style="{width: `${Math.max(0,Math.min(100,Number(meter.value) || 0))}%`}"/></div><small>{{ meter.detail }}</small></div></div>
  <div class="card-network"><span>↓ <b>{{ live ? `${size(server.net_in_speed)}/s` : '—' }}</b></span><span>↑ <b>{{ live ? `${size(server.net_out_speed)}/s` : '—' }}</b></span><span>↓ {{ reported ? size(server.net_rx) : '—' }}</span><span>↑ {{ reported ? size(server.net_tx) : '—' }}</span></div>
  <section v-if="live && keys.length && themeOptions.show_latency !== false" class="card-probes"><div class="muted spread"><span>网络延迟</span><span>{{ windows ? '1H 窗口走势' : '实时' }} · 丢包</span></div><div v-for="key in keys" :key="key" class="carrier-row" :data-probe="key"><span>{{ probeLabel(site.config,key) }}</span><strong :class="probeTone(cardProbeValue(trendServer,'ping',key,windows))">{{ cardProbeValue(trendServer,'ping',key,windows) === null ? '超时' : probeValueText(cardProbeValue(trendServer,'ping',key,windows)) }}</strong><Sparkline :values="windows ? probeSamples(trendServer,'ping',key) : []" :class="probeTone(cardProbeValue(trendServer,'ping',key,windows))"/><span class="loss-caption" :title="windows ? '有效窗口采样的平均丢包率' : '最新丢包率'">{{ probeValueText(cardProbeValue(trendServer,'loss',key,windows),true) }}</span></div></section>
  <section v-else class="card-unavailable"><div class="muted spread"><span>{{ reported ? '网络延迟' : '接入状态' }}</span><span>{{ reported ? '暂无可用采样' : '配置指引' }}</span></div><p>{{ reported ? live ? '尚无网络延迟数据' : '主机已离线，等待恢复上报' : '主机尚未接入 · 请在后台获取命令并在主机执行' }}</p></section>
</article></template>
