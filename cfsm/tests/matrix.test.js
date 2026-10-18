import { test } from 'node:test'
import assert from 'node:assert/strict'
import { average, maximum, minimum, monthlyPrice, counterDifference, activityBuckets, running, ratio, trafficComposition, monthlyTransfers } from '../src/matrix/data.js'
test('matrix statistics preserve zero, exclude absent values and never sum different currencies',()=>{
 assert.equal(average([0,2,false,null,undefined]),1)
 assert.equal(maximum([0,false,null]),0);assert.equal(minimum([0,10]),0)
 assert.equal(average([false,null]),null)
 assert.equal(monthlyPrice({price:120,billing_cycle:'year'}),10)
 assert.equal(monthlyPrice({price:0,billing_cycle:'month'}),0)
 assert.equal(monthlyPrice({price:120,billing_cycle:'unknown'}),null)
 assert.equal(ratio(undefined,100),null)
 assert.equal(running({last_updated:null},1700000000000),false)
})
test('matrix counter deltas respect resets and need two valid points',()=>{
 assert.equal(counterDifference([{net_rx:100},{net_rx:120},{net_rx:5},{net_rx:15}],'net_rx'),35)
 assert.equal(counterDifference([{net_rx:0},{net_rx:10}],'net_rx'),10)
 assert.equal(counterDifference([{net_rx:10}],'net_rx'),null)
})
test('heatmap divides selected history into disjoint periods, leaves missing periods empty',()=>{
 const end=1700000000000,rows=[{timestamp:end-3600000,cpu:0},{timestamp:end-1800000,cpu:80},{timestamp:end,cpu:20}]
 const buckets=activityBuckets(rows,1,end,4)
 assert.deepEqual(buckets.map(item=>item.count),[1,0,1,1])
 assert.deepEqual(buckets.map(item=>item.cpu),[0,null,80,20])
 assert.equal(buckets.reduce((sum,item)=>sum+item.count,0),3)
})

test('traffic ring prefers real window counters, otherwise labels monthly or lifetime totals and matches download legend',()=>{
 const server={net_rx_monthly:300,net_tx_monthly:100,net_rx:1000,net_tx:1000}
 const monthly=trafficComposition([],server)
 assert.equal(monthly.source,'monthly');assert.equal(monthly.title,'本月流量构成');assert.equal(monthly.value,75);assert.equal(monthly.label,'下行占比')
 const window=trafficComposition([{net_rx:100,net_tx:100},{net_rx:200,net_tx:400}],server)
 assert.equal(window.source,'window');assert.equal(window.value,25);assert.equal(window.rx,100);assert.equal(window.tx,300)
 assert.equal(trafficComposition([],{net_rx:300,net_tx:100}).title,'累计流量构成')
 assert.equal(trafficComposition([{cpu:10},{net_rx:100,net_tx:100},{net_rx:200,net_tx:200}],server).source,'monthly')
 const zero=trafficComposition([],{net_rx_monthly:0,net_tx_monthly:0})
 assert.equal(zero.source,'monthly');assert.equal(zero.rx,0);assert.equal(zero.label,'暂无流量')
 assert.equal(trafficComposition([],{}).source,'missing');assert.equal(trafficComposition([],{}).rx,null)
})

test('monthly ranking sums both directions, includes real zeros and excludes partial or missing month counters',()=>{
 const nodes=[{server:{id:'a',net_rx_monthly:100,net_tx_monthly:200,traffic_calc_type:'max'}},{server:{id:'b',net_rx_monthly:500,net_tx_monthly:50}},{server:{id:'c',net_rx:999999,net_tx:999999}},{server:{id:'d',net_rx_monthly:0,net_tx_monthly:0}},{server:{id:'e',net_rx_monthly:10}}]
 const result=monthlyTransfers(nodes)
 assert.deepEqual(result.ranked.map(item=>item.server.id),['b','a','d']);assert.equal(result.total,850);assert.equal(result.rx,600);assert.equal(result.tx,250);assert.equal(result.count,3)
 assert.equal(monthlyTransfers([]).total,null)
})
