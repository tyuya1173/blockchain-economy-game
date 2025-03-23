<template>
    <v-card class="asset-price-card" :class="`border-left-${asset.color}`">
      <v-card-text>
        <div class="d-flex align-center justify-space-between">
          <div class="asset-icon-container" :class="`bg-${asset.color} lighten-4`">
            <v-icon :color="asset.color">{{ asset.icon }}</v-icon>
          </div>
          <div class="asset-change" :class="currentChangePercent >= 0 ? 'text-success' : 'text-error'">
            <v-icon small :color="currentChangePercent >= 0 ? 'success' : 'error'">
              {{ currentChangePercent >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
            {{ currentChangePercent > 0 ? '+' : '' }}{{ currentChangePercent.toFixed(2) }}%
          </div>
        </div>
        
        <div class="asset-name mt-2">{{ asset.name }}</div>
        <div class="d-flex align-center mt-1">
          <span class="asset-price">{{ formatNumber(currentPrice) }}</span>
          <span class="asset-currency ml-1">円 / {{ asset.symbol }}</span>
        </div>
        
        <v-divider class="my-3"></v-divider>
        
        <div class="d-flex align-center justify-space-between">
          <div class="asset-data">
            <div class="asset-data-label">ボラティリティ</div>
            <div class="d-flex align-center">
              <v-chip 
                x-small 
                :color="volatilityData.color" 
                class="volatility-chip"
                text-color="white"
              >
                {{ volatilityData.label }}
              </v-chip>
            </div>
          </div>
          <div class="asset-data text-right">
            <div class="asset-data-label">次回更新まで</div>
            <div class="asset-data-value countdown-timer">
              {{ countdownText }}
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  import { subscribeToPriceUpdates } from '@/firebase/realtime';
  import { ref, get } from 'firebase/database';
  import { rtdb } from '@/firebase/index'; // Realtime Database参照をrtdbとしてインポート
  
  export default {
    name: 'AssetPriceCard',
    props: {
      asset: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        currentPrice: this.asset.price,
        currentChangePercent: this.asset.changePercent,
        lastUpdatedAt: null,
        priceHistory: [],
        volatility: 0,
        countdown: 0,
        countdownInterval: null,
        isCountdownSynced: false, // カウントダウンがサーバーと同期済みかどうか
        unsubscriber: null
      };
    },
    computed: {
      // ボラティリティに基づいた表示データを計算
      volatilityData() {
        const absChange = Math.abs(this.currentChangePercent);
        
        if (absChange < 2) {
          return { label: '安定', color: 'success' };
        } else if (absChange < 5) {
          return { label: '変動中', color: 'warning' };
        } else {
          return { label: '急変動', color: 'error' };
        }
      },
      // カウントダウンの表示テキスト
      countdownText() {
        if (this.asset.id === 'labDollar') {
          return '固定価格';
        }
        
        if (!this.isCountdownSynced) {
          return '同期中...';
        }
        
        if (this.countdown <= 0) {
          return '更新中...';
        }
        
        const minutes = Math.floor(this.countdown / 60);
        const seconds = this.countdown % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      },
      // 更新間隔を秒単位で取得（全ての資産で1分=60秒）
      updateInterval() {
        return 60; // 1分に統一
      }
    },
    async created() {
      if (this.asset.id !== 'labDollar') {
        // 初期値を取得してからリスナーをセットアップ
        await this.fetchInitialPriceData();
        this.setupPriceListener();
      }
    },
    mounted() {
      // カウントダウンタイマーを開始
      this.startCountdownTimer();
    },
    methods: {
      formatNumber(value) {
        return new Intl.NumberFormat('ja-JP').format(Math.round(value));
      },
      // サーバーから最新の価格データを取得して同期
      async fetchInitialPriceData() {
        try {
          // Firebase Databaseから直接最新の価格情報を取得
          const priceRef = ref(rtdb, `prices/${this.asset.id}`);
          const snapshot = await get(priceRef);
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            console.log(`${this.asset.name}: 初期価格データを取得:`, data);
            
            this.currentPrice = data.price;
            this.lastUpdatedAt = data.updatedAt;
            this.currentChangePercent = data.changePercent || 0;
            
            // トリガー情報も取得して、次の更新タイミングをより正確に計算
            const triggerRef = ref(rtdb, 'triggers/priceUpdate');
            const triggerSnapshot = await get(triggerRef);
            
            if (triggerSnapshot.exists()) {
              const triggerData = triggerSnapshot.val();
              console.log('最新のトリガー情報:', triggerData);
              
              // トリガー時刻とサーバーの更新スケジュールを使って次の更新時刻を計算
              this.syncWithServerUpdateSchedule(triggerData.timestamp, data.updatedAt);
            } else {
              // トリガー情報がない場合は、最後の更新時刻から計算
              this.syncWithServerUpdateSchedule(null, data.updatedAt);
            }
          }
        } catch (error) {
          console.error(`${this.asset.name}: 初期データ取得エラー:`, error);
          // エラー時はデフォルトのカウントダウン計算に頼る
          this.calculateInitialCountdown();
        }
      },
      // サーバーの更新スケジュールと同期してカウントダウンを計算
      syncWithServerUpdateSchedule(triggerTimestamp, lastUpdateTimestamp) {
        const now = Date.now();
        
        // 最後の更新時刻から次の1分間隔の更新時刻を計算
        const lastUpdate = lastUpdateTimestamp || now;
        
        // 1分間隔でのスケジュールに基づいて次の更新時刻を計算
        // 最後の更新時刻に端数の秒があれば、次の「分」の0秒に合わせる
        const lastUpdateDate = new Date(lastUpdate);
        
        // 次の更新は「次の分の0秒」
        const nextMinute = new Date(lastUpdateDate);
        nextMinute.setMinutes(nextMinute.getMinutes() + 1);
        nextMinute.setSeconds(0);
        nextMinute.setMilliseconds(0);
        
        // 次の更新までの残り時間（秒）
        let secondsUntilNextUpdate = Math.round((nextMinute.getTime() - now) / 1000);
        
        // すでに次の更新時刻を過ぎている場合
        if (secondsUntilNextUpdate <= 0) {
          // 次の分の更新時刻を計算
          const futureMinute = new Date(now);
          futureMinute.setMinutes(futureMinute.getMinutes() + 1);
          futureMinute.setSeconds(0);
          futureMinute.setMilliseconds(0);
          secondsUntilNextUpdate = Math.round((futureMinute.getTime() - now) / 1000);
        }
        
        // 更新の遅延を考慮して数秒のマージンを追加（Firebaseの関数実行に若干の遅延がある）
        secondsUntilNextUpdate = Math.max(3, secondsUntilNextUpdate);
        
        console.log(`${this.asset.name}: 次の更新まで約${secondsUntilNextUpdate}秒（${new Date(now + secondsUntilNextUpdate * 1000).toLocaleTimeString()}頃）`);
        
        // カウントダウンを設定
        this.countdown = secondsUntilNextUpdate;
        this.isCountdownSynced = true;
      },
      setupPriceListener() {
        // ラボドルは価格固定なのでリスナー不要
        if (this.asset.id === 'labDollar') {
          return;
        }
        
        console.log(`${this.asset.name}: 価格リスナーをセットアップ中... (更新間隔: 1分)`);
        
        // 資産の価格リスナー
        this.unsubscriber = subscribeToPriceUpdates(this.asset.id, (data) => {
          console.log(`${this.asset.name}価格更新:`, data);
          if (data && data.price !== undefined) {
            // 前回の価格を保存
            const previousPrice = this.currentPrice;
            this.currentPrice = data.price;
            
            // 更新時刻を記録
            this.lastUpdatedAt = data.updatedAt || Date.now();
            
            // 価格履歴を更新（最大10件保持）
            this.priceHistory.push({
              price: data.price,
              timestamp: this.lastUpdatedAt
            });
            if (this.priceHistory.length > 10) {
              this.priceHistory.shift();
            }
            
            // 変動率を計算
            if (data.changePercent !== undefined) {
              // サーバーから変動率が提供されている場合はそれを使用
              this.currentChangePercent = data.changePercent;
            } else if (previousPrice > 0) {
              // 前回価格から変動率を計算
              this.currentChangePercent = ((this.currentPrice - previousPrice) / previousPrice) * 100;
            }
            
            // カウントダウンをリセット（サーバーの更新スケジュールに合わせる）
            this.syncWithServerUpdateSchedule(null, this.lastUpdatedAt);
          }
        });
      },
      // カウントダウンタイマーを開始
      startCountdownTimer() {
        // ラボドルはカウントダウン不要
        if (this.asset.id === 'labDollar') {
          return;
        }
        
        // 初期値が設定されていない場合は仮の値を計算
        if (!this.isCountdownSynced) {
          this.calculateInitialCountdown();
        }
        
        // 1秒ごとにカウントダウン
        this.countdownInterval = setInterval(() => {
          if (this.countdown > 0) {
            this.countdown--;
          } else {
            // カウントダウンが0になったら、次回の更新が確認されるまで少し待機
            setTimeout(() => {
              // 価格が更新されない場合は再度カウントダウンをリセット
              if (this.countdown <= 0) {
                // 次の分の更新時刻を計算
                const now = new Date();
                const futureMinute = new Date(now);
                futureMinute.setMinutes(futureMinute.getMinutes() + 1);
                futureMinute.setSeconds(0);
                futureMinute.setMilliseconds(0);
                const secondsUntilNextUpdate = Math.round((futureMinute.getTime() - now.getTime()) / 1000);
                
                this.countdown = Math.max(3, secondsUntilNextUpdate);
              }
            }, 3000);
          }
        }, 1000);
      },
      // バックアップ用の初期カウントダウン計算（サーバーデータが取得できない場合）
      calculateInitialCountdown() {
        const now = new Date();
        
        // 次の分の0秒に合わせる
        const nextMinute = new Date(now);
        nextMinute.setMinutes(nextMinute.getMinutes() + 1);
        nextMinute.setSeconds(0);
        nextMinute.setMilliseconds(0);
        
        // 次の更新までの秒数
        const secondsUntilNextMinute = Math.round((nextMinute.getTime() - now.getTime()) / 1000);
        
        this.countdown = Math.max(3, secondsUntilNextMinute);
        console.log(`${this.asset.name}: 初期カウントダウンを計算（サーバーデータなし）: ${this.countdown}秒`);
      }
    },
    beforeUnmount() {
      console.log(`${this.asset.name}: コンポーネントのクリーンアップ`);
      // カウントダウンタイマーをクリア
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      
      // リスナーを解除
      if (typeof this.unsubscriber === 'function') {
        this.unsubscriber();
      }
    }
  };
  </script>
  
  <style scoped>
  .asset-price-card {
    border-left-width: 4px;
    border-left-style: solid;
    transition: transform 0.3s;
  }
  
  .asset-price-card:hover {
    transform: translateY(-5px);
  }
  
  .asset-icon-container {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .asset-name {
    font-size: 1.25rem;
    font-weight: 500;
  }
  
  .asset-price {
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .asset-currency {
    font-size: 0.875rem;
    opacity: 0.7;
  }
  
  .asset-change {
    font-weight: bold;
    display: flex;
    align-items: center;
    font-size: 0.9rem;
  }
  
  .asset-data-label {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-bottom: 2px;
  }
  
  .asset-data-value {
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .volatility-chip {
    font-size: 0.75rem;
    height: 20px !important;
  }
  
  .countdown-timer {
    font-family: 'Roboto Mono', monospace;
    font-weight: 500;
  }
  </style>