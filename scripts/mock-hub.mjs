// Development fixture only. Never included in the installable theme.
import http from 'node:http'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { demoNodes, demoMe } from '../src/lib/demo.ts'
const nodes = demoNodes.map((n,i) => i === 8 ? {...n, metrics:null, public_remark:'已连接，等待首次指标上报'} : n)
const server = http.createServer((req,res) => {
  const url = new URL(req.url,'http://localhost')
  res.setHeader('Content-Type','application/json')
  if(url.pathname === '/api/me') return res.end(JSON.stringify(demoMe))
  if(url.pathname === '/api/nodes') return res.end(JSON.stringify({nodes}))
  if(url.pathname === '/api/themes/huilang/config') return res.end('{}')
  if(/^\/api\/nodes\/\d+\/metrics$/.test(url.pathname)) {
    const end = Math.floor(Date.now()/60000)*60
    const metrics = Array.from({length:60},(_,i) => ({ts:end-(59-i)*60, minutes:1,cpu:15+Math.sin(i/5)*10,cpu_max:30,mem_used:1800000000,disk_used:20000000000,net_rx:1000000+i*10000,net_tx:700000,net_rx_max:2000000,net_tx_max:900000,swap_used:0,tcp:24,udp:3,procs:110}))
    const ping = [1,2,3].flatMap(task_id => metrics.map((m,i) => ({task_id,ts:m.ts,latency:40*task_id+Math.sin(i/4)*10,loss:0})))
    return res.end(JSON.stringify({step:60,metrics,ping,probes:{1:'电信',2:'联通',3:'移动'},loss:{}}))
  }
  res.writeHead(404); res.end('{}')
})
server.on('upgrade',(req,socket) => {
  if(!req.url.startsWith('/api/ws')) return socket.destroy()
  const key = createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+key+'\r\n\r\n')
  const zipped = req.url.includes('gzip')
  const push = () => {const raw = Buffer.from(JSON.stringify({nodes})); const data = zipped ? gzipSync(raw) : raw; const header = Buffer.alloc(4); header[0] = zipped ? 0x82 : 0x81; header[1] = 126; header.writeUInt16BE(data.length,2); socket.write(Buffer.concat([header,data]))}
  push(); const timer = setInterval(push,2000)
  socket.on('error',() => clearInterval(timer)); socket.on('close',() => clearInterval(timer)); socket.on('end',() => {clearInterval(timer); socket.end()})
})
server.listen(9911,'127.0.0.1',() => console.log('Development fixture: http://127.0.0.1:9911 (simulated nodes)'))
