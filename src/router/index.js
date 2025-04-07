import Vue from 'vue'
import VueRouter from 'vue-router'
// 各ビューのインポート
// import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
// import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
// import MiningView from '../views/MiningView.vue'
import TradingView from '../views/TradingView.vue'
import MarketView from '../views/MarketView.vue'
import AdminView from '../views/AdminView.vue'
import TradeRoomView from '../views/TradeRoomView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  // {
  //   path: '/register',
  //   name: 'register',
  //   component: RegisterView,
  //   meta: { requiresAuth: false }
  // },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  // {
  //   path: '/mining',
  //   name: 'mining',
  //   component: MiningView,
  //   meta: { requiresAuth: true }
  // },
  {
    path: '/trading',
    name: 'trading',
    component: TradingView,
    meta: { requiresAuth: true }
  },
  {
    path: '/market',
    name: 'market',
    component: MarketView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/trade-room/:roomId',
    name: 'TradeRoomView',
    component: TradeRoomView,
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// NavigationDuplicatedエラーを回避するために
// Vue Routerのpushメソッドをオーバーライド
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') {
      // NavigationDuplicated以外のエラーは再スロー
      return Promise.reject(err)
    }
    // NavigationDuplicatedエラーは無視して解決済みのPromiseを返す
    return Promise.resolve()
  })
}

export default router