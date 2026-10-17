<script setup>
import { computed } from 'vue'
const props=defineProps({title:String,value:Number,label:String,left:String,right:String,colors:{type:Array,default:()=>['#111','#888']}})
const value=computed(()=>props.value===null||!Number.isFinite(props.value)?null:Math.max(0,Math.min(100,props.value)))
</script>
<template><article class="box donut-panel"><strong>{{ title }}</strong><div class="donut-wrap"><svg viewBox="0 0 140 140" role="img" :aria-label="title"><circle cx="70" cy="70" r="49" fill="none" :stroke="colors[1]" stroke-width="20"/><circle v-if="value!==null" cx="70" cy="70" r="49" fill="none" :stroke="colors[0]" stroke-width="20" :stroke-dasharray="`${value/100*307.876} 307.876`" transform="rotate(-90 70 70)"/><text x="70" y="66" text-anchor="middle">{{ value===null?'—':`${Math.round(value)}%` }}</text><text x="70" y="84" text-anchor="middle" class="donut-label">{{ label }}</text></svg></div><div class="spread"><small><i :style="{background:colors[0]}"/>{{ left }}</small><small><i :style="{background:colors[1]}"/>{{ right }}</small></div></article></template>
