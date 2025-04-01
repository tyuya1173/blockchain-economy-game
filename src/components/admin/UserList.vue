<template>
    <div class="user-list-panel panel">
      <h3>ユーザー管理</h3>
      
      <div class="controls">
        <div class="search-bar">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="ユーザー名で検索..." 
            class="search-input"
          />
          <button @click="search" class="search-button">
            <i class="fas fa-search"></i>
          </button>
        </div>
        
        <div class="filters">
          <select v-model="roleFilter" class="filter-select">
            <option value="">すべての役割</option>
            <option value="player">プレイヤー</option>
            <option value="admin">管理者</option>
          </select>
          
          <select v-model="sortOption" class="filter-select">
            <option value="createdAt_desc">登録日 (新しい順)</option>
            <option value="createdAt_asc">登録日 (古い順)</option>
            <option value="totalValue_desc">総資産 (高い順)</option>
            <option value="totalValue_asc">総資産 (低い順)</option>
          </select>
        </div>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>ユーザーデータを読み込み中...</p>
      </div>
      
      <div v-else-if="filteredUsers.length === 0" class="empty-message">
        <p>一致するユーザーが見つかりません</p>
      </div>
      
      <div v-else class="user-table-container">
        <table class="user-table">
          <thead>
            <tr>
              <th>ユーザー名</th>
              <th>役割</th>
              <th>ラボドル</th>
              <th>クーゼリアム</th>
              <th>金</th>
              <th>総資産 (円)</th>
              <th>登録日</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.userId" class="user-row">
              <td class="user-cell">
                <div class="user-info">
                  <div class="user-avatar" :style="{ backgroundColor: getUserColor(user.userId) }">
                    {{ getInitial(user) }}
                  </div>
                  <div class="user-name">{{ user.displayName || user.username }}</div>
                </div>
              </td>
              <td>
                <span 
                  class="role-badge" 
                  :class="{ 'admin-role': user.role === 'admin' }"
                >
                  {{ user.role === 'admin' ? '管理者' : 'プレイヤー' }}
                </span>
              </td>
              <td>{{ formatNumber(user.assets.labDollar) }}</td>
              <td>{{ formatNumber(user.assets.kuzellium) }}</td>
              <td>{{ formatNumber(user.assets.gold) }}</td>
              <td>{{ formatCurrency(calculateTotalValue(user)) }}</td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="viewUser(user)" class="action-button view">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button @click="editUser(user)" class="action-button edit">
                    <i class="fas fa-edit"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="filteredUsers.length > 0" class="pagination">
        <div class="pagination-info">
          {{ startIndex + 1 }}-{{ endIndex }} / {{ filteredUsers.length }} ユーザー
        </div>
        <div class="pagination-controls">
          <button 
            @click="prevPage" 
            class="pagination-button" 
            :disabled="currentPage === 1"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="pagination-page">{{ currentPage }}</span>
          <button 
            @click="nextPage" 
            class="pagination-button" 
            :disabled="currentPage >= totalPages"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      
      <!-- ユーザー詳細モーダル -->
      <div v-if="selectedUser" class="user-modal">
        <div class="user-modal-content">
          <div class="user-modal-header">
            <h3>ユーザー詳細</h3>
            <button @click="closeUserModal" class="close-button">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="user-modal-body">
            <div class="user-profile">
              <div 
                class="user-profile-avatar" 
                :style="{ backgroundColor: getUserColor(selectedUser.userId) }"
              >
                {{ getInitial(selectedUser) }}
              </div>
              <div class="user-profile-info">
                <h4>{{ selectedUser.displayName || selectedUser.username }}</h4>
                <p class="user-id">ID: {{ selectedUser.userId }}</p>
                <span 
                  class="role-badge" 
                  :class="{ 'admin-role': selectedUser.role === 'admin' }"
                >
                  {{ selectedUser.role === 'admin' ? '管理者' : 'プレイヤー' }}
                </span>
              </div>
            </div>
            
            <div class="user-details-section">
              <h5>資産情報</h5>
              <div class="asset-grid">
                <div class="asset-item">
                  <div class="asset-label">ラボドル (LD)</div>
                  <div class="asset-value">{{ formatNumber(selectedUser.assets.labDollar) }}</div>
                </div>
                <div class="asset-item">
                  <div class="asset-label">クーゼリアム (KZM)</div>
                  <div class="asset-value">{{ formatNumber(selectedUser.assets.kuzellium) }}</div>
                </div>
                <div class="asset-item">
                  <div class="asset-label">金 (AU)</div>
                  <div class="asset-value">{{ formatNumber(selectedUser.assets.gold) }}</div>
                </div>
                <div class="asset-item total-value">
                  <div class="asset-label">総資産価値</div>
                  <div class="asset-value">{{ formatCurrency(calculateTotalValue(selectedUser)) }}</div>
                </div>
              </div>
            </div>
            
            <div class="user-details-section">
              <h5>アカウント情報</h5>
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-label">登録日</div>
                  <div class="detail-value">{{ formatDate(selectedUser.createdAt) }}</div>
                </div>
                <!-- 追加のユーザー情報があれば表示 -->
              </div>
            </div>
            
            <div class="user-actions">
              <button @click="editSelectedUser" class="user-action-button edit">
                <i class="fas fa-edit"></i> 編集
              </button>
              <button @click="resetUserPassword" class="user-action-button reset">
                <i class="fas fa-key"></i> パスワードリセット
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'UserList',
    props: {
      users: {
        type: Array,
        required: true
      },
      loading: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        searchQuery: '',
        roleFilter: '',
        sortOption: 'createdAt_desc',
        currentPage: 1,
        itemsPerPage: 10,
        selectedUser: null
      };
    },
    computed: {
      filteredUsers() {
        let result = [...this.users];
        
        // 検索クエリでフィルタリング
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          result = result.filter(user => {
            const username = (user.username || '').toLowerCase();
            const displayName = (user.displayName || '').toLowerCase();
            return username.includes(query) || displayName.includes(query);
          });
        }
        
        // ロールでフィルタリング
        if (this.roleFilter) {
          result = result.filter(user => user.role === this.roleFilter);
        }
        
        // ソート
        const [sortField, sortDirection] = this.sortOption.split('_');
        result.sort((a, b) => {
          let valueA, valueB;
          
          if (sortField === 'createdAt') {
            valueA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            valueB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          } else if (sortField === 'totalValue') {
            valueA = this.calculateTotalValue(a);
            valueB = this.calculateTotalValue(b);
          } else {
            valueA = a[sortField];
            valueB = b[sortField];
          }
          
          if (sortDirection === 'asc') {
            return valueA - valueB;
          } else {
            return valueB - valueA;
          }
        });
        
        return result;
      },
      totalPages() {
        return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
      },
      startIndex() {
        return (this.currentPage - 1) * this.itemsPerPage;
      },
      endIndex() {
        const end = this.startIndex + this.itemsPerPage;
        return Math.min(end, this.filteredUsers.length);
      },
      paginatedUsers() {
        return this.filteredUsers.slice(this.startIndex, this.endIndex);
      }
    },
    methods: {
      search() {
        this.currentPage = 1;
      },
      prevPage() {
        if (this.currentPage > 1) {
          this.currentPage--;
        }
      },
      nextPage() {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
        }
      },
      viewUser(user) {
        this.selectedUser = user;
      },
      editUser(user) {
        this.$emit('view-user', user.userId);
      },
      closeUserModal() {
        this.selectedUser = null;
      },
      editSelectedUser() {
        if (this.selectedUser) {
          this.$emit('view-user', this.selectedUser.userId);
          this.closeUserModal();
        }
      },
      resetUserPassword() {
        // パスワードリセット処理
        alert(`${this.selectedUser.username}のパスワードリセットが要求されました。`);
      },
      getInitial(user) {
        const name = user.displayName || user.username || '';
        return name.charAt(0).toUpperCase();
      },
      getUserColor(userId) {
        // ユーザーIDに基づいて一貫した色を生成
        const colors = [
          '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
          '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad'
        ];
        
        const hash = userId.split('').reduce((acc, char) => {
          return acc + char.charCodeAt(0);
        }, 0);
        
        return colors[hash % colors.length];
      },
      calculateTotalValue(user) {
        if (!user || !user.assets) return 0;
        
        // 各資産を円換算して合計
        const labDollarValue = (user.assets.labDollar || 0) * 100; // 1LD = 100円
        const kuzelliumValue = (user.assets.kuzellium || 0) * 500; // 仮定: 1KZM = 500円
        const goldValue = (user.assets.gold || 0) * 8000; // 仮定: 1AU = 8000円
        
        return labDollarValue + kuzelliumValue + goldValue;
      },
      formatNumber(number) {
        return number ? number.toLocaleString() : '0';
      },
      formatCurrency(value) {
        return value ? value.toLocaleString() + '円' : '0円';
      },
      formatDate(timestamp) {
        if (!timestamp) return '不明';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        
        return date.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  };
  </script>
  
  <style scoped>
  .user-list-panel {
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
  
  .controls {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  
  .search-bar {
    display: flex;
    align-items: center;
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
  
  .filters {
    display: flex;
    gap: 10px;
  }
  
  .filter-select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
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
  
  .user-table-container {
    overflow-x: auto;
  }
  
  .user-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  
  .user-table th {
    text-align: left;
    padding: 12px 16px;
    background-color: #f8f9fa;
    border-bottom: 2px solid #eee;
    font-weight: 600;
  }
  
  .user-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
  }
  
  .user-row:hover {
    background-color: #f5f5f5;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
  }
  
  .role-badge {
    display: inline-block;
    padding: 4px 8px;
    background-color: #95a5a6;
    color: white;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .role-badge.admin-role {
    background-color: #e74c3c;
  }
  
  .action-buttons {
    display: flex;
    gap: 8px;
  }
  
  .action-button {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .action-button.view {
    background-color: #3498db;
    color: white;
  }
  
  .action-button.edit {
    background-color: #f39c12;
    color: white;
  }
  
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0 0;
    font-size: 14px;
  }
  
  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .pagination-button {
    width: 32px;
    height: 32px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .pagination-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .pagination-page {
    font-weight: 500;
  }
  
  /* ユーザー詳細モーダル */
  .user-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .user-modal-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .user-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
  }
  
  .user-modal-header h3 {
    margin: 0;
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  
  .close-button:hover {
    background-color: #f8f9fa;
  }
  
  .user-modal-body {
    padding: 20px;
  }
  
  .user-profile {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }
  
  .user-profile-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    font-weight: bold;
  }
  
  .user-profile-info h4 {
    margin: 0 0 4px;
    font-size: 18px;
  }
  
  .user-id {
    margin: 0 0 8px;
    color: #7f8c8d;
    font-size: 13px;
  }
  
  .user-details-section {
    margin-bottom: 24px;
  }
  
  .user-details-section h5 {
    margin: 0 0 12px;
    font-size: 16px;
    color: #34495e;
  }
  
  .asset-grid, .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .asset-item, .detail-item {
    background-color: #f8f9fa;
    padding: 12px;
    border-radius: 6px;
  }
  
  .asset-label, .detail-label {
    font-size: 13px;
    color: #7f8c8d;
    margin-bottom: 4px;
  }
  
  .asset-value, .detail-value {
    font-size: 16px;
    font-weight: 500;
  }
  
  .total-value {
    grid-column: span 2;
    background-color: #e8f4fd;
  }
  
  .total-value .asset-value {
    font-size: 18px;
    font-weight: 600;
    color: #3498db;
  }
  
  .user-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }
  
  .user-action-button {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .user-action-button.edit {
    background-color: #f39c12;
    color: white;
  }
  
  .user-action-button.reset {
    background-color: #95a5a6;
    color: white;
  }
  
  @media (max-width: 768px) {
    .controls {
      flex-direction: column;
      gap: 12px;
    }
    
    .search-bar {
      max-width: none;
    }
    
    .asset-grid, .detail-grid {
      grid-template-columns: 1fr;
    }
    
    .total-value {
      grid-column: 1;
    }
  }
  </style>