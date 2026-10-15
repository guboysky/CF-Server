import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import ServerDetail from '../views/ServerDetail.vue'
export default createRouter({ history: createWebHashHistory(), routes: [{ path: '/', component: Dashboard }, { path: '/server/:id', component: ServerDetail }] })
