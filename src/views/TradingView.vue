<template>
    <div class="trading-view">
      <h1>取引画面</h1>
  
      <section class="transfer-section">
        <UserTransfer />
      </section>
  
      <section class="history-section">
        <TradeHistory />
      </section>
    </div>
  </template>
  
  <script>
  import UserTransfer from '@/components/trading/UserTransfer.vue';
  import TradeHistory from '../components/trading/Tradehistory.vue'
  
  export default {
    name: 'TradingView',
    components: {
      UserTransfer,
      TradeHistory
    }
  };
  </script>
  
  <style scoped>
  .trading-view {
    padding: 2rem;
    max-width: 800px;
    margin: auto;
  }
  
  .transfer-section {
    margin-bottom: 2rem;
  }
  
  .history-section {
    border-top: 1px solid #ccc;
    padding-top: 1.5rem;
  }
  </style>