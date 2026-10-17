<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { timeTicks, niceCeiling, tickLabel } from '../utils/chart.js'
import { timestamp } from '../utils/metrics.js'
import { number, size } from './data.js'
const props = defineProps({ title: String, subtitle: String, series: {type:Array,default:()=>[]}, times: {type:Array,default:()=>[]}, unit: String, max: Number, zoom: Boolean, logarithmic: Boolean, trim: Boolean, floating: Boolean, timeouts: Boolean, gapMs: Number, height: {type:Number,default:210} })
const plot=ref(null), width=ref(900), hover=ref(null), start=ref(0), end=ref(100), hidden=ref([])
let observer
onMounted(()=>{observer=new ResizeObserver(entries=>width.value=Math.max(200,entries[0].contentRect.width));observer.observe(plot.value)})
onBeforeUnmount(()=>observer?.disconnect())
const indices = computed(()=>props.times.map((_,i)=>i).filter(i=>i>=Math.floor(start.value/100*Math.max(0,props.times.length-1))&&i<=Math.ceil(end.value/100*Math.max(0,props.times.length-1))))
const shown=computed(()=>props.series.map((s,index)=>({...s,index,color:s.color||['#181818','#888','#bbb'][index%3]})).filter(s=>!hidden.value.includes(s.index)))
const valid = computed(()=>shown.value.flatMap(s=>indices.value.map(i=>number(s.values[i])).filter(v=>v!==null)))
const bounds=computed(()=>({left:props.unit==='bytes'||props.unit==='speed'?70:50,right:width.value-20,top:18,bottom:props.height-30}))
const limits=computed(()=>{
  const sorted=[...valid.value].sort((a,b)=>a-b), upper=props.trim&&sorted.length>10?sorted[Math.floor((sorted.length-1)*.98)]:Math.max(1,...sorted)
  const low=props.floating&&sorted.length?Math.max(0,Math.floor(sorted[0]/15)*15):0
  return {min:low,max:Math.max(low+1,(props.max?Math.max(props.max,upper):0)||(props.logarithmic ? 1024*10**Math.ceil(Math.log10(Math.max(1,upper/1024))) : niceCeiling(upper)))}
})
const transform=value=>props.logarithmic?Math.log10(1+value):value
const y=value=>bounds.value.bottom-(transform(Math.max(limits.value.min,Math.min(limits.value.max,value)))-transform(limits.value.min))/(transform(limits.value.max)-transform(limits.value.min))*(bounds.value.bottom-bounds.value.top)
const stamps=computed(()=>props.times.map(timestamp))
const first=computed(()=>stamps.value[indices.value[0]]||0), last=computed(()=>stamps.value[indices.value.at(-1)]||first.value)
const x=i=>bounds.value.left+(last.value>first.value?(stamps.value[i]-first.value)/(last.value-first.value):.5)*(bounds.value.right-bounds.value.left)
const gap=computed(()=>{if(props.gapMs>0)return props.gapMs;const differences=stamps.value.slice(1).map((v,i)=>v-stamps.value[i]).filter(v=>v>0).sort((a,b)=>a-b);return differences.length?differences[Math.floor(differences.length/2)]*3:Infinity})
const lines=computed(()=>shown.value.map(s=>{
 const segments=[];let points=[],previous=null
 const finish=()=>{if(points.length)segments.push(points);points=[]}
 for(const i of indices.value){const value=number(s.values[i]);if(value===null){finish();previous=null;continue}if(previous!==null&&stamps.value[i]-stamps.value[previous]>gap.value)finish();points.push([x(i),y(value)]);previous=i}finish()
 return {...s,paths:segments.map(points=>({line:points.map((p,i)=>`${i?'L':'M'}${p.map(n=>n.toFixed(2)).join(',')}`).join(' '),area:`M${points[0][0]},${bounds.value.bottom} L${points.map(p=>p.join(',')).join(' L')} L${points.at(-1)[0]},${bounds.value.bottom} Z`,points}))}
}))
const ticks=computed(()=>timeTicks(first.value,last.value,bounds.value.right-bounds.value.left))
const label=value=>props.unit==='bytes'?size(value):props.unit==='speed'?`${size(value)}/s`:props.unit==='%'&&value>0&&value<.01?'<0.01%':`${Number(value.toFixed(props.unit==='%'?2:1))}${props.unit||''}`
const yTicks=computed(()=>props.logarithmic ? [0,...Array.from({length:10},(_,i)=>1024*10**i).filter(value=>value<=limits.value.max)].map(value=>({value,y:y(value)})) : Array.from({length:5},(_,i)=>{const value=limits.value.min+(limits.value.max-limits.value.min)*i/4;return {value,y:y(value)}}))
const tooltipLeft=computed(()=>Math.max(4,Math.min(width.value-220,x(hover.value??0)+12)))
function pointer(event){const rect=event.currentTarget.getBoundingClientRect(),point=event.clientX-rect.left;hover.value=indices.value.reduce((best,i)=>best===null||Math.abs(x(i)-point)<Math.abs(x(best)-point)?i:best,null)}
function toggle(index){hidden.value=hidden.value.includes(index)?hidden.value.filter(v=>v!==index):[...hidden.value,index]}
function range(which,event){const value=Number(event.target.value);if(which==='start')start.value=Math.min(value,end.value-1);else end.value=Math.max(value,start.value+1);hover.value=null}
</script>
<template><article class="matrix-plot box chart-card"><div class="plot-heading"><strong>{{ title }}</strong><small>{{ subtitle }}</small></div><div ref="plot" class="plot-area" :style="{height:`${height}px`}" @pointerleave="hover=null"><svg :viewBox="`0 0 ${width} ${height}`" role="img" :aria-label="title" @pointermove="pointer"><g v-for="tick in yTicks" :key="tick.value"><line :x1="bounds.left" :x2="bounds.right" :y1="tick.y" :y2="tick.y" class="plot-grid"/><text :x="bounds.left-10" :y="tick.y+4" text-anchor="end">{{ label(tick.value) }}</text></g><g v-for="line in lines" :key="line.index"><g v-for="(path,index) in line.paths" :key="index"><path v-if="line.fill" :d="path.area" :fill="line.color" opacity=".17"/><path :d="path.line" :stroke="line.color" :stroke-dasharray="line.dash" fill="none" stroke-width="1.35" vector-effect="non-scaling-stroke"/><circle v-if="path.points.length===1" :cx="path.points[0][0]" :cy="path.points[0][1]" r="2" :fill="line.color"/></g></g><text v-for="tick in ticks" :key="tick.value" :x="bounds.left+tick.ratio*(bounds.right-bounds.left)" :y="height-7" text-anchor="middle">{{ tickLabel(tick) }}</text><g v-if="hover!==null"><line :x1="x(hover)" :x2="x(hover)" :y1="bounds.top" :y2="bounds.bottom" class="crosshair"/><circle v-for="s in shown.filter(s=>number(s.values[hover])!==null)" :key="s.index" :cx="x(hover)" :cy="y(Number(s.values[hover]))" r="3" :fill="s.color" stroke="var(--panel)"/></g></svg><div v-if="hover!==null" class="plot-tooltip chart-tooltip" :style="{left:`${tooltipLeft}px`}"><b>{{ new Date(stamps[hover]).toLocaleString('zh-CN',{hour12:false}) }}</b><div v-for="s in shown" :key="s.index" :style="{color:s.color}">{{ s.label }}: {{ s.values[hover]===null&&timeouts?'超时':number(s.values[hover])===null?'—':label(Number(s.values[hover])) }}</div></div><p v-if="!valid.length" class="plot-empty">暂无有效历史数据</p></div><div v-if="series.length>1" class="plot-legend"><button v-for="(s,index) in series" :key="index" :aria-pressed="!hidden.includes(index)" @click="toggle(index)"><i :style="{background:s.color||['#181818','#888','#bbb'][index%3]}"/>{{ s.label }}</button></div><div v-if="zoom" class="plot-brush"><span>{{ first ? new Date(first).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}) : '—:—' }}</span><div class="brush-track"><div :style="{left:`${start}%`,right:`${100-end}%`}"/><input type="range" min="0" max="99" :value="start" aria-label="时间区间起点" @input="range('start',$event)"><input type="range" min="1" max="100" :value="end" aria-label="时间区间终点" @input="range('end',$event)"></div><span>{{ last ? new Date(last).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}) : '—:—' }}</span><button @click="start=0;end=100">重置</button></div></article></template>
