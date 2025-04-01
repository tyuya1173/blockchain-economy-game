import Vue from 'vue'
import Vuex from 'vuex'
import trading from './modules/trading'
import auth from './modules/auth'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    auth,
    trading
  }
})
