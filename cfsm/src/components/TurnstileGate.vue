<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { verification, completeChallenge, cancelChallenge } from '../utils/http.js'
import { t } from '../composables/useTheme.js'
const active = computed(() => verification.queue[0])
const container = ref(null), error = ref('')
let scriptPromise, widget
function loadScript() {
  if (window.turnstile) return Promise.resolve()
  return scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.onload = resolve
    script.onerror = () => { scriptPromise = null; reject(new Error('Unable to load Cloudflare Turnstile')) }
    document.head.append(script)
  })
}
async function render() {
  error.value = ''
  if (widget !== undefined) { window.turnstile?.remove(widget); widget = undefined }
  if (!active.value) return
  try {
    await nextTick(); await loadScript()
    if (!active.value || !container.value) return
    widget = window.turnstile.render(container.value, { sitekey: active.value.site.config.turnstile_site_key, callback: completeChallenge, 'error-callback': () => { error.value = 'Turnstile verification failed' }, 'expired-callback': () => window.turnstile.reset(widget) })
  } catch (e) { error.value = e.message }
}
watch(active, render)
</script>
<template><div v-if="active" class="overlay"><section class="dialog" role="dialog" aria-modal="true" :aria-label="t('verify')"><h2>{{ t('verify') }}</h2><p class="muted">{{ active.site.base }}</p><div ref="container"></div><p v-if="error" role="alert" class="error">{{ error }}</p><div class="actions"><button v-if="error" @click="render">{{ t('retry') }}</button><button @click="cancelChallenge">{{ t('cancel') }}</button></div></section></div></template>
