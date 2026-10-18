import { computed, ref } from 'vue'
import { state } from './useMonitor.js'
import { meta } from '../utils/config.js'
export const localeOverride = ref(''), appearanceOverride = ref('')
export const firstConfig = computed(() => state.sites[0]?.config || {})
export const themeOptions = computed(() => ({ layout: 'bar', panel_opacity: 0.72, show_summary: true, show_price: true, show_latency: true, background_url: '', ...firstConfig.value.theme_options }))
const words = {
  zh: { overview: '总览', fleet: '服务器监控', intro: '所有节点，尽在掌握。', total: '全部节点', online: '在线', offline: '离线', search: '搜索节点、地区或分组…', all: '全部分组', cpu: 'CPU', ram: '内存', disk: '磁盘', swap: '交换内存', download: '下载', upload: '上传', history: '历史趋势', back: '返回总览', admin: '管理', loading: '正在载入…', empty: '没有匹配的节点', timeout: '超时', paused: '实时连接已暂停', continue: '继续实时监控', budget: '已达到站点设置的实时连接时长，最后一次数据已保留。', settings: '主题选项', save: '保存至站点', density: '紧凑卡片', network: '显示网络图表', saved: '已保存', latency: '延迟', loss: '丢包', traffic: '累计流量', details: '节点详情', live: '实时连接', disconnected: '连接已断开', emptyStatus: '暂无节点', verify: '完成验证以继续', cancel: '取消', retry: '重试验证', noHistory: '暂无历史数据', updated: '最近上报', groups: '节点分组', free: '免费' },
  en: { overview: 'Overview', fleet: 'Server monitor', intro: 'Every node. One clear view.', total: 'Total nodes', online: 'Online', offline: 'Offline', search: 'Search nodes, regions or groups…', all: 'All groups', cpu: 'CPU', ram: 'Memory', disk: 'Disk', swap: 'Swap', download: 'Download', upload: 'Upload', history: 'History', back: 'Back to overview', admin: 'Admin', loading: 'Loading…', empty: 'No matching nodes', timeout: 'Timeout', paused: 'Live connection paused', continue: 'Continue monitoring', budget: 'The configured connection duration was reached. Last received data is preserved.', settings: 'Theme options', save: 'Save to site', density: 'Compact cards', network: 'Show network charts', saved: 'Saved', latency: 'Latency', loss: 'Loss', traffic: 'Total traffic', details: 'Node details', live: 'Live', disconnected: 'Disconnected', emptyStatus: 'No nodes', verify: 'Complete verification to continue', cancel: 'Cancel', retry: 'Retry verification', noHistory: 'No history yet', updated: 'Last report', groups: 'Node groups', free: 'Free' }
}
words.es = { overview: 'Resumen', fleet: 'Monitor de servidores', intro: 'Todos los nodos, en una sola vista.', total: 'Nodos totales', online: 'En línea', offline: 'Sin conexión', search: 'Buscar nodos, regiones o grupos…', all: 'Todos los grupos', cpu: 'CPU', ram: 'Memoria', disk: 'Disco', swap: 'Intercambio', download: 'Descarga', upload: 'Subida', history: 'Historial', back: 'Volver al resumen', admin: 'Administración', loading: 'Cargando…', empty: 'No hay nodos coincidentes', timeout: 'Tiempo agotado', paused: 'Conexión en vivo pausada', continue: 'Continuar monitorizando', budget: 'Se alcanzó la duración configurada. Se conservan los últimos datos.', settings: 'Opciones del tema', save: 'Guardar en el sitio', density: 'Tarjetas compactas', network: 'Mostrar gráficos de red', saved: 'Guardado', latency: 'Latencia', loss: 'Pérdida', traffic: 'Tráfico total', details: 'Detalles del nodo', live: 'En vivo', disconnected: 'Desconectado', emptyStatus: 'Sin nodos', verify: 'Completa la verificación para continuar', cancel: 'Cancelar', retry: 'Reintentar', noHistory: 'Sin historial', updated: 'Último informe', groups: 'Grupos de nodos', free: 'Gratis' }
Object.assign(words.zh, { onlineNodes: '在线节点', highLoadNodes: '高负载节点', allOnline: '全部在线', snapshot: '最近列表快照', highLoadRule: 'CPU ≥80% 或内存 ≥90%', realtimeSpeed: '实时速率', allNodes: '全部节点', highLoad: '高负载', expiring: '即将到期', cardView: '卡片视图', tableView: '列表视图', compactView: '紧凑视图', favorite: '收藏节点', favorites: '收藏', status: '状态', os: '系统', node: '节点', information: '信息', uptime: '运行时间', transfer: '流量', days: '天', remaining: '剩余', remainingDate: '剩余日期', threeNet: '三网', noSample: '无数据', hasSample: '有采样', deviceInfo: '设备信息', architecture: '架构', cores: '核心', kernel: '内核版本', cpuAndLoad: 'CPU 与负载', memorySwap: '内存与 Swap', ramTotal: 'RAM 总量', swapTotal: 'Swap 总量', diskUsed: '磁盘已用', diskTotal: '磁盘总量', realtimeNetwork: '实时网络', connections: '网络连接', processes: '进程', capacity: '容量', samples: '采样值', load: '负载', sampleCoverage: '历史采样覆盖', coverageHint: '仅反映当前历史范围内是否有实际采样，不代表近 7 天在线率。', sharedHistory: '共用当前历史范围', realtime: '实时', toggleAppearance: '切换深浅色', close: '关闭', preferencesNote: '布局和收藏保存在本次页面中；点击保存至站点可同步到服务端（需要登录）。' })
Object.assign(words.en, { onlineNodes: 'Online nodes', highLoadNodes: 'High load nodes', allOnline: 'All nodes online', snapshot: 'Latest list snapshot', highLoadRule: 'CPU ≥80% or memory ≥90%', realtimeSpeed: 'Live speed', allNodes: 'All nodes', highLoad: 'High load', expiring: 'Expiring soon', cardView: 'Card view', tableView: 'List view', compactView: 'Compact view', favorite: 'Favorite node', favorites: 'Favorites', status: 'Status', os: 'OS', node: 'Node', information: 'Information', uptime: 'Uptime', transfer: 'Traffic', days: 'days', remaining: 'Remaining', remainingDate: 'Remaining / price', threeNet: 'Probes', noSample: 'No data', hasSample: 'Sample present', deviceInfo: 'Device information', architecture: 'Architecture', cores: 'Cores', kernel: 'Kernel version', cpuAndLoad: 'CPU & load', memorySwap: 'Memory & Swap', ramTotal: 'RAM total', swapTotal: 'Swap total', diskUsed: 'Disk used', diskTotal: 'Disk total', realtimeNetwork: 'Live network', connections: 'Connections', processes: 'Processes', capacity: 'Capacity', samples: 'Samples', load: 'Load', sampleCoverage: 'History sample coverage', coverageHint: 'Shows actual samples in the selected range, not seven-day uptime.', sharedHistory: 'Shared history range', realtime: 'Live', toggleAppearance: 'Toggle appearance', close: 'Close', preferencesNote: 'Layout and favorites stay in this page session. Save to site syncs them to the server (login required).' })
Object.assign(words.es, { onlineNodes: 'Nodos en línea', highLoadNodes: 'Nodos con carga alta', allOnline: 'Todos en línea', snapshot: 'Última lista', highLoadRule: 'CPU ≥80% o memoria ≥90%', realtimeSpeed: 'Velocidad actual', allNodes: 'Todos los nodos', highLoad: 'Carga alta', expiring: 'Próximos a vencer', cardView: 'Tarjetas', tableView: 'Lista', compactView: 'Vista compacta', favorite: 'Marcar favorito', favorites: 'Favoritos', status: 'Estado', os: 'Sistema', node: 'Nodo', information: 'Información', uptime: 'Tiempo activo', transfer: 'Tráfico', days: 'días', remaining: 'Restante', remainingDate: 'Restante / precio', threeNet: 'Sondas', noSample: 'Sin datos', hasSample: 'Con muestras', deviceInfo: 'Información del dispositivo', architecture: 'Arquitectura', cores: 'Núcleos', kernel: 'Versión del kernel', cpuAndLoad: 'CPU y carga', memorySwap: 'Memoria y Swap', ramTotal: 'RAM total', swapTotal: 'Swap total', diskUsed: 'Disco usado', diskTotal: 'Disco total', realtimeNetwork: 'Red en vivo', connections: 'Conexiones', processes: 'Procesos', capacity: 'Capacidad', samples: 'Muestras', load: 'Carga', sampleCoverage: 'Cobertura de muestras', coverageHint: 'Muestras reales del rango elegido; no representa disponibilidad de siete días.', sharedHistory: 'Rango de historial compartido', realtime: 'En vivo', toggleAppearance: 'Cambiar apariencia', close: 'Cerrar', preferencesNote: 'Diseño y favoritos se conservan en esta sesión. Guardar sincroniza con el servidor y requiere iniciar sesión.' })
export const language = computed(() => {
  const configured = localeOverride.value || firstConfig.value.default_language || 'auto'
  return configured === 'auto' ? (navigator.language.startsWith('zh') ? 'zh' : 'en') : configured
})
Object.assign(words.zh, { providerHint: '由节点名称或接口返回的备注识别；非额外查询', previousNode: '上一节点', nextNode: '下一节点', switchNode: '切换节点', speed: '速度', connectionCount: '连接数', note: '备注', backgroundHint: '背景图片可在后台「设置 → 外观」中填写图片地址或上传，也支持单独设置手机背景。' })
Object.assign(words.en, { providerHint: 'Inferred from node name or returned note; no extra query', previousNode: 'Previous node', nextNode: 'Next node', switchNode: 'Switch node', speed: 'Speed', connectionCount: 'Connections', note: 'Note', backgroundHint: 'Set or upload desktop and mobile backgrounds in administration → Settings → Appearance.' })
Object.assign(words.es, { providerHint: 'Identificado por nombre o nota; sin consultas adicionales', previousNode: 'Nodo anterior', nextNode: 'Nodo siguiente', switchNode: 'Cambiar nodo', speed: 'Velocidad', connectionCount: 'Conexiones', note: 'Nota', backgroundHint: 'Configura o sube fondos de escritorio y móvil en Administración → Ajustes → Apariencia.' })
export const t = key => (words[language.value] || words.en)[key] || key
export function applyAppearance(config) {
  document.title = config.site_title || meta('siteTitle') || document.title
  const media = matchMedia('(prefers-color-scheme: dark)')
  const apply = () => document.documentElement.classList.toggle('dark', (appearanceOverride.value || config.preferred_theme) === 'dark' || ((!(appearanceOverride.value || config.preferred_theme) || (appearanceOverride.value || config.preferred_theme) === 'auto') && media.matches))
  apply(); media.addEventListener('change', apply)
  document.documentElement.lang = language.value
  const background = () => {
    const value = matchMedia('(max-width: 640px)').matches && config.custom_bg_mobile ? config.custom_bg_mobile : config.custom_bg || meta('backgroundImage') || themeOptions.value.background_url
    document.body.style.backgroundImage = value ? `url(${JSON.stringify(value)})` : ''
    document.body.classList.toggle('has-wallpaper', Boolean(value))
  }
  document.body.style.setProperty('--panel-opacity', String(Math.max(0.3, Math.min(1, Number(themeOptions.value.panel_opacity) || 0.72))))
  background(); window.addEventListener('resize', background)
  // Only backend administrator supplied HTML/scripts are inserted here.
  const scriptElement = element => {
    const script = document.createElement('script')
    for (const attr of element.attributes) script.setAttribute(attr.name, attr.value)
    script.textContent = element.textContent
    script.onerror = () => { state.error = `Failed to load custom script: ${script.src}` }
    return script
  }
  const appendHtml = (html, target) => {
    const template = document.createElement('template')
    template.innerHTML = html
    for (const element of template.content.querySelectorAll('script')) element.replaceWith(scriptElement(element))
    target.append(template.content)
  }
  if (config.custom_head) appendHtml(config.custom_head, document.head)
  if (config.custom_script) {
    if (/<script\b/i.test(config.custom_script)) appendHtml(config.custom_script, document.body)
    else {
      const source = document.createElement('script')
      source.textContent = config.custom_script
      document.body.append(scriptElement(source))
    }
  }
}
