<template>
    <v-card flat tile class="market-summary-card">
      <v-card-title class="d-flex align-center justify-space-between pb-0">
        <span class="headline font-weight-bold">資産価格推移</span>
        <div class="d-flex align-center">
          <v-btn
            icon
            small
            class="mr-2"
            title="グラフをリセット"
            @click="resetChart"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
          <v-select
            v-model="selectedAsset"
            :items="assetOptions"
            dense
            solo
            flat
            hide-details
            class="asset-selector"
          ></v-select>
        </div>
      </v-card-title>
    
      <v-card-text>
        <div class="price-chart-container">
          <div class="price-details">
            <div class="current-price">
              <span class="price-label">現在価格</span>
              <span class="price-value">{{ formatNumber(currentPrice) }}円</span>
            </div>
            <div 
              class="price-change" 
              :class="{
                'text-success': priceChange > 0,
                'text-error': priceChange < 0
              }"
            >
              {{ priceChange > 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
            </div>
          </div>
  
          <!-- 折れ線グラフ表示エリア -->
          <div class="line-chart-container" ref="chartContainer">
            <canvas ref="lineChart"></canvas>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  import { 
    doc, 
    collection, 
    query, 
    orderBy, 
    limit, 
    onSnapshot,
    getDoc 
  } from 'firebase/firestore';
  import { db } from '@/firebase/index';
  import Chart from 'chart.js/auto';
  
  export default {
    name: 'MarketSummary',
    data() {
      return {
        selectedAsset: 'kuzellium',
        assetOptions: [
          { text: 'クーゼリアム (KZM)', value: 'kuzellium' },
          { text: 'ゴールド (AU)', value: 'gold' }
        ],
        kuzelliumPriceHistory: [],
        goldPriceHistory: [],
        unsubscribeCurrentPrice: null,
        unsubscribePriceHistory: null,
        currentPriceData: null,
        chart: null,
        maxDataPoints: 50, // 保持する価格データの最大数
        lastTimestamps: {
          kuzellium: null,
          gold: null
        },
        pollingTimer: null, // ポーリング用タイマー
        pollingInterval: 3000 // ポーリング間隔 (3秒)
      };
    },
    computed: {
      priceHistory() {
        return this.selectedAsset === 'kuzellium' 
          ? this.kuzelliumPriceHistory 
          : this.goldPriceHistory;
      },
      currentPrice() {
        const history = this.priceHistory;
        return history.length > 0 ? history[history.length - 1].price : 0;
      },
      priceChange() {
        const history = this.priceHistory;
        if (history.length < 2) return 0;
        const firstPrice = history[0].price;
        const lastPrice = history[history.length - 1].price;
        return ((lastPrice - firstPrice) / firstPrice) * 100;
      }
    },
    methods: {
      // グラフをリセットする新しいメソッド
      resetChart() {
        // データをクリア
        this.kuzelliumPriceHistory = [];
        this.goldPriceHistory = [];
        this.lastTimestamps = {
          kuzellium: null,
          gold: null
        };
        
        // ローカルストレージからも削除
        localStorage.removeItem('kuzelliumPriceHistory');
        localStorage.removeItem('goldPriceHistory');
        
        // チャートの更新
        this.updateChart();
        
        // 最新の価格データを再取得
        this.fetchInitialData();
      },
      
      // 初期データを取得
      async fetchInitialData() {
        try {
          const currentPriceRef = doc(db, 'marketData', 'currentPrices');
          const priceDoc = await getDoc(currentPriceRef);
          
          if (priceDoc.exists()) {
            const marketData = priceDoc.data();
            
            // クーゼリアムの初期データを追加
            if (marketData.kuzellium && marketData.kuzellium.updatedAt) {
              const timestamp = marketData.kuzellium.updatedAt.toMillis();
              this.kuzelliumPriceHistory.push({
                price: marketData.kuzellium.price,
                timestamp: timestamp,
                time: new Date(timestamp).toLocaleTimeString()
              });
              this.lastTimestamps.kuzellium = timestamp;
            }
            
            // 金の初期データを追加
            if (marketData.gold && marketData.gold.updatedAt) {
              const timestamp = marketData.gold.updatedAt.toMillis();
              this.goldPriceHistory.push({
                price: marketData.gold.price,
                timestamp: timestamp,
                time: new Date(timestamp).toLocaleTimeString()
              });
              this.lastTimestamps.gold = timestamp;
            }
            
            // チャートを更新
            this.updateChart();
          }
        } catch (error) {
          console.error('初期データの取得に失敗しました:', error);
        }
      },
      
      // ローカルストレージからデータを読み込む
      loadFromLocalStorage() {
        try {
          const kuzelliumData = localStorage.getItem('kuzelliumPriceHistory');
          const goldData = localStorage.getItem('goldPriceHistory');
          
          if (kuzelliumData) {
            this.kuzelliumPriceHistory = JSON.parse(kuzelliumData);
            this.lastTimestamps.kuzellium = this.kuzelliumPriceHistory.length > 0 
              ? this.kuzelliumPriceHistory[this.kuzelliumPriceHistory.length - 1].timestamp 
              : null;
          }
          
          if (goldData) {
            this.goldPriceHistory = JSON.parse(goldData);
            this.lastTimestamps.gold = this.goldPriceHistory.length > 0 
              ? this.goldPriceHistory[this.goldPriceHistory.length - 1].timestamp 
              : null;
          }
        } catch (error) {
          console.error('ローカルストレージからの読み込みに失敗しました:', error);
        }
      },
      
      // ローカルストレージにデータを保存
      saveToLocalStorage() {
        try {
          localStorage.setItem('kuzelliumPriceHistory', JSON.stringify(this.kuzelliumPriceHistory));
          localStorage.setItem('goldPriceHistory', JSON.stringify(this.goldPriceHistory));
        } catch (error) {
          console.error('ローカルストレージへの保存に失敗しました:', error);
        }
      },
      
      // 価格履歴を取得
      fetchPriceHistory() {
        try {
          // 価格履歴のクエリ
          const priceHistoryRef = collection(
            db, 
            'marketData', 
            'priceHistory', 
            this.selectedAsset
          );
          
          // より多くのデータを取得するように変更
          const priceQuery = query(
            priceHistoryRef, 
            orderBy('timestamp', 'desc'), 
            limit(20) // 取得件数を増やす
          );
          
          // リアルタイムリスナーをセットアップ
          this.unsubscribePriceHistory = onSnapshot(
            priceQuery, 
            (snapshot) => {
              let historyUpdated = false;
              
              // 新しいデータだけを追加
              snapshot.docs.forEach(doc => {
                const data = doc.data();
                // タイムスタンプをミリ秒に変換
                const timestamp = data.timestamp.toMillis();
                
                // 最後に保存したタイムスタンプより新しいデータのみ追加
                if (!this.lastTimestamps[this.selectedAsset] || 
                    timestamp > this.lastTimestamps[this.selectedAsset]) {
                  
                  console.log(`新しい${this.selectedAsset}価格履歴を検出:`, data.price);
                  
                  if (this.selectedAsset === 'kuzellium') {
                    // 重複チェック
                    const exists = this.kuzelliumPriceHistory.some(item => item.timestamp === timestamp);
                    if (!exists) {
                      this.kuzelliumPriceHistory.push({
                        price: data.price,
                        timestamp: timestamp,
                        time: new Date(timestamp).toLocaleTimeString()
                      });
                      // データを時間順にソート
                      this.kuzelliumPriceHistory.sort((a, b) => a.timestamp - b.timestamp);
                      // データが最大数を超えたら古いものから削除
                      if (this.kuzelliumPriceHistory.length > this.maxDataPoints) {
                        this.kuzelliumPriceHistory.shift();
                      }
                      this.lastTimestamps.kuzellium = timestamp;
                      historyUpdated = true;
                    }
                  } else {
                    // 重複チェック
                    const exists = this.goldPriceHistory.some(item => item.timestamp === timestamp);
                    if (!exists) {
                      this.goldPriceHistory.push({
                        price: data.price,
                        timestamp: timestamp,
                        time: new Date(timestamp).toLocaleTimeString()
                      });
                      // データを時間順にソート
                      this.goldPriceHistory.sort((a, b) => a.timestamp - b.timestamp);
                      // データが最大数を超えたら古いものから削除
                      if (this.goldPriceHistory.length > this.maxDataPoints) {
                        this.goldPriceHistory.shift();
                      }
                      this.lastTimestamps.gold = timestamp;
                      historyUpdated = true;
                    }
                  }
                }
              });
              
              // データが更新されたらチャートと保存を更新
              if (historyUpdated) {
                this.updateChart();
                this.saveToLocalStorage();
              }
            },
            (error) => {
              console.error('価格履歴の取得に失敗しました:', error);
            }
          );
        } catch (error) {
          console.error('価格履歴の取得に失敗しました:', error);
        }
      },
  
      // 現在の価格をリアルタイムで取得
      setupCurrentPriceListener() {
        const currentPriceRef = doc(db, 'marketData', 'currentPrices');
  
        this.unsubscribeCurrentPrice = onSnapshot(
          currentPriceRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const marketData = docSnapshot.data();
              
              // クーゼリアムの価格更新
              if (marketData.kuzellium && marketData.kuzellium.updatedAt) {
                const kuzelliumData = marketData.kuzellium;
                const timestamp = kuzelliumData.updatedAt.toMillis();
                
                // 最後に保存したタイムスタンプより新しいデータのみ追加
                if (!this.lastTimestamps.kuzellium || 
                    timestamp > this.lastTimestamps.kuzellium) {
                  
                  // 重複チェック
                  const exists = this.kuzelliumPriceHistory.some(item => item.timestamp === timestamp);
                  if (!exists) {
                    this.kuzelliumPriceHistory.push({
                      price: kuzelliumData.price,
                      timestamp: timestamp,
                      time: new Date(timestamp).toLocaleTimeString()
                    });
                    
                    // データを時間順にソート
                    this.kuzelliumPriceHistory.sort((a, b) => a.timestamp - b.timestamp);
                    
                    // データが最大数を超えたら古いものから削除
                    if (this.kuzelliumPriceHistory.length > this.maxDataPoints) {
                      this.kuzelliumPriceHistory.shift();
                    }
                    
                    this.lastTimestamps.kuzellium = timestamp;
                  }
                }
              }
              
              // 金の価格更新
              if (marketData.gold && marketData.gold.updatedAt) {
                const goldData = marketData.gold;
                const timestamp = goldData.updatedAt.toMillis();
                
                // 最後に保存したタイムスタンプより新しいデータのみ追加
                if (!this.lastTimestamps.gold || 
                    timestamp > this.lastTimestamps.gold) {
                  
                  // 重複チェック
                  const exists = this.goldPriceHistory.some(item => item.timestamp === timestamp);
                  if (!exists) {
                    this.goldPriceHistory.push({
                      price: goldData.price,
                      timestamp: timestamp,
                      time: new Date(timestamp).toLocaleTimeString()
                    });
                    
                    // データを時間順にソート
                    this.goldPriceHistory.sort((a, b) => a.timestamp - b.timestamp);
                    
                    // データが最大数を超えたら古いものから削除
                    if (this.goldPriceHistory.length > this.maxDataPoints) {
                      this.goldPriceHistory.shift();
                    }
                    
                    this.lastTimestamps.gold = timestamp;
                  }
                }
              }
              
              // データが更新されたらチャートと保存を更新
              this.updateChart();
              this.saveToLocalStorage();
            }
          },
          (error) => {
            console.error('現在の価格の取得に失敗しました:', error);
          }
        );
      },
      
      // ポーリングで最新の価格を取得する関数
      async pollLatestPrices() {
        try {
          const currentPriceRef = doc(db, 'marketData', 'currentPrices');
          const priceDoc = await getDoc(currentPriceRef);
          
          if (priceDoc.exists()) {
            const marketData = priceDoc.data();
            
            // クーゼリアムの価格更新
            if (marketData.kuzellium && marketData.kuzellium.updatedAt) {
              const kuzelliumData = marketData.kuzellium;
              const timestamp = kuzelliumData.updatedAt.toMillis();
              
              // 最後のデータと比較して新しいか確認
              const lastKuzellium = this.kuzelliumPriceHistory.length > 0 
                ? this.kuzelliumPriceHistory[this.kuzelliumPriceHistory.length - 1] 
                : null;
                  
              if (!lastKuzellium || timestamp > lastKuzellium.timestamp) {
                console.log('新しいクーゼリアム価格を検出:', kuzelliumData.price);
                
                this.kuzelliumPriceHistory.push({
                  price: kuzelliumData.price,
                  timestamp: timestamp,
                  time: new Date(timestamp).toLocaleTimeString()
                });
                
                // データを時間順にソート
                this.kuzelliumPriceHistory.sort((a, b) => a.timestamp - b.timestamp);
                
                // データが最大数を超えたら古いものから削除
                if (this.kuzelliumPriceHistory.length > this.maxDataPoints) {
                  this.kuzelliumPriceHistory.shift();
                }
                
                this.lastTimestamps.kuzellium = timestamp;
                
                // 選択中の資産がクーゼリアムならチャートを更新
                if (this.selectedAsset === 'kuzellium') {
                  this.updateChart();
                }
                
                this.saveToLocalStorage();
              }
            }
            
            // 金の価格更新
            if (marketData.gold && marketData.gold.updatedAt) {
              const goldData = marketData.gold;
              const timestamp = goldData.updatedAt.toMillis();
              
              // 最後のデータと比較して新しいか確認
              const lastGold = this.goldPriceHistory.length > 0 
                ? this.goldPriceHistory[this.goldPriceHistory.length - 1] 
                : null;
                  
              if (!lastGold || timestamp > lastGold.timestamp) {
                console.log('新しい金価格を検出:', goldData.price);
                
                this.goldPriceHistory.push({
                  price: goldData.price,
                  timestamp: timestamp,
                  time: new Date(timestamp).toLocaleTimeString()
                });
                
                // データを時間順にソート
                this.goldPriceHistory.sort((a, b) => a.timestamp - b.timestamp);
                
                // データが最大数を超えたら古いものから削除
                if (this.goldPriceHistory.length > this.maxDataPoints) {
                  this.goldPriceHistory.shift();
                }
                
                this.lastTimestamps.gold = timestamp;
                
                // 選択中の資産が金ならチャートを更新
                if (this.selectedAsset === 'gold') {
                  this.updateChart();
                }
                
                this.saveToLocalStorage();
              }
            }
          }
        } catch (error) {
          console.error('ポーリングによる価格取得に失敗:', error);
        }
      },
      
      // チャートの初期化
      initializeChart() {
        const ctx = this.$refs.lineChart.getContext('2d');
        
        // 既存のチャートがあれば破棄
        if (this.chart) {
          this.chart.destroy();
        }
        
        // 新しいチャートを作成
        this.chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: this.priceHistory.map(item => item.time),
            datasets: [{
              label: this.selectedAsset === 'kuzellium' ? 'クーゼリアム' : 'ゴールド',
              data: this.priceHistory.map(item => item.price),
              borderColor: this.selectedAsset === 'kuzellium' ? '#1976D2' : '#FFC107',
              backgroundColor: this.selectedAsset === 'kuzellium' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(255, 193, 7, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 500
            },
            scales: {
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 45,
                  callback: function(value, index, values) {
                    // ラベルの数を減らす
                    return index % 3 === 0 ? this.getLabelForValue(value) : '';
                  }
                }
              },
              y: {
                beginAtZero: false
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw;
                    return `${this.formatNumber(value)}円`;
                  }
                }
              }
            }
          }
        });
      },
      
      // チャートの更新
      updateChart() {
        if (!this.chart) {
          this.initializeChart();
          return;
        }
        
        // データセットの更新
        this.chart.data.labels = this.priceHistory.map(item => item.time);
        this.chart.data.datasets[0].data = this.priceHistory.map(item => item.price);
        this.chart.data.datasets[0].label = this.selectedAsset === 'kuzellium' ? 'クーゼリアム' : 'ゴールド';
        this.chart.data.datasets[0].borderColor = this.selectedAsset === 'kuzellium' ? '#1976D2' : '#FFC107';
        this.chart.data.datasets[0].backgroundColor = this.selectedAsset === 'kuzellium' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(255, 193, 7, 0.1)';
        
        this.chart.update();
      },
  
      // 数値をフォーマット
      formatNumber(value) {
        return new Intl.NumberFormat('ja-JP').format(Math.round(value));
      }
    },
    watch: {
      // 選択された資産が変更されたらチャートを更新
      selectedAsset() {
        this.updateChart();
      }
    },
    mounted() {
      // ローカルストレージからデータをロード
      this.loadFromLocalStorage();
      
      // リアルタイムリスナーをセットアップ
      this.setupCurrentPriceListener();
      this.fetchPriceHistory();
      
      // ポーリングタイマーをセットアップ
      this.pollingTimer = setInterval(() => {
        this.pollLatestPrices();
      }, this.pollingInterval);
      
      // チャートの初期化
      this.$nextTick(() => {
        this.initializeChart();
      });
    },
    beforeUnmount() {
      // コンポーネント破棄時にリスナーを解除
      if (this.unsubscribePriceHistory) {
        this.unsubscribePriceHistory();
      }
      if (this.unsubscribeCurrentPrice) {
        this.unsubscribeCurrentPrice();
      }
      
      // ポーリングタイマーを解除
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
      }
      
      // チャートのインスタンスを破棄
      if (this.chart) {
        this.chart.destroy();
      }
    }
  };
  </script>
  
  <style scoped>
  .market-summary-card {
    border: 1px solid rgba(0,0,0,0.1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .asset-selector {
    max-width: 200px;
  }
  
  .price-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 8px;
  }
  
  .current-price {
    display: flex;
    flex-direction: column;
  }
  
  .price-label {
    color: rgba(0, 0, 0, 0.6);
    font-size: 0.75rem;
  }
  
  .price-value {
    font-size: 1.25rem;
    font-weight: bold;
  }
  
  .price-change {
    font-weight: bold;
  }
  
  .price-chart-container {
    height: 320px;
    width: 100%;
    background-color: #f5f5f5;
    border-radius: 8px;
    padding: 16px;
  }
  
  .line-chart-container {
    height: 220px;
    width: 100%;
  }
  
  /* テキスト色 */
  .text-success {
    color: #4CAF50;
  }
  
  .text-error {
    color: #F44336;
  }
  
  /* レスポンシブ対応 */
  @media (max-width: 600px) {
    .price-details {
      flex-direction: column;
      align-items: flex-start;
    }
  
    .price-change {
      margin-top: 8px;
    }
  
    .price-chart-container {
      height: 280px;
    }
    
    .line-chart-container {
      height: 180px;
    }
  }
  </style>