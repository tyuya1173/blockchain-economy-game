<template>
    <div class="system-log-panel panel">
      <h3>システムログ</h3>
      
      <div class="log-controls">
        <div class="log-filters">
          <select v-model="logTypeFilter" class="filter-select">
            <option value="">すべてのタイプ</option>
            <option value="info">情報</option>
            <option value="warning">警告</option>
            <option value="error">エラー</option>
            <option value="auth">認証</option>
            <option value="transaction">取引</option>
            <option value="mining">マイニング</option>
            <option value="market">市場</option>
            <option value="event">イベント</option>
            <option value="game">ゲーム状態</option>
            <option value="admin">管理者操作</option>
          </select>
          
          <div class="search-bar">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="ログを検索..." 
              class="search-input"
            />
            <button @click="search" class="search-button">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>
        
        <div class="log-actions">
          <button 
            @click="expandAll = !expandAll" 
            class="action-button"
          >
            {{ expandAll ? 'すべて折りたたむ' : 'すべて展開する' }}
          </button>
          <button 
            @click="fetchLogs" 
            class="action-button refresh"
          >
            更新
          </button>
        </div>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>ログを読み込み中...</p>
      </div>
      
      <div v-else-if="filteredLogs.length === 0" class="empty-message">
        <p>ログが見つかりません</p>
      </div>
      
      <div v-else class="logs-container">
        <div 
          v-for="log in filteredLogs" 
          :key="log.id" 
          class="log-item"
          :class="{ expanded: expandAll || expandedLogs.includes(log.id) }"
        >
          <div 
            class="log-header" 
            :class="log.type"
            @click="toggleLogExpand(log.id)"
          >
            <div class="log-icon">
              <i :class="getLogIcon(log.type)"></i>
            </div>
            <div class="log-summary">
              <div class="log-title">
                {{ log.title }}
              </div>
              <div class="log-meta">
                <span class="log-time">{{ formatDateTime(log.timestamp) }}</span>
                <span class="log-type-badge" :class="log.type">
                  {{ getLogTypeName(log.type) }}
                </span>
                <span v-if="log.userId" class="log-user">
                  {{ log.username || log.userId }}
                </span>
              </div>
            </div>
            <div class="log-expand">
              <i class="fas" :class="expandAll || expandedLogs.includes(log.id) ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </div>
          </div>
          
          <div class="log-details">
            <div class="log-message">
              {{ log.message }}
            </div>
            
            <div v-if="log.details" class="log-extra">
              <div v-if="typeof log.details === 'object'" class="log-data">
                <div v-for="(value, key) in log.details" :key="key" class="log-data-row">
                  <span class="log-data-key">{{ formatKey(key) }}</span>
                  <span class="log-data-value">{{ formatValue(value) }}</span>
                </div>
              </div>
              <div v-else class="log-text">
                {{ log.details }}
              </div>
            </div>
            
            <div v-if="log.error" class="log-error">
              <div class="log-error-header">エラー情報:</div>
              <pre class="log-error-message">{{ log.error }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="filteredLogs.length > 0" class="log-pagination">
        <button 
          @click="loadMoreLogs" 
          class="load-more-button"
          :disabled="!hasMoreLogs || loadingMore"
        >
          <span v-if="loadingMore">読み込み中...</span>
          <span v-else>もっと表示する</span>
        </button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'SystemLog',
    props: {
      logs: {
        type: Array,
        required: true,
        default: () => []
      },
      loading: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        searchQuery: '',
        logTypeFilter: '',
        expandedLogs: [],
        expandAll: false,
        loadingMore: false,
        hasMoreLogs: true,
        limit: 50, // 一度に表示するログの数
        logTypeIcons: {
          'info': 'fas fa-info-circle',
          'warning': 'fas fa-exclamation-triangle',
          'error': 'fas fa-times-circle',
          'auth': 'fas fa-user-shield',
          'transaction': 'fas fa-exchange-alt',
          'mining': 'fas fa-hammer',
          'market': 'fas fa-chart-line',
          'event': 'fas fa-bolt',
          'game': 'fas fa-gamepad',
          'admin': 'fas fa-user-cog'
        },
        logTypeNames: {
          'info': '情報',
          'warning': '警告',
          'error': 'エラー',
          'auth': '認証',
          'transaction': '取引',
          'mining': 'マイニング',
          'market': '市場',
          'event': 'イベント',
          'game': 'ゲーム状態',
          'admin': '管理者操作'
        }
      };
    },
    computed: {
      filteredLogs() {
        let result = [...this.logs];
        
        // タイプでフィルタリング
        if (this.logTypeFilter) {
          result = result.filter(log => log.type === this.logTypeFilter);
        }
        
        // 検索クエリでフィルタリング
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          result = result.filter(log => {
            return (
              (log.title && log.title.toLowerCase().includes(query)) ||
              (log.message && log.message.toLowerCase().includes(query)) ||
              (log.username && log.username.toLowerCase().includes(query))
            );
          });
        }
        
        return result;
      }
    },
    methods: {
      toggleLogExpand(logId) {
        const index = this.expandedLogs.indexOf(logId);
        if (index === -1) {
          this.expandedLogs.push(logId);
        } else {
          this.expandedLogs.splice(index, 1);
        }
      },
      
      search() {
        // 検索時には展開状態をリセット
        this.expandedLogs = [];
      },
      
      fetchLogs() {
        // 親コンポーネントでログを取得
        // このコンポーネントでは props からログを受け取るのみ
        this.$emit('refresh-logs');
      },
      
      loadMoreLogs() {
        if (this.loadingMore || !this.hasMoreLogs) return;
        
        this.loadingMore = true;
        
        // 実際の実装では、親コンポーネントからより多くのログを読み込む
        setTimeout(() => {
          this.loadingMore = false;
          this.hasMoreLogs = false; // 仮の実装 - 実際にはまだ読み込めるログがあるかどうかに基づいて設定
        }, 1000);
      },
      
      getLogIcon(type) {
        return this.logTypeIcons[type] || 'fas fa-circle';
      },
      
      getLogTypeName(type) {
        return this.logTypeNames[type] || type;
      },
      
      formatDateTime(timestamp) {
        if (!timestamp) return '不明';
        
        let date;
        try {
          // Firestoreのタイムスタンプの場合
          if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
          } 
          // Dateオブジェクトの場合
          else if (timestamp instanceof Date) {
            date = timestamp;
          }
          // 数値タイムスタンプの場合
          else if (typeof timestamp === 'number') {
            date = new Date(timestamp);
          }
          // 文字列の場合
          else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
          }
          else {
            return '不明';
          }
          
          return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        } catch (e) {
          console.error('日付のフォーマットに失敗しました:', e);
          return '不明';
        }
      },
      
      formatKey(key) {
        // キーをキャメルケースからスペース区切りの文字列に変換
        return key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());
      },
      
      formatValue(value) {
        if (value === null || value === undefined) {
          return 'なし';
        }
        
        if (typeof value === 'object') {
          if (value instanceof Date) {
            return this.formatDateTime(value);
          }
          
          // Firebase のタイムスタンプオブジェクト
          if (value.toDate && typeof value.toDate === 'function') {
            return this.formatDateTime(value);
          }
          
          try {
            return JSON.stringify(value);
          } catch (e) {
            return '[オブジェクト]';
          }
        }
        
        if (typeof value === 'boolean') {
          return value ? 'はい' : 'いいえ';
        }
        
        return String(value);
      }
    }
  };
  </script>
  
  <style scoped>
  .system-log-panel {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 20px;
    grid-column: span 2;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 18px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }
  
  .log-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .log-filters {
    display: flex;
    gap: 12px;
    align-items: center;
    flex: 1;
  }
  
  .filter-select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .search-bar {
    display: flex;
    flex: 1;
    max-width: 300px;
  }
  
  .search-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px 0 0 4px;
    font-size: 14px;
  }
  
  .search-button {
    padding: 8px 12px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
  }
  
  .log-actions {
    display: flex;
    gap: 8px;
  }
  
  .action-button {
    padding: 8px 12px;
    background-color: #ecf0f1;
    color: #34495e;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .action-button.refresh {
    background-color: #3498db;
    color: white;
  }
  
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 0;
  }
  
  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .empty-message {
    padding: 40px 0;
    text-align: center;
    color: #7f8c8d;
  }
  
  .logs-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 600px;
    overflow-y: auto;
  }
  
  .log-item {
    border: 1px solid #eee;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .log-header {
    display: flex;
    align-items: center;
    padding: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .log-header:hover {
    background-color: #f5f5f5;
  }
  
  .log-header.info {
    border-left: 4px solid #3498db;
  }
  
  .log-header.warning {
    border-left: 4px solid #f39c12;
  }
  
  .log-header.error {
    border-left: 4px solid #e74c3c;
  }
  
  .log-header.auth {
    border-left: 4px solid #9b59b6;
  }
  
  .log-header.transaction {
    border-left: 4px solid #1abc9c;
  }
  
  .log-header.mining {
    border-left: 4px solid #f1c40f;
  }
  
  .log-header.market {
    border-left: 4px solid #2ecc71;
  }
  
  .log-header.event {
    border-left: 4px solid #e67e22;
  }
  
  .log-header.game {
    border-left: 4px solid #34495e;
  }
  
  .log-header.admin {
    border-left: 4px solid #8e44ad;
  }
  
  .log-icon {
    margin-right: 12px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .log-icon i {
    font-size: 16px;
  }
  
  .info .log-icon i {
    color: #3498db;
  }
  
  .warning .log-icon i {
    color: #f39c12;
  }
  
  .error .log-icon i {
    color: #e74c3c;
  }
  
  .auth .log-icon i {
    color: #9b59b6;
  }
  
  .transaction .log-icon i {
    color: #1abc9c;
  }
  
  .mining .log-icon i {
    color: #f1c40f;
  }
  
  .market .log-icon i {
    color: #2ecc71;
  }
  
  .event .log-icon i {
    color: #e67e22;
  }
  
  .game .log-icon i {
    color: #34495e;
  }
  
  .admin .log-icon i {
    color: #8e44ad;
  }
  
  .log-summary {
    flex: 1;
  }
  
  .log-title {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .log-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #7f8c8d;
  }
  
  .log-type-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 500;
    color: white;
  }
  
  .log-type-badge.info {
    background-color: #3498db;
  }
  
  .log-type-badge.warning {
    background-color: #f39c12;
  }
  
  .log-type-badge.error {
    background-color: #e74c3c;
  }
  
  .log-type-badge.auth {
    background-color: #9b59b6;
  }
  
  .log-type-badge.transaction {
    background-color: #1abc9c;
  }
  
  .log-type-badge.mining {
    background-color: #f1c40f;
  }
  
  .log-type-badge.market {
    background-color: #2ecc71;
  }
  
  .log-type-badge.event {
    background-color: #e67e22;
  }
  
  .log-type-badge.game {
    background-color: #34495e;
  }
  
  .log-type-badge.admin {
    background-color: #8e44ad;
  }
  
  .log-details {
    padding: 0;
    max-height: 0;
    overflow: hidden;
    transition: all 0.3s ease-in-out;
    background-color: #f8f9fa;
  }
  
  .log-item.expanded .log-details {
    padding: 12px;
    max-height: 500px;
  }
  
  .log-expand i {
    transition: transform 0.3s;
  }
  
  .log-item.expanded .log-expand i {
    transform: rotate(180deg);
  }
  
  .log-message {
    margin-bottom: 12px;
    line-height: 1.5;
  }
  
  .log-extra {
    margin-top: 8px;
  }
  
  .log-data {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 16px;
    font-size: 14px;
  }
  
  .log-data-row {
    display: flex;
    flex-direction: column;
  }
  
  .log-data-key {
    color: #7f8c8d;
    font-size: 12px;
    margin-bottom: 2px;
  }
  
  .log-error {
    margin-top: 12px;
    padding: 8px 12px;
    background-color: #fdecea;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .log-error-header {
    color: #e74c3c;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .log-error-message {
    font-family: monospace;
    white-space: pre-wrap;
    margin: 0;
    font-size: 12px;
    color: #c0392b;
  }
  
  .log-pagination {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }
  
  .load-more-button {
    padding: 8px 16px;
    background-color: #ecf0f1;
    color: #34495e;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .load-more-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    .log-controls {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }
    
    .log-filters {
      flex-direction: column;
      align-items: stretch;
    }
    
    .search-bar {
      max-width: none;
    }
    
    .log-actions {
      justify-content: flex-end;
    }
    
    .log-data {
      grid-template-columns: 1fr;
    }
  }
  </style>