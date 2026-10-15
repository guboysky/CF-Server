# Huilang 终端主题 · CF-Server-Monitor 适配版

将同仓库 Huilang 1.0.13（原 monitor 平台）适配到 CF-Server-Monitor，独立 Vue 3 + Vite、hash 路由。保留终端配色、扫描线、透明面板、三列卡片、动态环形指标、列表、离线世界地图、地区筛选、中英文、手机布局，以及单机资源/延迟/丢包图表。原 monitor 主题源代码和安装包不变，CF 版本单独放在 cfsm/。

## 在 CF 后台安装

后台「主题商店 → 自定义主题 URL」填写 `https://github.com/guboysky/CF-Server/tree/cfsm-dist`，先预览，再应用。固定版本把 cfsm-dist 替换为该分支完整提交 SHA。**不能把原 theme.tar.gz 上传到 CF 后台，也不能用源码 cfsm-port 地址安装。**

CF 由 Worker 代理 index.html 和 assets/；构建根目录仅这两项。地图 JSON 在 assets 内打包，不请求地图瓦片；旗帜和系统图标使用 Worker 的 /flags/ 和 /os-icons/。管理后台继续访问 `/admin#/admin`。

背景优先沿用 CF 后台「设置 → 外观」的背景图；也支持 config.theme_options.background_url、构建 BACKGROUND_IMAGE。原主题默认背景 URL 仍保留为后备（第三方素材权利归原作者），CF CSP 若未允许该图片来源会阻止加载；请在后台静态资源域名中允许对应图片域名，或设置自己的已允许背景。无背景时仍显示终端配色，不影响数据。面板透明度可读 theme_options.panel_opacity（0.3–1）。

## 数据与 D1 消耗边界

- /api/config 每站生命周期一次；首页 /api/servers 首次一次。首页只用 CF /api/ws?subscribe=all 和订阅 all IDs 更新，批量采样合并后全局每秒最多一次渲染。
- 独立详情仅 /api/server?id=、/api/history/all?id=&hours=0.167，以及当前单机 WebSocket。仅进入详情或用户切换范围才加载历史，支持 10/30 分钟及 1/6/12/24/48/96/168 小时；不因为切换图例、布局、筛选或缩放补查。
- 卡片延迟/丢包色条只读 servers 返回的 ping/loss 窗口，分别取各探针；不沿用原主题每卡片每分钟查询历史，不做 5 秒 REST 兜底轮询，不使用 setInterval。
- 隐藏页面断开，恢复只额外读当前列表/单机快照；不重新读 config/历史。指数退避最多六次，连接时限到达需点击继续。
- JWT、同源 Cookie、跨域 WS token、Turnstile 凭证缓存及 401/403 处理沿用 CF 协议。未登录私站跳转 Worker 后台。模拟验证不代表真实 Cloudflare 挑战已通过。
- 内存/磁盘单位从 CF 的 MiB 转换；traffic_limit 按 GiB，尊重 monthly 计数及 dl/ul/max/total 口径。离线实时值显示 —，零值保留；null 探针显示超时，false/缺失不填零。
- 公开字段不包含的精确位置、虚拟化、Agent 版本、备注等不补管理 API，不伪造。地图位置是国家/地区代表点，不是服务器坐标；HK/MO/TW/SG 单独标记。

原 CF 后端参考提交 `fa60c60d7a5e872c874fe92822206b32d072c3af` 会过滤 note，且 Turnstile 首次数据响应存在可复用凭证返回缺口。docs/ 中为可选后端补丁，未部署；后台原始备注不会绕过接口读取。

## 构建和验收

在 cfsm 目录执行 `npm ci`、`npm test`、`npm run test:e2e`、`npm run build`。Node.js 22。测试截图在 artifacts，全部为模拟数据。Vue 源码只实现 CF 协议；仓库根 src/ 仍是原 monitor 主题，运行两套项目时注意工作目录。

主题设置读 config.theme_options：layout=bar/ring/list/map、notice、background_url、panel_opacity、show_summary、show_price、show_latency。价格/到期开关遵守 CF 返回的 sysConfig。访客视图、语言和深浅色偏好只保存在当前浏览器。没有移植 monitor 的 /api/me、节点监控历史、gzip 协议或后台。

GitHub Actions 对 PR 执行测试和构建；合并到 main/master 或手动运行后，追加 cfsm-dist 历史，不 force push，保持源提交信息。源码 PR 在完成真实站点各登录/Turnstile 组合验收前保持草稿。UI/协议模拟测试和公开关验证站点检查不等同四种组合全通过。

## 许可

保留仓库 LICENSE、LICENSE-CF；CF 适配器及图表复用来源为 guboysky/cfsm-theme-ink，对应许可见 docs/LICENSE-adapter.txt。构建随 assets/LICENSE.txt 分发。地图数据来自 CF-Server-Monitor。

## 本次验收记录

本地单元测试 11 项，浏览器测试 13 项，覆盖四种公开/Turnstile 模拟组合、401/403、跨站 JWT、隐藏恢复、无轮询、布局/地图/筛选、独立详情及截图。已用本地构建连接用户现有公开 CF 站点：12 个节点，首页与单机 WS 合计收到 21 个 batchUpdate；config、servers、server、history/all 各一次，无页面错误及横向溢出。真实截图仅保留本机临时目录，未上传仓库；此记录不代表已替用户应用线上主题。真实 Turnstile 和私有登录组合仍待验收。
