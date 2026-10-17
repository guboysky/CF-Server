<script setup>
import { computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { state, initialize, setPage, onVisibility, dispose, continueLive } from './composables/useMonitor.js'
import { firstConfig, t, applyAppearance, themeOptions } from './composables/useTheme.js'
import { toggleAppearance, refreshClock, clearClock } from './composables/useView.js'
import { meta } from './utils/config.js'
import TurnstileGate from './components/TurnstileGate.vue'
const route=useRoute()
const title=computed(()=>firstConfig.value.site_title||meta('siteTitle')||'CF-Server-Monitor')
watch(()=>[state.ready,route.fullPath],()=>{if(state.ready){setPage(route.params.id?{id:String(route.params.id),site:Number(route.query.site||0)}:{});window.scrollTo(0,0)}})
watch(()=>state.sites.map(site=>site.servers),refreshClock)
watch(()=>state.detail,refreshClock)
onMounted(async()=>{document.addEventListener('visibilitychange',onVisibility);await initialize();if(state.ready)applyAppearance(firstConfig.value)})
onBeforeUnmount(()=>{document.removeEventListener('visibilitychange',onVisibility);clearClock();dispose()})
</script>
<template><header class="site-header"><RouterLink to="/" class="site-brand"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M1 11h3v6H1zM6 7h3v10H6zM11 2h3v15h-3z" fill="currentColor"/></svg>{{ title }}</RouterLink><button class="theme-toggle" aria-label="切换深浅色" @click="toggleAppearance"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20.5 13a8.5 8.5 0 0 1-9.5-9.5A8.5 8.5 0 1 0 20.5 13Z"/></svg></button></header><main class="matrix-shell"><aside v-if="themeOptions.notice" class="box notice">{{ themeOptions.notice }}</aside><p v-if="state.error" role="alert" class="box error">{{ state.error }}</p><section v-for="site in state.sites.filter(item=>item.expired)" :key="site.base" class="box timeout-banner"><div><strong>{{ t('paused') }}</strong><p>{{ t('budget') }}</p></div><button @click="continueLive(site)">{{ t('continue') }}</button></section><RouterView v-if="state.ready"/><p v-else-if="!state.error" class="box empty">{{ t('loading') }}</p><footer><a href="https://github.com/huilang-me/CF-Server-Monitor" target="_blank" rel="noopener">Powered by CF-Server-Monitor {{ firstConfig.version||'' }}</a><span>FLAT MATRIX · 实时监控</span></footer></main><TurnstileGate/></template>
