<script setup>
import { computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { state, initialize, setPage, onVisibility, dispose, continueLive } from './composables/useMonitor.js'
import { firstConfig, t, applyAppearance, themeOptions, language } from './composables/useTheme.js'
import { layout, setView, mobile, country, regions, nodes, region, text, setLanguage, toggleAppearance, refreshClock, clearClock } from './composables/useView.js'
import { meta } from './utils/config.js'
import TurnstileGate from './components/TurnstileGate.vue'
const route = useRoute(), router = useRouter(), media = matchMedia('(max-width:700px)')
const title = computed(() => firstConfig.value.site_title || meta('siteTitle') || 'CF-Server-Monitor')
const views = computed(() => [{ key: 'bar', label: text('条形图', 'Bars') }, { key: 'ring', label: text('环形图', 'Rings') }, { key: 'list', label: text('列表', 'List') }, ...(!mobile.value ? [{ key: 'map', label: text('地图', 'Map') }] : [])])
function switchView(value) { setView(value); if (route.params.id) router.push('/') }
const syncMobile = () => { mobile.value = media.matches }
watch(() => [state.ready, route.fullPath], () => { if (state.ready) { setPage(route.params.id ? { id: String(route.params.id), site: Number(route.query.site || 0) } : {}); window.scrollTo(0, 0) } })
watch(() => state.sites.map(site => site.servers), refreshClock)
onMounted(async () => { document.addEventListener('visibilitychange', onVisibility); media.addEventListener('change', syncMobile); await initialize(); if (state.ready) applyAppearance(firstConfig.value) })
onBeforeUnmount(() => { document.removeEventListener('visibilitychange', onVisibility); media.removeEventListener('change', syncMobile); clearClock(); dispose() })
</script>
<template>
  <main class="monitor-shell">
    <header class="terminal-panel"><div class="window-bar"><div class="window-brand"><span class="window-dots" aria-hidden="true"><i/><i/><i/></span><RouterLink to="/" class="site-title">{{ title }}</RouterLink></div><div class="toolbar"><nav class="header-views" :aria-label="text('显示样式', 'Views')"><button v-for="view in views" :key="view.key" :aria-pressed="layout === view.key" @click="switchView(view.key)">{{ view.label }}</button></nav><button class="mobile-hidden" :aria-pressed="language === 'en'" @click="setLanguage('en')">EN</button><button class="mobile-hidden" :aria-pressed="language === 'zh'" @click="setLanguage('zh')">中</button><button :aria-label="text('切换深浅色', 'Toggle color mode')" @click="toggleAppearance">☾</button></div></div><div v-if="!route.params.id" class="filter-row"><button :aria-pressed="!country" @click="country = ''">{{ text('全部', 'All') }} {{ nodes.length }}</button><button v-for="code in regions" :key="code" :aria-pressed="country === code" @click="country = country === code ? '' : code"><img class="country-flag" :src="`${nodes.find(item => region(item.server.region) === code)?.site.base || state.sites[0].base}/flags/${code.toLowerCase()}.svg`" alt="">{{ code }} <small>{{ nodes.filter(item => region(item.server.region) === code).length }}</small></button></div></header>
    <aside v-if="themeOptions.notice" class="notice terminal-panel">{{ themeOptions.notice }}</aside>
    <p v-if="state.error" role="alert" class="error terminal-panel">{{ state.error }}</p>
    <div v-for="site in state.sites.filter(item => item.expired)" :key="site.base" class="terminal-panel timeout-banner"><div><strong>{{ t('paused') }}</strong><p>{{ t('budget') }}</p></div><button @click="continueLive(site)">{{ t('continue') }}</button></div>
    <RouterView v-if="state.ready"/><p v-else-if="!state.error" class="terminal-panel empty">{{ t('loading') }}</p>
    <footer><a href="https://github.com/guboysky/CF-Server" target="_blank" rel="noopener">HUILANG THEME · CF</a><span>·</span><a href="https://github.com/huilang-me/CF-Server-Monitor/" target="_blank" rel="noopener">Powered by CF-Server-Monitor <span v-if="firstConfig.version">{{ firstConfig.version }}</span></a><span class="footer-note">{{ text('WebSocket 实时推送', 'WebSocket live updates') }}</span></footer>
  </main><TurnstileGate/>
</template>
