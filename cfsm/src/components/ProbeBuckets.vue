<script setup>
import { probeTone } from '../utils/display.js'
import { present, probeText } from '../utils/metrics.js'
import { t } from '../composables/useTheme.js'
defineProps({ values: { type: Array, default: () => [] }, loss: Boolean })
</script>
<template><div class="buckets" aria-hidden="true"><i v-for="(value, index) in values.slice(-24)" :key="index" :class="probeTone(value, loss)" :title="present(value) ? probeText(value, loss ? '%' : ' ms', t('timeout')) : t('noSample')"></i></div></template>
