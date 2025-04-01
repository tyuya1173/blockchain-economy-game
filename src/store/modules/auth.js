export default {
    namespaced: true,
    state: {
      userId: null,
      displayName: '',
      role: 'player'
    },
    mutations: {
      setUser(state, payload) {
        state.userId = payload.userId;
        state.displayName = payload.displayName;
        state.role = payload.role;
      },
      clearUser(state) {
        state.userId = null;
        state.displayName = '';
        state.role = 'player';
      }
    },
    actions: {
      login({ commit }, user) {
        // Firebaseのuserオブジェクトなどを想定
        commit('setUser', {
          userId: user.uid,
          displayName: user.displayName || '',
          role: user.role || 'player'
        });
      },
      logout({ commit }) {
        commit('clearUser');
      }
    },
    getters: {
      isLoggedIn: state => !!state.userId
    }
  };