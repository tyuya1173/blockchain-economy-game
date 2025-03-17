<template>
    <v-card flat tile>
      <v-card-title class="headline font-weight-bold">
        最近の取引
      </v-card-title>
  
      <v-card-text>
        <v-list v-if="transactions.length === 0" class="text-center">
          <v-list-item>
            <v-list-item-content>
              <p class="text-muted">まだ取引履歴がありません</p>
            </v-list-item-content>
          </v-list-item>
        </v-list>
  
        <v-list v-else class="transaction-list">
          <v-list-item 
            v-for="transaction in transactions" 
            :key="transaction.id" 
            class="transaction-item"
          >
            <v-list-item-content>
              <div class="d-flex justify-space-between align-center">
                <div class="transaction-details">
                  <div class="transaction-type">
                    {{ getTransactionType(transaction) }}
                  </div>
                  <div class="transaction-date text-caption text-muted">
                    {{ formatDate(transaction.timestamp) }}
                  </div>
                </div>
                <div 
                  class="transaction-amount" 
                  :class="{
                    'text-success': isPositiveTransaction(transaction),
                    'text-error': !isPositiveTransaction(transaction)
                  }"
                >
                  {{ getTransactionAmount(transaction) }}
                </div>
              </div>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  export default {
    name: 'TransactionHistory',
    props: {
      currentUserId: {
        type: String,
        required: true
      },
      transactions: {
        type: Array,
        default: () => []
      }
    },
    methods: {
      // 取引タイプを判定
      getTransactionType(transaction) {
        if (transaction.fromUser === this.currentUserId && transaction.toUser === this.currentUserId) {
          return '自己取引';
        } else if (transaction.fromUser === this.currentUserId) {
          return `${transaction.assetType}の送金`;
        } else {
          return `${transaction.assetType}の受取`;
        }
      },
      
      // 取引量を表示形式に変換
      getTransactionAmount(transaction) {
        const prefix = this.isPositiveTransaction(transaction) ? '+' : '-';
        return `${prefix}${transaction.amount} ${transaction.assetType}`;
      },
      
      // プラスの取引かどうかを判定
      isPositiveTransaction(transaction) {
        return transaction.toUser === this.currentUserId && transaction.fromUser !== this.currentUserId;
      },
      
      // 日付のフォーマット
      formatDate(timestamp) {
        if (!timestamp) return '';
        
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        return new Intl.DateTimeFormat('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      }
    }
  };
  </script>
  
  <style scoped>
  .transaction-item {
    margin-bottom: 8px;
  }
  
  .transaction-details {
    display: flex;
    flex-direction: column;
  }
  
  .transaction-type {
    font-weight: medium;
  }
  
  .transaction-date {
    font-size: 0.75rem;
  }
  
  .transaction-amount {
    font-weight: bold;
  }
  </style>