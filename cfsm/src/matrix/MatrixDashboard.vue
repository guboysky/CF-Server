<script setup>
import { computed, ref, watch } from 'vue'
import { nodes, country, now, region } from '../composables/useView.js'
import { state } from '../composables/useMonitor.js'
import { themeOptions } from '../composables/useTheme.js'
import { running, memory, size, percentage, ratio, virtualization, monthlyPrice } from './data.js'
import { daysLeft } from '../utils/display.js'
import MatrixMap from './MatrixMap.vue'
import MatrixCard from './MatrixCard.vue'
import Sparkline from './Sparkline.vue'
import Icon from '../components/Icon.vue'
const search = ref(''), status = ref('all'), order = ref('default')
const collapsed = ref(localStorage.getItem('cfsm-matrix:map') === 'hidden')
function toggleMap() { collapsed.value = !collapsed.value; localStorage.setItem('cfsm-matrix:map',collapsed.value ? 'hidden' : 'shown') }
const onlineNodes = computed(()=>nodes.value.filter(item=>running(item.server,now.value)))
const sum = (field, active=false) => (active ? onlineNodes.value : nodes.value).reduce((total,item)=>total+(Number(item.server[field])||0),0)
const types = field => Object.entries(nodes.value.reduce((result,item)=>{const key=field(item.server);result[key]=(result[key]||0)+1;return result},{}))
const highest = computed(()=>onlineNodes.value.reduce((best,item)=>Number(item.server.cpu)>Number(best?.server.cpu||-1)?item:best,null))
const transfer = computed(()=>sum('net_in_speed',true)), upload = computed(()=>sum('net_out_speed',true))
const speeds = ref([]), uploads = ref([])
watch(()=>[transfer.value,upload.value],([rx,tx])=>{speeds.value=[...speeds.value,rx].slice(-48);uploads.value=[...uploads.value,tx].slice(-48)},{immediate:true})
const fees = computed(()=>{
  const grouped={}
  for(const item of nodes.value) { if(item.site.sysConfig.show_price===false || themeOptions.value.show_price===false)continue; const price=monthlyPrice(item.server); if(price===null)continue;const key=item.server.currency||'未标币种';grouped[key]??={value:0,count:0};grouped[key].value+=price;grouped[key].count++ }
  return Object.entries(grouped).map(([currency,item])=>({currency,...item}))
})
const primaryFee = computed(()=>fees.value.find(item=>item.currency==='CNY'||item.currency==='¥')||fees.value[0])
const feeSymbol = currency => ({CNY:'¥',USD:'US$',EUR:'€',GBP:'£',HKD:'HK$'})[currency] || currency
const expirations = computed(()=>nodes.value.filter(item=>item.site.sysConfig.show_expire!==false && daysLeft(item.server.expire_date,now.value)!==null).sort((a,b)=>daysLeft(a.server.expire_date,now.value)-daysLeft(b.server.expire_date,now.value)))
const filtered = computed(()=>{
  const needle=search.value.trim().toLowerCase()
  const values=nodes.value.filter(item=>(!country.value||region(item.server.region)===country.value)&&(!needle||[item.server.name,item.server.arch,item.server.region,item.server.note,item.server.server_group].join(' ').toLowerCase().includes(needle))&&(status.value==='all'||running(item.server,now.value)===(status.value==='online')))
  const sort={cpu:(a,b)=>Number(b.server.cpu||0)-Number(a.server.cpu||0),memory:(a,b)=>(ratio(b.server.ram_used,b.server.ram_total)||0)-(ratio(a.server.ram_used,a.server.ram_total)||0),expiry:(a,b)=>(daysLeft(a.server.expire_date,now.value)??Infinity)-(daysLeft(b.server.expire_date,now.value)??Infinity),name:(a,b)=>String(a.server.name).localeCompare(String(b.server.name))}[order.value]
  return sort?values.sort(sort):values
})
const daily = field => nodes.value.some(item=>item.server[field]!==undefined) ? size(sum(field)) : '—'
</script>
<template><div class="home-page"><div class="map-toggle"><button @click="toggleMap">{{ collapsed ? '展开地球' : '收起地球' }}</button></div><MatrixMap v-if="!collapsed" :items="nodes"/>
<section v-if="themeOptions.show_summary!==false" class="overview-grid">
 <article class="box overview"><div class="spread"><label><Icon name="server"/>节点总览</label><small>{{ percentage(nodes.length ? onlineNodes.length/nodes.length*100 : null) }} 在线</small></div><strong>{{ onlineNodes.length }}<small> / {{ nodes.length }}</small></strong><p :class="nodes.length-onlineNodes.length?'warn':'muted'">{{ nodes.length-onlineNodes.length ? `${nodes.length-onlineNodes.length} 台离线待机`:'全部在线 · 实时守护' }}</p></article>
 <article class="box overview architectures"><div class="spread"><label><Icon name="network"/>类型与架构</label><small class="chip">共 {{ nodes.length }} 台</small></div><div class="spread"><span>虚拟化</span><span><b v-for="[key,value] in types(virtualization)" :key="key" class="chip">{{ key }} {{ value }}</b></span></div><div class="spread"><span>系统架构</span><span><b v-for="[key,value] in types(s=>s.arch||'未知')" :key="key" class="chip">{{ key }} {{ value }}</b></span></div></article>
 <article class="box overview"><label><Icon name="cpu"/>CPU 核心</label><strong>{{ sum('cpu_cores') }}<small> 核</small></strong><p>在线均载 {{ percentage(onlineNodes.length?sum('cpu',true)/onlineNodes.length:null) }} · {{ onlineNodes.length }} 台机器</p></article>
 <article class="box overview"><label><Icon name="pulse"/>最高负载</label><strong>{{ percentage(highest?.server.cpu) }}</strong><p>{{ highest?.server.name || '暂无在线节点' }}</p></article>
 <article class="box overview"><label><Icon name="memory"/>物理内存</label><strong>{{ memory(sum('ram_total')) }}</strong><div class="spread"><span>已用 {{ memory(sum('ram_used')) }}</span><small>{{ percentage(ratio(sum('ram_used'),sum('ram_total'))) }}</small></div><div class="track"><i :style="{width:`${ratio(sum('ram_used'),sum('ram_total'))||0}%`}"/></div></article>
 <article class="box overview"><label><Icon name="disk"/>系统存储</label><strong>{{ memory(sum('disk_total')) }}</strong><div class="spread"><span>已用 {{ memory(sum('disk_used')) }}</span><small>{{ percentage(ratio(sum('disk_used'),sum('disk_total'))) }}</small></div><div class="track"><i :style="{width:`${ratio(sum('disk_used'),sum('disk_total'))||0}%`}"/></div></article>
 <article class="box overview overview-speed"><label><Icon name="pulse"/>实时网速</label><div class="spread"><b>↓ {{ size(transfer) }}/s</b><b>↑ {{ size(upload) }}/s</b></div><div class="speed-sparks"><Sparkline :values="speeds" fill/><Sparkline :values="uploads" color="#888"/></div></article>
 <article class="box overview"><label><Icon name="traffic"/>今日与累计流量</label><div class="spread"><b>↓ {{ daily('net_rx_daily') }}</b><b>↑ {{ daily('net_tx_daily') }}</b></div><small class="muted">{{ daily('net_rx_daily')==='—' ? '今日数据未提供' : '今日累计' }}</small><p>总计累计</p><div class="spread muted"><span>↓ {{ size(sum('net_rx')) }}</span><span>↑ {{ size(sum('net_tx')) }}</span></div></article>
