// store/modules/trading.js

const state = {
    tradeHistory: [],
    isLoading: false,
    errorMessage: ''
  };
  
  const getters = {
    tradeHistory: state => state.tradeHistory,
    isLoading: state => state.isLoading,
    errorMessage: state => state.errorMessage
  };
  
  export default {
    namespaced: true, // ✅ 必須
    state,
    getters
    // actions, mutations などもあれば追加
  };