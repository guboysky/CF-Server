<script setup>
import { computed } from 'vue'
import { probes, present, probeLabel, probeText } from '../utils/metrics.js'
import { probeWindow, probeTone } from '../utils/display.js'
import { t } from '../composables/useTheme.js'
import ProbeBuckets from './ProbeBuckets.vue'
const props = defineProps({ server: Object, site: Object })
const windows = computed(() => props.site.sysConfig.show_three_net_details === true)
const keys = computed(() => probes.filter(key => present(props.server[`ping_${key}`]) || present(props.server[`loss_${key}`]) || windows.value && ['ping', 'loss'].some(field => probeWindow(props.server, field, key).some(present))))
</script>
<template><div v-if="keys.length" class="carrier-windows"><div v-for="key in keys" :key="key" class="carrier-row" :data-probe="key"><div><div class="ping-caption"><span>{{ probeLabel(site.config, key) }}</span><strong v-if="present(server[`ping_${key}`])" :class="probeTone(server[`ping_${key}`])">{{ probeText(server[`ping_${key}`], ' ms', t('timeout')) }}</strong></div><ProbeBuckets v-if="windows" :values="probeWindow(server, 'ping', key)"/></div><div><div class="ping-caption loss-caption"><strong v-if="present(server[`loss_${key}`])" :class="probeTone(server[`loss_${key}`], true)">{{ probeText(server[`loss_${key}`], '%', t('timeout')) }}</strong></div><ProbeBuckets v-if="windows" :values="probeWindow(server, 'loss', key)" loss/></div></div></div></template>
