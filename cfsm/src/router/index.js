import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../matrix/MatrixDashboard.vue'
import ServerDetail from '../matrix/MatrixDetail.vue'
export default createRouter({ history: createWebHashHistory(), routes: [{ path: '/', component: Dashboard }, { path: '/server/:id', component: ServerDetail }] })
