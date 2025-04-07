<template>
    <v-card flat tile class="transaction-history-card">
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="headline font-weight-bold">最近の取引</span>
        <v-btn 
          icon 
          small 
          color="grey lighten-1"
          @click="showAllTransactions"
        >
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </v-card-title>
  
      <v-card-text>
        <v-list v-if="transactions.length === 0" class="text-center">
          <v-list-item>
            <v-list-item-content>
              <p class="text-muted empty-state">まだ取引履歴がありません</p>
            </v-list-item-content>
          </v-list-item>
        </v-list>
  
        <v-list v-else class="transaction-list">
          <v-list-item 
            v-for="transaction in displayedTransactions" 
            :key="transaction.id" 
            class="transaction-item"
          >
            <v-list-item-content>
              <div class="d-flex justify-space-between align-center transaction-content">
                <div class="transaction-icon-container">
                  <v-icon 
                    :color="isPositiveTransaction(transaction) ? 'success' : 'error'"
                    class="transaction-icon"
                  >
                    {{ isPositiveTransaction(transaction) ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
                  </v-icon>
                </div>
                <div class="transaction-details flex-grow-1 mx-3">
                  <div class="transaction-type font-weight-medium">
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
    data() {
      return {
        transactionsToShow: 3
      };
    },
    computed: {
      displayedTransactions() {
        return this.transactions.slice(0, this.transactionsToShow);
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
        return `${prefix}${this.formatNumber(transaction.amount)} ${transaction.assetType}`;
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
      },

      // 数値をフォーマット
      formatNumber(value) {
        return new Intl.NumberFormat('ja-JP').format(Math.round(value));
      },

      // すべての取引を表示
      showAllTransactions() {
        this.$emit('show-all-transactions');
      }
    }
  };
  </script>
  
  <style scoped>
  .transaction-history-card {
    border: 1px solid rgba(0,0,0,0.1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-radius: 8px;
  }

  .transaction-list {
    background-color: #f5f5f5;
    border-radius: 8px;
    padding: 8px 0;
  }

  .transaction-item {
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(0,0,0,0.1);
  }

  .transaction-item:last-child {
    border-bottom: none;
  }

  .transaction-content {
    padding: 8px 16px;
  }

  .transaction-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(0,0,0,0.05);
  }

  .transaction-icon {
    font-size: 1.2rem;
  }

  .transaction-details {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .transaction-type {
    font-size: 0.95rem;
  }
  
  .transaction-date {
    font-size: 0.75rem;
  }
  
  .transaction-amount {
    font-weight: bold;
    font-size: 0.95rem;
  }

  .empty-state {
    color: rgba(0,0,0,0.6);
    padding: 16px;
    text-align: center;
  }

  /* レスポンシブ対応 */
  @media (max-width: 600px) {
    .transaction-content {
      padding: 8px;
    }

    .transaction-icon-container {
      width: 32px;
      height: 32px;
    }

    .transaction-type {
      font-size: 0.85rem;
    }

    .transaction-amount {
      font-size: 0.85rem;
    }
  }
  </style>