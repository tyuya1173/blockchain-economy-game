import { functions } from '@/firebase'; // Firebase Functions 呼び出し用
import { db } from '@/firebase/firestore'; // Firestore 参照用
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

const state = {
  trades: [],            // 自分の取引履歴
  loading: false,
  error: null
};

const mutations = {
  SET_TRADES(state, trades) {
    state.trades = trades;
  },
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  /**
   * Cloud Functions を通じて取引を実行
   */
  async submitTrade({ commit }, { fromUserId, toUserId, assetType, amount }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    try {
      const processTrade = httpsCallable(functions, 'processTransaction');
      const result = await processTrade({ fromUserId, toUserId, assetType, amount });

      console.log('[submitTrade] 取引成功:', result.data);
      return result.data; // 成功した transactionId 等
    } catch (error) {
      console.error('[submitTrade] 取引エラー:', error);
      commit('SET_ERROR', error.message || '取引に失敗しました');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  /**
   * Firestore からリアルタイムに取引履歴を取得
   */
  fetchTradeHistory({ commit }, userId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);

    const tradesRef = collection(db, 'transactions');
    const q = query(
      tradesRef,
      where('from', '==', userId),
      orderBy('timestamp', 'desc')
    );

    // onSnapshotでリアルタイム監視
    onSnapshot(q, (snapshot) => {
      const trades = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      commit('SET_TRADES', trades);
      commit('SET_LOADING', false);
    }, (error) => {
      console.error('[fetchTradeHistory] エラー:', error);
      commit('SET_ERROR', error.message || '取引履歴の取得に失敗しました');
      commit('SET_LOADING', false);
    });
  }
};

const getters = {
  tradeHistory: (state) => state.trades,
  isLoading: (state) => state.loading,
  errorMessage: (state) => state.error
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};