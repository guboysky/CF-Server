<script setup>
import { computed } from 'vue'
import { bytes, timestamp, online } from '../utils/metrics.js'
import { osIcon, traffic, daysLeft, uptimeText, loadValues } from '../utils/display.js'
import { language } from '../composables/useTheme.js'
import { now, region, text } from '../composables/useView.js'
const props = defineProps({ server: Object, site: Object })
const stamp = value => timestamp(value) ? new Date(timestamp(value)).toLocaleString(language.value) : '—'
const facts = computed(() => {
  const n = props.server, quota = traffic(n), days = daysLeft(n.expire_date)
  return [[text('运行时间','Uptime'), uptimeText(n.boot_time, Date.now(), language.value)], [text('剩余时间','Remaining'), n.expire_date ? `${days ?? '—'} ${text('天','days')}` : '—'], [text('操作系统 / 架构','OS / Arch'), `${n.os || '—'} / ${n.arch || '—'}`], [text('内核版本','Kernel'), n.kernel_version || '—'], ['CPU', `${n.cpu_info || '—'} × ${n.cpu_cores || '—'}`], [text('总磁盘 / 内存','Disk / Memory'), `${bytes(Number(n.disk_total) * 1048576)} / ${bytes(Number(n.ram_total) * 1048576)}`], [text('负载均值','Load'), loadValues(n.load_avg).map(value => value.toFixed(2)).join(' ') || '—'], [text('总流量','Traffic'), `↓ ${bytes(n.net_rx)} / ↑ ${bytes(n.net_tx)}`], [text('实时速度','Live speed'), `↓ ${bytes(n.net_in_speed)}/s / ↑ ${bytes(n.net_out_speed)}/s`], [text('月流量','Monthly traffic'), `↓ ${bytes(n.net_rx_monthly)} / ↑ ${bytes(n.net_tx_monthly)}`], [text('流量配额','Quota'), quota.detail], [text('启动时间','Boot time'), stamp(n.boot_time)], [text('最后更新','Updated'), stamp(n.last_updated)], [text('Agent 版本','Agent version'), n.agent_version || '—']]
})
</script>
<template><section class="node-facts terminal-panel"><div class="facts-heading"><h2><RouterLink to="/" class="facts-back" :aria-label="text('返回概览','Back to overview')">←</RouterLink><img v-if="region(server.region)" class="country-flag" :src="`${site.base}/flags/${region(server.region).toLowerCase()}.svg`" :alt="region(server.region)"><img v-if="osIcon(server.os)" class="os-icon" :src="`${site.base}/os-icons/${osIcon(server.os)}`" :alt="server.os"><span>{{ server.name || server.id }}</span></h2><span class="status" :class="online(server, now) ? 'green' : 'red'">{{ text(online(server, now) ? '在线' : '离线', online(server, now) ? 'Online' : 'Offline') }}</span></div><dl class="facts-table"><div v-for="[label,value] in facts" :key="label" class="fact-cell"><dt>{{ label }}</dt><dd :title="value">{{ value }}</dd></div></dl></section></template>
