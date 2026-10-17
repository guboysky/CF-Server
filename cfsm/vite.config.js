import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  return { base: './', plugins: [vue(), {
    name: 'cfsm-metadata',
    transformIndexHtml: () => Object.entries({ apiBase: env.API_BASE, siteTitle: env.TITLE, backgroundImage: env.BACKGROUND_IMAGE }).filter(([, value]) => value).map(([name, content]) => ({ tag: 'meta', attrs: { name, content }, injectTo: 'head' })),
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'assets/LICENSE.txt', source: ['../LICENSE', '../LICENSE-CF', './docs/LICENSE-adapter.txt', './node_modules/@fontsource-variable/inter/LICENSE'].map(path => readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n\n') }) }
  }], build: { assetsDir: 'assets', emptyOutDir: true } }
})