</section>
<section class="finance-grid"><article class="box fees"><div class="section-heading spread"><label><Icon name="wallet"/>所有费用累计</label><small class="chip">{{ fees.reduce((sum,item)=>sum+item.count,0) }} 台计费</small></div><div class="fee-body"><div><strong>{{ primaryFee ? `${feeSymbol(primaryFee.currency)}${primaryFee.value.toFixed(2)}` : '—' }}<small> / 月</small></strong><p>{{ primaryFee ? `折合 ${feeSymbol(primaryFee.currency)}${(primaryFee.value*12).toFixed(2)} / 年` : '暂无可用计费数据' }}</p></div><div class="fee-currencies"><span v-for="item in fees" :key="item.currency" class="chip">{{ item.currency }}: {{ feeSymbol(item.currency) }}{{ item.value.toFixed(2) }}/月（{{ item.count }}台）</span></div></div><small v-if="fees.length>1" class="muted">按币种分别统计</small></article><article class="box expiry"><div class="section-heading spread"><label><Icon name="calendar"/>到期时间排行榜</label><small>共 {{ expirations.length }} 台设置到期日</small></div><RouterLink v-for="(item,index) in expirations.slice(0,4)" :key="item.server.id" :to="{path:`/server/${item.server.id}`,query:{site:item.siteIndex}}"><span><b class="chip">{{ index+1 }}</b><img v-if="region(item.server.region)" class="flag" :src="`${item.site.base}/flags/${region(item.server.region).toLowerCase()}.svg`" alt="">{{ item.server.name }}</span><small class="chip">剩 {{ daysLeft(item.server.expire_date,now) }} 天</small></RouterLink><p v-if="!expirations.length" class="muted">暂无设置到期日的节点</p></article></section>
<div class="fleet-toolbar box"><label class="search"><Icon name="search"/><input v-model="search" placeholder="搜索节点名 / 架构 / 地区 / 备注…" aria-label="搜索节点"></label><div class="segmented"><button v-for="option in [{key:'all',label:`全部 (${nodes.length})`},{key:'online',label:'在线'},{key:'offline',label:`离线 (${nodes.length-onlineNodes.length})`}]" :key="option.key" :aria-pressed="status===option.key" @click="status=option.key">{{ option.label }}</button></div><button v-if="country" @click="country=''">{{ country }} × 清除地区</button><label class="sort">↕ <select v-model="order" aria-label="排序"><option value="default">默认顺序</option><option value="cpu">CPU 负载</option><option value="memory">内存占用</option><option value="expiry">到期时间</option><option value="name">节点名称</option></select></label></div>
<section class="matrix-cards"><MatrixCard v-for="item in filtered" :key="`${item.siteIndex}:${item.server.id}`" v-bind="item"/></section><p v-if="!filtered.length" class="box empty">{{ state.loading ? '正在连接探针…' : '暂无匹配节点' }}</p></div></template>
