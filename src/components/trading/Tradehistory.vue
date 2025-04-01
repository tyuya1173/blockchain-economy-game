<template>
    <div class="trade-history">
      <h3>取引履歴</h3>
  
      <div v-if="loading">読み込み中...</div>
      <div v-else-if="error">{{ error }}</div>
      <div v-else-if="trades.length === 0">取引履歴がありません。</div>
  
      <ul v-else class="trade-list">
        <TransactionItem
          v-for="trade in trades"
          :key="trade.id"
          :trade="trade"
        />
      </ul>
    </div>
  </template>
  
  <script>
  import { mapGetters, mapState } from 'vuex';
  import TransactionItem from './TransactionItem.vue';
  
  export default {
    name: 'TradeHistory',
    components: { TransactionItem },
    computed: {
      ...mapGetters('trading', ['tradeHistory', 'isLoading', 'errorMessage']),
      ...mapState('auth', ['userId']),
      trades() {
        return this.tradeHistory;
      },
      loading() {
        return this.isLoading;
      },
      error() {
        return this.errorMessage;
      }
    },
    created() {
      if (this.userId) {
        this.$store.dispatch('trading/fetchTradeHistory', this.userId);
      }
    }
  };
  </script>
  
  <style scoped>
  .trade-history {
    padding: 1rem;
  }
  
  .trade-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  </style>