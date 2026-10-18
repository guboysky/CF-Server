<script setup>
import { computed } from 'vue'
import { probeNumber, probeValueText, selectProbeBlocks } from '../utils/probes.js'
import { probeTone } from '../utils/display.js'
import { timestamp } from '../utils/metrics.js'
const props=defineProps({values:{type:Array,default:()=>[]},label:String,loss:Boolean})
const blocks=computed(()=>selectProbeBlocks(props.values,props.loss))
function tone(point){return point.missing?'absent':probeTone(point.value,props.loss)}
function title(point){
 if(point.missing)return '暂无采样'
 const time=timestamp(point.time),value=point.value===null?(props.loss?'未返回丢包率':'超时'):probeNumber(point.value)===null?'无采样':probeValueText(point.value,props.loss)
 return `${value}${time?' · '+new Date(time).toLocaleTimeString('zh-CN',{hour12:false}):''}`
}
</script>
<template><span class="probe-strip" :style="{gridTemplateColumns:`repeat(${blocks.length},minmax(0,1fr))`}" role="img" :aria-label="label"><i v-for="(point,index) in blocks" :key="index" :class="tone(point)" :title="title(point)"/></span></template>
