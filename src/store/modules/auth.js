// store/modules/auth.js

const state = {
    userId: ''
  };
  
  const mutations = {
    setUserId(state, id) {
      state.userId = id;
    }
  };
  
  export default {
    namespaced: true, // ✅ これが必要
    state,
    mutations
  };