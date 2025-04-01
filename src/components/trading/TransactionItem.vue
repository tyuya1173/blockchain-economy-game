<template>
    <li class="transaction-item">
      <div class="info">
        <span class="label">{{ assetLabel }}</span>
        <span class="amount">{{ trade.amount }} 単位</span>
      </div>
      <div class="details">
        <span class="to-user">→ {{ trade.to }}</span>
        <span class="timestamp">{{ formattedDate }}</span>
      </div>
    </li>
  </template>
  
  <script>
  export default {
    name: 'TransactionItem',
    props: {
      trade: {
        type: Object,
        required: true
      }
    },
    computed: {
      assetLabel() {
        const labels = {
          labDollar: 'ラボドル',
          kuzellium: 'クーゼリアム',
          gold: '金'
        };
        return labels[this.trade.assetType] || this.trade.assetType;
      },
      formattedDate() {
        if (!this.trade.timestamp) return '';
        const date = this.trade.timestamp.toDate ? this.trade.timestamp.toDate() : new Date(this.trade.timestamp);
        return date.toLocaleString('ja-JP', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      }
    }
  };
  </script>
  
  <style scoped>
  .transaction-item {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #ddd;
  }
  
  .info {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
  }
  
  .details {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.25rem;
  }
  </style>