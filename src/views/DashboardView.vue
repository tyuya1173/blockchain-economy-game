<template>
    <div class="container">
      <!-- コンテンツエリア -->
      <div class="content">
        <div class="view-header">
          <h2>ダッシュボード</h2>
          <p>資産状況と最近の取引履歴</p>
        </div>
  
        <!-- アクティブなイベント通知がある場合に表示 -->
        <div v-if="activeEvent" class="event-notification">
          <i class="fas fa-exclamation-triangle"></i>
          <div>
            <strong>{{ activeEvent.name }}</strong>
            <p>{{ activeEvent.description }}</p>
          </div>
        </div>
  
        <!-- 資産サマリー -->
        <asset-summary 
          :user-assets="userAssets"
          :market-prices="marketPrices"
        />
  
        <!-- 資産価格推移 -->
        <market-summary 
          :market-prices="marketPrices"
        />
  
        <!-- 最近の取引 -->
        <transaction-history 
          :current-user-id="currentUserId"
          :transactions="recentTransactions"
        />
        
        <!-- ランキング -->
        <user-ranking 
          :current-user-id="currentUserId"
          :players="topPlayers"
          :loading="loading"
        />
      </div>
    </div>
  </template>
  
  <script>
  import AssetSummary from '@/components/dashboard/AssetSummary.vue';
  import MarketSummary from '@/components/dashboard/MarketSummary.vue';
  import TransactionHistory from '@/components/dashboard/TransactionHistory.vue';
  import UserRanking from '@/components/dashboard/UserRanking.vue';
  import { logout, onAuthStateChanged } from '@/firebase/auth';
  import { getUser, getUserAssets } from '@/firebase/firestore';
  import { db } from '@/firebase/index';
  import { 
    collection, 
    doc, 
    getDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs 
  } from 'firebase/firestore';
  
  export default {
    components: {
      AssetSummary,
      MarketSummary,
      TransactionHistory,
      UserRanking,
    },
    name: 'DashboardView',
    data() {
      return {
        loading: true,
        // ユーザー情報
        currentUserId: '',
        userName: '',
        userRole: 'プレイヤー',
        isAdmin: false,
        // 資産情報
        userAssets: {
          labDollar: 0,
          kuzellium: 0,
          gold: 0
        },
        // 市場価格
        marketPrices: {
          kuzellium: 100, // 初期値 100円
          gold: 10000      // 初期値 10,000円
        },
        // 取引履歴
        recentTransactions: [],
        // イベント情報
        activeEvent: null,
        // ランキング
        topPlayers: [],
      };
    },
    computed: {
      userInitial() {
        return this.userName ? this.userName.charAt(0).toUpperCase() : 'U';
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
            this.userRole = userData.role === 'admin' ? '管理者' : 'プレイヤー';
            this.isAdmin = userData.role === 'admin';
            
            // ユーザーの資産を取得
            const assets = await getUserAssets(userData.userId);
            this.userAssets = assets;
            
            // 他のデータ取得処理を実行
            await this.fetchMarketPrices();
            await this.fetchRecentTransactions();
            await this.fetchActiveEvent();
            await this.fetchTopPlayers();
            
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
    },
    methods: {
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
      
      // 最近の取引を取得
      async fetchRecentTransactions() {
        try {
          const transactionsRef = collection(db, 'transactions');
          
          // 送信した取引
          const sentQuery = query(
            transactionsRef,
            where('fromUser', '==', this.currentUserId),
            orderBy('timestamp', 'desc'),
            limit(5)
          );
          const sentTransactionsSnap = await getDocs(sentQuery);
          
          // 受信した取引
          const receivedQuery = query(
            transactionsRef,
            where('toUser', '==', this.currentUserId),
            orderBy('timestamp', 'desc'),
            limit(5)
          );
          const receivedTransactionsSnap = await getDocs(receivedQuery);
          
          const allTransactions = [
            ...sentTransactionsSnap.docs.map(doc => ({
              ...doc.data(),
              id: doc.id
            })),
            ...receivedTransactionsSnap.docs.map(doc => ({
              ...doc.data(),
              id: doc.id
            }))
          ];
          
          // タイムスタンプで降順ソート
          this.recentTransactions = allTransactions
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);
        } catch (error) {
          console.error('取引履歴の取得に失敗しました:', error);
        }
      },
      
      // アクティブなイベントを取得
      async fetchActiveEvent() {
        try {
          const now = new Date();
          const eventsRef = collection(db, 'events');
          const eventQuery = query(
            eventsRef,
            where('active', '==', true),
            where('expiresAt', '>', now),
            limit(1)
          );
          
          const eventsSnap = await getDocs(eventQuery);
          
          if (!eventsSnap.empty) {
            this.activeEvent = eventsSnap.docs[0].data();
          }
        } catch (error) {
          console.error('イベント情報の取得に失敗しました:', error);
        }
      },
      
      // ランキングを取得
      async fetchTopPlayers() {
        try {
          // 実際の実装では、サーバー側で計算したランキングを取得する必要があります
          // ここではデモのためのモックデータを使用
          const usersRef = collection(db, 'users');
          const usersQuery = query(usersRef, limit(10));
          const usersSnap = await getDocs(usersQuery);
          
          const players = [];
          usersSnap.forEach(doc => {
            const userData = doc.data();
            // 円換算の総資産価値を計算
            const totalValue = 
              userData.assets.labDollar * 100 +
              userData.assets.kuzellium * this.marketPrices.kuzellium +
              userData.assets.gold * this.marketPrices.gold;
              
            players.push({
              userId: userData.userId,
              displayName: userData.displayName || userData.username,
              totalValue
            });
          });
          
          // 資産価値で降順ソート
          this.topPlayers = players.sort((a, b) => b.totalValue - a.totalValue);
        } catch (error) {
          console.error('ランキングの取得に失敗しました:', error);
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .container {
    display: flex;
    min-height: 100vh;
  }
  
  .content {
    flex-grow: 1;
    padding: 24px;
    overflow-y: auto;
  }
  
  .view-header {
    margin-bottom: 24px;
  }
  
  .view-header h2 {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }
  
  .event-notification {
    background-color: #ff9800;
    color: white;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
  }
  
  .event-notification i {
    margin-right: 12px;
    font-size: 1.5rem;
  }
  
  /* レスポンシブデザイン */
  @media (max-width: 768px) {
    .container {
      flex-direction: column;
    }
  }
  </style>