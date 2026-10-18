<script setup>
import { probeTone } from '../utils/display.js'
import { present, probeText } from '../utils/metrics.js'
import { t } from '../composables/useTheme.js'
import { probeValueText } from '../utils/probes.js'
defineProps({ values: { type: Array, default: () => [] }, loss: Boolean })
</script>
<template><div class="buckets"><i v-for="(value, index) in values.slice(-24)" :key="index" :class="probeTone(value, loss)" :title="loss && value === null ? t('noSample') : present(value) ? loss ? probeValueText(value, true) : probeText(value, ' ms', t('timeout')) : t('noSample')"></i></div></template>
