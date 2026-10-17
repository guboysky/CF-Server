import { test } from 'node:test'
import assert from 'node:assert/strict'
import { average, maximum, minimum, monthlyPrice, counterDifference, activityBuckets, running, ratio } from '../src/matrix/data.js'
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
 assert.equal(counterDifference([{net_rx:100},{net_rx:120},{net_rx:5},{net_rx:15}],'net_rx'),30)
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
