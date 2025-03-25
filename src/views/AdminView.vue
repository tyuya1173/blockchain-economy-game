<template>
    <div class="container">
      <!-- コンテンツエリア -->
      <div class="content">
        <div class="view-header">
          <h2>管理者ページ</h2>
          <p>ゲーム管理とイベントコントロール</p>
        </div>
  
        <!-- ロード中の表示 -->
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>読み込み中...</p>
        </div>
  
        <!-- 権限エラー表示 -->
        <div v-else-if="!isAdmin" class="error-container">
          <i class="fas fa-exclamation-circle"></i>
          <h3>アクセス権限がありません</h3>
          <p>このページは管理者のみアクセスできます。</p>
          <button @click="$router.push('/dashboard')" class="primary-button">ダッシュボードに戻る</button>
        </div>
  
        <!-- 管理者機能の表示 -->
        <div v-else class="admin-panels">
          <!-- ゲーム参加者選択 (ゲーム開始前のみ表示) -->
          <div v-if="gameStatus === 'waiting' || gameStatus === 'finished'" class="participants-selection panel">
            <h3>ゲーム参加者選択</h3>
            <div class="selection-controls">
              <div class="selection-info">
                <div class="selection-count">
                  <span class="count-label">選択中:</span>
                  <span class="count-value">{{ selectedUsers.length }}</span>
                  <span class="count-label">人</span>
                </div>
                <div class="selection-actions">
                  <button @click="selectAllUsers" class="selection-action-button">すべて選択</button>
                  <button @click="deselectAllUsers" class="selection-action-button">すべて解除</button>
                </div>
              </div>
              <div class="search-filter">
                <input 
                  v-model="participantSearchQuery" 
                  type="text" 
                  placeholder="ユーザー名で検索..."
                  class="search-input"
                />
              </div>
            </div>
            
            <div class="participants-list">
              <div 
                v-for="user in filteredUsers" 
                :key="user.userId" 
                class="participant-item"
                :class="{ selected: isUserSelected(user.userId) }"
                @click="toggleUserSelection(user.userId)"
              >
                <div class="user-avatar" :style="{ backgroundColor: getUserColor(user.userId) }">
                  {{ getInitial(user) }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ user.displayName || user.username }}</div>
                  <div class="user-role">{{ user.role === 'admin' ? '管理者' : 'プレイヤー' }}</div>
                </div>
                <div class="selection-indicator">
                  <i class="fas" :class="isUserSelected(user.userId) ? 'fa-check-circle' : 'fa-circle'"></i>
                </div>
              </div>
            </div>
            
            <div class="selection-summary">
              <div class="summary-message">
                {{ selectedUsers.length > 0 ? 
                  `${selectedUsers.length}人のユーザーがゲームに参加します` : 
                  'ゲームを開始するには、少なくとも1人のユーザーを選択してください' }}
              </div>
            </div>
          </div>
          
          <!-- ゲーム制御パネル -->
          <game-controls 
            :game-status="gameStatus" 
            :current-phase="currentPhase"
            @start-game="startGame"
            @end-game="endGame"
            @advance-phase="advancePhase"
          />
  
          <!-- イベント管理パネル -->
          <event-manager 
            :active-events="activeEvents"
            :available-events="availableEvents"
            :current-phase="currentPhase"
            :game-status="gameStatus"
            @trigger-event="triggerEvent"
            @cancel-event="cancelEvent"
          />
  
          <!-- ユーザーリスト -->
          <user-list 
            :users="users" 
            @view-user="viewUserDetails"
          />
  
          <!-- 価格制御パネル -->
          <price-controls 
            :market-prices="marketPrices"
            @update-price="updatePrice"
          />
  
          <!-- システムログ -->
          <system-log 
            :logs="systemLogs"
            :loading="logsLoading"
          />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import GameControls from '@/components/admin/GameControls.vue';
  import EventManager from '@/components/admin/EventManager.vue';
  import UserList from '@/components/admin/UserList.vue';
  import PriceControls from '@/components/admin/PriceControls.vue';
  import SystemLog from '@/components/admin/SystemLog.vue';
  import { logout, onAuthStateChanged } from '@/firebase/auth';
  import { getUser } from '@/firebase/firestore';
  import { db } from '@/firebase/index';
  import { getFunctions, httpsCallable } from 'firebase/functions';
  import { 
    collection, 
    doc, 
    getDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs,
    onSnapshot
  } from 'firebase/firestore';
  
  export default {
    components: {
      GameControls,
      EventManager,
      UserList,
      PriceControls,
      SystemLog
    },
    name: 'AdminView',
    setup() {
      // Get a reference to the Firebase Functions instance
      const functions = getFunctions();
      
      // Create callable references to your Cloud Functions
      const startGameFunction = httpsCallable(functions, 'startGame');
      const endGameFunction = httpsCallable(functions, 'endGame');
      const advancePhaseFunction = httpsCallable(functions, 'advancePhase');
      const triggerEventFunction = httpsCallable(functions, 'triggerEvent');
      const cancelEventFunction = httpsCallable(functions, 'cancelEvent');
      
      // 新しい価格管理用関数
      const initializeMarketPricesFunction = httpsCallable(functions, 'initializeMarketPrices');
      const manualUpdatePriceFunction = httpsCallable(functions, 'manualUpdatePrice');
      const triggerMarketEventFunction = httpsCallable(functions, 'triggerMarketEvent');
      
      return {
        startGameFunction,
        endGameFunction,
        advancePhaseFunction,
        triggerEventFunction,
        cancelEventFunction,
        initializeMarketPricesFunction,
        manualUpdatePriceFunction,
        triggerMarketEventFunction
      };
    },
    data() {
      return {
        loading: true,
        logsLoading: true,
        // ユーザー情報
        currentUserId: '',
        userName: '',
        userRole: '',
        isAdmin: false,
        // ゲーム管理
        gameStatus: 'waiting', // waiting, active, finished
        currentPhase: 1,
        // ユーザーリスト
        users: [],
        selectedUsers: [], // 選択されたユーザーIDの配列
        participantSearchQuery: '', // 参加者検索クエリ
        // イベント情報
        activeEvents: [],
        availableEvents: [],
        // 市場価格
        marketPrices: {
          kuzellium: 0,
          gold: 0
        },
        // システムログ
        systemLogs: [],
        // リスナー解除用関数
        unsubscribers: []
      };
    },
    computed: {
      // 検索フィルターを適用したユーザーリスト
      filteredUsers() {
        if (!this.users || this.users.length === 0) {
          return [];
        }
        
        // 有効なユーザーIDを持つユーザーのみをフィルタリング
        const validUsers = this.users.filter(user => user && user.userId);
        
        if (!this.participantSearchQuery) {
          return validUsers;
        }
        
        const query = this.participantSearchQuery.toLowerCase();
        return validUsers.filter(user => {
          const username = (user.username || '').toLowerCase();
          const displayName = (user.displayName || '').toLowerCase();
          return username.includes(query) || displayName.includes(query);
        });
      },
    },
    created() {
      // 認証状態の変化を監視
      this.authUnsubscribe = onAuthStateChanged(async (user) => {
        if (user) {
          try {
            // ログイン済みの場合、ユーザーデータを取得
            const userData = await getUser(user.uid);
            this.currentUserId = userData.userId;
            this.userName = userData.displayName || userData.username;
            this.userRole = userData.role;
            this.isAdmin = userData.role === 'admin';
            
            if (this.isAdmin) {
              // 管理者のみデータを取得
              await this.fetchGameStatus();
              await this.fetchUsers();
              await this.fetchEvents();
              await this.fetchMarketPrices();
              this.setupSystemLogsListener();
            }
            
            this.loading = false;
          } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            this.loading = false;
          }
        } else {
          // ログインしていない場合、ログインページにリダイレクト
          this.$router.push('/login');
        }
      });
    },
    beforeDestroy() {
      // コンポーネント破棄時にリスナーを解除
      if (this.authUnsubscribe) {
        this.authUnsubscribe();
      }
      // 他のリスナーも解除
      this.unsubscribers.forEach(unsubscribe => unsubscribe());
    },
    methods: {
      // ゲーム状態を取得
      async fetchGameStatus() {
        try {
          const gameStateRef = doc(db, 'gameState', 'current');
          const gameStateSnap = await getDoc(gameStateRef);
          
          if (gameStateSnap.exists()) {
            const state = gameStateSnap.data();
            this.gameStatus = state.status;
            this.currentPhase = state.currentPhase;
          }
        } catch (error) {
          console.error('ゲーム状態の取得に失敗しました:', error);
        }
      },
      
      // ユーザー一覧を取得
      async fetchUsers() {
        try {
          const usersRef = collection(db, 'users');
          const usersQuery = query(usersRef, orderBy('createdAt', 'desc'));
          const usersSnap = await getDocs(usersQuery);
          
          this.users = usersSnap.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              // ユーザーIDが設定されていない場合はdoc.idを使用
              userId: data.userId || doc.id
            };
          });
        } catch (error) {
          console.error('ユーザー一覧の取得に失敗しました:', error);
          
          // 開発中は代替データを提供
          if (process.env.NODE_ENV === 'development') {
            console.log('開発モード: ユーザーのモックデータを使用します');
            this.setupMockUsers();
          }
        }
      },
      
      // 開発中に使用するモックユーザーデータ
      setupMockUsers() {
        this.users = [
          {
            id: 'user1',
            userId: 'user1',
            username: 'testuser1',
            displayName: 'テストユーザー1',
            role: 'player',
            assets: {
              labDollar: 1000,
              kuzellium: 5,
              gold: 0.1
            },
            createdAt: new Date(Date.now() - 3600000 * 24)
          },
          {
            id: 'user2',
            userId: 'user2',
            username: 'testuser2',
            displayName: 'テストユーザー2',
            role: 'player',
            assets: {
              labDollar: 800,
              kuzellium: 10,
              gold: 0.2
            },
            createdAt: new Date(Date.now() - 3600000 * 23)
          },
          {
            id: 'admin1',
            userId: 'admin1',
            username: 'admin',
            displayName: '管理者',
            role: 'admin',
            assets: {
              labDollar: 2000,
              kuzellium: 20,
              gold: 0.5
            },
            createdAt: new Date(Date.now() - 3600000 * 48)
          }
        ];
      },
      
      // イベント情報を取得
      async fetchEvents() {
        try {
          // イベントが未実装のため、空の配列を設定
          this.activeEvents = [];
          this.availableEvents = [];
          
          // 以下のコードをコメントアウト
          /*
          // アクティブなイベント
          const now = new Date();
          const activeEventsRef = collection(db, 'events');
          const activeEventsQuery = query(
            activeEventsRef,
            where('active', '==', true),
            where('expiresAt', '>', now),
            orderBy('expiresAt', 'asc')
          );
          const activeEventsSnap = await getDocs(activeEventsQuery);
          
          this.activeEvents = activeEventsSnap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          }));
          
          // 利用可能なイベントテンプレート
          const eventsTemplateRef = collection(db, 'eventTemplates');
          const eventsTemplateSnap = await getDocs(eventsTemplateRef);
          
          this.availableEvents = eventsTemplateSnap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          }));
          */
          
          console.log('イベント機能は現在実装中です');
        } catch (error) {
          console.error('イベント情報の取得に失敗しました:', error);
          // エラー時も空の配列を設定
          this.activeEvents = [];
          this.availableEvents = [];
        }
      },
      
      // 市場価格を取得
      async fetchMarketPrices() {
        try {
          const marketDataRef = doc(db, 'marketData', 'currentPrices');
          const marketDataSnap = await getDoc(marketDataRef);
          
          if (marketDataSnap.exists()) {
            const prices = marketDataSnap.data();
            this.marketPrices = {
              kuzellium: prices.kuzellium.price,
              gold: prices.gold.price
            };
          }
        } catch (error) {
          console.error('市場価格の取得に失敗しました:', error);
        }
      },
      
      // システムログの監視設定
      setupSystemLogsListener() {
        try {
          this.logsLoading = true;
          const logsRef = collection(db, 'systemLogs');
          const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
          
          const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
            const logs = [];
            snapshot.forEach(doc => {
              logs.push({
                ...doc.data(),
                id: doc.id
              });
            });
            this.systemLogs = logs;
            this.logsLoading = false;
          }, (error) => {
            console.error('システムログの取得に失敗しました:', error);
            this.systemLogs = []; // エラー時は空の配列を設定
            this.logsLoading = false;
            
            // 開発中の代替データ (Firestoreルールがまだセットアップされていないために使用)
            if (process.env.NODE_ENV === 'development') {
              console.log('開発モード: システムログのモックデータを使用します');
              this.setupMockSystemLogs();
            }
          });
          
          this.unsubscribers.push(unsubscribe);
        } catch (error) {
          console.error('システムログリスナーの設定に失敗しました:', error);
          this.logsLoading = false;
          
          // 開発中の代替データ
          if (process.env.NODE_ENV === 'development') {
            this.setupMockSystemLogs();
          }
        }
      },
      
      // 開発中に使用するモックシステムログデータ
      setupMockSystemLogs() {
        this.systemLogs = [
          {
            id: 'mock1',
            type: 'info',
            title: '開発モード',
            message: 'これはモックデータです。実際のシステムログは権限設定後に表示されます。',
            timestamp: new Date(),
            details: {
              environment: 'development',
              note: 'Firestoreルールを設定してください'
            }
          },
          {
            id: 'mock2',
            type: 'game',
            title: 'ゲームステータス',
            message: '開発中のゲームステータス情報',
            timestamp: new Date(Date.now() - 3600000),
            details: {
              status: this.gameStatus,
              phase: this.currentPhase
            }
          }
        ];
      },
      
      // ユーザー選択関連メソッド
      toggleUserSelection(userId) {
        if (!userId) return;
        
        const index = this.selectedUsers.indexOf(userId);
        if (index === -1) {
          // 選択されていなければ追加
          this.selectedUsers.push(userId);
        } else {
          // 選択済みなら削除
          this.selectedUsers.splice(index, 1);
        }
      },
      
      isUserSelected(userId) {
        if (!userId) return false;
        return this.selectedUsers.includes(userId);
      },
      
      selectAllUsers() {
        if (!this.users || this.users.length === 0) return;
        
        this.selectedUsers = this.users
          .filter(user => user && user.userId && user.role !== 'admin') // 管理者以外を選択
          .map(user => user.userId);
      },
      
      deselectAllUsers() {
        this.selectedUsers = [];
      },
      
      getInitial(user) {
        if (!user) return '?';
        
        const name = user.displayName || user.username || '';
        return name ? name.charAt(0).toUpperCase() : '?';
      },
      
      getUserColor(userId) {
        // ユーザーIDが未定義の場合のフォールバック
        if (!userId) {
          return '#cccccc'; // デフォルトのグレー色を返す
        }
        
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
      
      // ゲーム開始
      async startGame() {
        try {
          if (!this.isAdmin) return;
          
          if (this.selectedUsers.length === 0) {
            alert('ゲームを開始するには、少なくとも1人のユーザーを選択してください');
            return;
          }
          
          // ゲーム開始前の確認メッセージを状態に応じて変更
          let confirmMessage = '';
          if (this.gameStatus === 'finished') {
            confirmMessage = `前回のゲーム結果をリセットし、${this.selectedUsers.length}人のユーザーで新しいゲームを開始します。よろしいですか？`;
          } else {
            confirmMessage = `${this.selectedUsers.length}人のユーザーでゲームを開始します。よろしいですか？`;
          }
          
          const confirmStart = confirm(confirmMessage);
          if (!confirmStart) return;
          
          // ローディング状態を設定
          this.loading = true;
          
          // ゲーム終了状態からの再開始の場合、市場価格を初期化
          if (this.gameStatus === 'finished') {
            try {
              await this.initializeMarketPricesFunction();
            } catch (error) {
              console.error('市場価格の初期化に失敗しました:', error);
              // エラーがあっても続行
            }
          }
          
          // Cloud Functionを呼び出す
          const result = await this.startGameFunction({ participantIds: this.selectedUsers });
          
          // 成功時のメッセージ表示
          alert(result.data.message);
          
          // ゲーム状態を再取得
          await this.fetchGameStatus();
          
          // データを更新
          await Promise.all([
            this.fetchEvents(),
            this.fetchUsers(),
            this.fetchMarketPrices()
          ]);
          
          this.loading = false;
        } catch (error) {
          console.error('ゲーム開始に失敗しました:', error);
          alert(`ゲーム開始に失敗しました: ${error.message || '不明なエラー'}`);
          this.loading = false;
        }
      },
      
      // ゲーム終了
      async endGame() {
        try {
          if (!this.isAdmin) return;
          
          // 終了前の確認
          const confirmEnd = confirm('ゲームを終了し、最終結果を集計します。よろしいですか？');
          if (!confirmEnd) return;
          
          // ローディング状態を設定
          this.loading = true;
          
          // Cloud Functionを呼び出す
          const result = await this.endGameFunction();
          
          // 成功時のメッセージ表示
          alert(result.data.message);
          
          // ゲーム状態を再取得
          await this.fetchGameStatus();
          
          // データを更新
          await Promise.all([
            this.fetchEvents(),
            this.fetchUsers()
          ]);
          
          this.loading = false;
          
          // 結果表示（必要な場合）
          if (result.data.rankings && result.data.rankings.length > 0) {
            // ここでランキング表示などの処理を行う
            console.log('ゲーム結果:', result.data.rankings);
          }
        } catch (error) {
          console.error('ゲーム終了に失敗しました:', error);
          alert(`ゲーム終了に失敗しました: ${error.message || '不明なエラー'}`);
          this.loading = false;
        }
      },
      
      // フェーズ進行
      async advancePhase() {
        try {
          if (!this.isAdmin) return;
          
          // フェーズ進行前の確認
          const confirmAdvance = confirm(`フェーズ${this.currentPhase}からフェーズ${this.currentPhase + 1}に進みます。よろしいですか？`);
          if (!confirmAdvance) return;
          
          // ローディング状態を設定
          this.loading = true;
          
          // Cloud Functionを呼び出す
          const result = await this.advancePhaseFunction();
          
          // 成功時のメッセージ表示
          alert(result.data.message);
          
          // ゲーム状態を再取得
          await this.fetchGameStatus();
          
          // データを更新
          await Promise.all([
            this.fetchEvents(),
            this.fetchUsers()
          ]);
          
          this.loading = false;
        } catch (error) {
          console.error('フェーズ進行に失敗しました:', error);
          alert(`フェーズ進行に失敗しました: ${error.message || '不明なエラー'}`);
          this.loading = false;
        }
      },
      
      // イベント発生
      async triggerEvent(eventId) {
        try {
          if (!this.isAdmin) return;
          
          console.log('イベント発生関数を呼び出し:', eventId);
          await this.fetchEvents();
        } catch (error) {
          console.error('イベント発生に失敗しました:', error);
        }
      },
      
      // イベントキャンセル
      async cancelEvent(eventId) {
        try {
          if (!this.isAdmin) return;
          
          console.log('イベントキャンセル関数を呼び出し:', eventId);
          await this.fetchEvents();
        } catch (error) {
          console.error('イベントキャンセルに失敗しました:', error);
        }
      },
      
      // ユーザー詳細表示
      viewUserDetails(userId) {
        console.log('ユーザー詳細:', userId);
        // 実際の実装ではモーダル表示や別ページへのナビゲーションなど
      },
      
      // 価格更新
      async updatePrice(assetType, newPrice) {
        try {
          if (!this.isAdmin) return;
          
          const confirmUpdate = confirm(`${assetType}の価格を${newPrice}円に更新しますか？`);
          if (!confirmUpdate) return;
          
          this.loading = true;
          
          // Cloud Functionを呼び出す - 価格パラメータを追加
          const result = await this.manualUpdatePriceFunction({ 
            assetType,
            price: newPrice  // 重要: 新しい価格を渡す
          });
          
          // 成功時のメッセージ表示
          alert(result.data.message || '価格を更新しました');
          
          // 市場価格を再取得
          await this.fetchMarketPrices();
          
          this.loading = false;
        } catch (error) {
          console.error('価格更新に失敗しました:', error);
          alert(`価格更新に失敗しました: ${error.message || '不明なエラー'}`);
          this.loading = false;
        }
      },
      async initializeMarketPrices() {
        try {
          if (!this.isAdmin) return;
          
          const confirmReset = confirm('市場価格を初期値にリセットしますか？');
          if (!confirmReset) return;
          
          this.loading = true;
          
          // Cloud Functionを呼び出す
          const result = await this.initializeMarketPricesFunction();
          
          // 成功時のメッセージ表示
          alert(result.data.message || '市場価格を初期化しました');
          
          // 市場価格を再取得
          await this.fetchMarketPrices();
          
          this.loading = false;
        } catch (error) {
          console.error('市場価格の初期化に失敗しました:', error);
          alert(`市場価格の初期化に失敗しました: ${error.message || '不明なエラー'}`);
          this.loading = false;
        }
      },
      // イベントによる価格変動メソッドを追加
      async triggerMarketEvent(eventType, assetType, effectPercent) {
        try {
          if (!this.isAdmin) return;
          
          const confirmEvent = confirm(`${eventType}イベントを発生させ、${assetType}の価格を${effectPercent > 0 ? '上昇' : '下落'}させますか？`);
          if (!confirmEvent) return;
          
          this.loading = true;
          
          // Cloud Functionを呼び出す
          const result = await this.triggerMarketEventFunction({ 
            eventType,
            assetType,
            effectPercent
          });
          
          // 成功時のメッセージ表示
          alert(result.data.message || 'イベントを発生させました');
          
          // 市場価格を再取得
          await this.fetchMarketPrices();
          
          this.loading = false;
        } catch (error) {
          console.error('イベント発生に失敗しました:', error);
          alert(`イベント発生に失敗しました: ${error.message || '不明なエラー'}`);
          this.loading = false;
        }
      },
    }
  };
  </script>
  
  <style scoped>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .view-header {
    margin-bottom: 20px;
  }
  
  .view-header h2 {
    font-size: 24px;
    margin-bottom: 4px;
  }
  
  .view-header p {
    color: #666;
  }
  
  .loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 0;
    text-align: center;
  }
  
  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top: 4px solid #3498db;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-container i {
    font-size: 48px;
    color: #e74c3c;
    margin-bottom: 16px;
  }
  
  .primary-button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 16px;
  }
  
  .admin-panels {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .participants-selection {
    grid-column: span 2;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .selection-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .selection-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .selection-count {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .count-value {
    font-size: 20px;
    font-weight: 600;
    color: #3498db;
  }
  
  .selection-actions {
    display: flex;
    gap: 8px;
  }
  
  .selection-action-button {
    padding: 6px 12px;
    background-color: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
  }
  
  .search-filter {
    max-width: 300px;
    flex: 1;
  }
  
  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .participants-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
    max-height: 300px;
    overflow-y: auto;
    padding: 4px;
    margin-bottom: 16px;
  }
  
  .participant-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid #eee;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .participant-item:hover {
    background-color: #f5f9fc;
  }
  
  .participant-item.selected {
    background-color: #ebf5fb;
    border-color: #3498db;
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 16px;
  }
  
  .user-info {
    flex: 1;
  }
  
  .user-name {
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .user-role {
    font-size: 12px;
    color: #7f8c8d;
  }
  
  .selection-indicator {
    color: #ddd;
    font-size: 18px;
  }
  
  .selected .selection-indicator {
    color: #3498db;
  }
  
  .selection-summary {
    background-color: #f8f9fa;
    padding: 12px;
    border-radius: 4px;
    text-align: center;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .admin-panels {
      grid-template-columns: 1fr;
    }
    
    .participants-selection {
      grid-column: span 1;
    }
    
    .selection-controls {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }
    
    .selection-info {
      justify-content: space-between;
    }
    
    .search-filter {
      max-width: none;
    }
  }
  </style>