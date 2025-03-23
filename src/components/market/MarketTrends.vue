<template>
    <v-card height="100%">
      <v-card-title class="d-flex justify-space-between align-center">
        <span>市場トレンド</span>
        <v-chip small :color="overallSentiment.color" dark>{{ overallSentiment.text }}</v-chip>
      </v-card-title>
      <v-card-text>
        <!-- 資産別パフォーマンス指標 - 新しく追加 -->
        <h3 class="subtitle-1 font-weight-bold mb-2">資産パフォーマンス</h3>
        <div class="asset-performance-grid mb-4">
          <v-card v-for="asset in assets" :key="asset.id" outlined class="asset-card pa-2" :class="`border-left-${asset.color}`">
            <div class="d-flex justify-space-between align-center">
              <div class="asset-name font-weight-medium">{{ asset.name }}</div>
              <v-chip 
                x-small 
                :color="asset.changePercent >= 0 ? 'success' : 'error'" 
                outlined
                class="font-weight-bold"
              >
                {{ asset.changePercent > 0 ? '+' : '' }}{{ asset.changePercent.toFixed(1) }}%
              </v-chip>
            </div>
            <div class="asset-price mt-1">{{ formatNumber(asset.price) }} 円</div>
            <div class="asset-stats d-flex justify-space-between mt-1">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <div v-bind="attrs" v-on="on" class="stat-item">
                    <v-icon small color="primary" left>mdi-swap-horizontal</v-icon>
                    <span class="caption">{{ getAssetTradeVolume(asset.id) }}</span>
                  </div>
                </template>
                <span>取引高</span>
              </v-tooltip>
              <div class="trend-direction" v-if="assetTrendDirections[asset.id]">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon 
                      small 
                      :color="getTrendColor(assetTrendDirections[asset.id])"
                      v-bind="attrs"
                      v-on="on"
                    >
                      {{ getTrendIcon(assetTrendDirections[asset.id]) }}
                    </v-icon>
                  </template>
                  <span>{{ getTrendDescription(assetTrendDirections[asset.id]) }}</span>
                </v-tooltip>
              </div>
            </div>
          </v-card>
        </div>
  
        <!-- 市場センチメント -->
        <div class="market-trend-indicator mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="trend-label">市場センチメント</span>
            <span class="trend-value" :class="overallSentiment.color + '--text'">{{ overallSentiment.text }}</span>
          </div>
          <v-progress-linear
            :value="overallSentiment.value"
            :color="overallSentiment.color"
            height="8"
            rounded
          ></v-progress-linear>
        </div>
  
        <!-- 資産別上昇/下落率 - 新しく追加 -->
        <h3 class="subtitle-1 font-weight-bold mb-2">資産別上昇/下落率</h3>
        <div class="asset-trend-grid mb-4">
          <div v-for="asset in assets" :key="`trend-${asset.id}`" class="asset-trend-card pa-2">
            <div class="d-flex justify-space-between">
              <div class="caption font-weight-medium">{{ asset.name }}</div>
              <div class="caption" :class="asset.changePercent >= 0 ? 'success--text' : 'error--text'">
                {{ asset.changePercent.toFixed(1) }}%
              </div>
            </div>
            <div class="d-flex align-center mt-2">
              <div class="trend-bar-container">
                <div 
                  class="trend-bar-up" 
                  :style="{width: `${getAssetUpPercent(asset.id)}%`}"
                ></div>
                <div 
                  class="trend-bar-down"
                  :style="{width: `${getAssetDownPercent(asset.id)}%`}"
                ></div>
              </div>
              <div class="trend-stats d-flex ml-2">
                <div class="caption success--text mr-2">{{ getAssetUpPercent(asset.id) }}%</div>
                <div class="caption error--text">{{ getAssetDownPercent(asset.id) }}%</div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 取引統計 - 修正 -->
        <div class="d-flex justify-space-between mb-2">
          <h3 class="subtitle-1 font-weight-bold">取引傾向</h3>
          <span class="caption">過去10分</span>
        </div>
        
        <!-- 資産別取引高 - 新しく追加 -->
        <div class="asset-volume-grid mb-4">
          <div v-for="asset in assets" :key="`volume-${asset.id}`" class="asset-volume-card pa-2">
            <div class="caption font-weight-medium mb-1">{{ asset.name }}</div>
            <div class="d-flex justify-space-between align-center">
              <div class="asset-volume-bar" :style="{width: `${getAssetVolumePercent(asset.id)}%`, backgroundColor: asset.color}"></div>
              <div class="caption ml-2">{{ getAssetTradeVolume(asset.id) }}</div>
            </div>
            <div class="d-flex justify-space-between mt-2">
              <div class="d-flex align-center">
                <v-icon x-small color="success" class="mr-1">mdi-arrow-up</v-icon>
                <span class="caption">{{ getAssetBuyCount(asset.id) }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon x-small color="error" class="mr-1">mdi-arrow-down</v-icon>
                <span class="caption">{{ getAssetSellCount(asset.id) }}</span>
              </div>
            </div>
          </div>
        </div>
  
        <v-divider class="my-4"></v-divider>
  
        <!-- 資産ランキング -->
        <h3 class="subtitle-1 font-weight-bold mb-2">資産ランキング</h3>
        <v-list dense>
          <v-list-item v-for="(asset, index) in sortedAssets" :key="asset.id">
            <v-list-item-avatar size="32">
              <v-icon :color="asset.color">{{ asset.icon }}</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <div class="d-flex align-center">
                <v-list-item-title>{{ asset.name }}</v-list-item-title>
                <v-tooltip bottom v-if="assetTrendDirections[asset.id]">
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon 
                      small 
                      class="ml-1"
                      :color="getTrendColor(assetTrendDirections[asset.id])"
                      v-bind="attrs"
                      v-on="on"
                    >
                      {{ getTrendIcon(assetTrendDirections[asset.id]) }}
                    </v-icon>
                  </template>
                  <span>{{ getTrendDescription(assetTrendDirections[asset.id]) }}</span>
                </v-tooltip>
              </div>
              <v-list-item-subtitle>{{ formatNumber(asset.price) }} 円</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <span 
                :class="asset.changePercent >= 0 ? 'success--text' : 'error--text'"
                class="font-weight-medium"
              >
                {{ asset.changePercent > 0 ? '+' : '' }}{{ asset.changePercent.toFixed(1) }}%
              </span>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  import { ref, onValue, query, orderByChild, limitToLast, get } from 'firebase/database';
  import { rtdb } from '@/firebase/index'; // Realtime Databaseをrtdbとしてインポート
  import { collection, query as firestoreQuery, orderBy, limit, onSnapshot } from 'firebase/firestore';
  import { db as firestore } from '@/firebase/index'; // Firestoreをdb as firestoreとしてインポート
  
  export default {
    name: 'MarketTrends',
    data() {
      return {
        // 資産リスト
        assets: [
          {
            id: 'kuzellium',
            name: 'クーゼリアム',
            symbol: 'KZM',
            price: 500,
            changePercent: 0,
            icon: 'mdi-currency-eth',
            color: 'primary',
            priceHistory: []
          },
          {
            id: 'gold',
            name: 'ゴールド',
            symbol: 'AU',
            price: 8000,
            changePercent: 0,
            icon: 'mdi-gold',
            color: 'warning',
            priceHistory: []
          },
          {
            id: 'labDollar',
            name: 'ラボドル',
            symbol: 'LD',
            price: 100,
            changePercent: 0,
            icon: 'mdi-currency-usd',
            color: 'success',
            priceHistory: []
          }
        ],
        // 価格統計
        priceStats: {
          upCount: 0,
          downCount: 0,
          flatCount: 0,
          upPercent: 0,
          downPercent: 0
        },
        // 資産ごとの価格統計 - 新しく追加
        assetPriceStats: {
          kuzellium: { upCount: 0, downCount: 0, upPercent: 50, downPercent: 50 },
          gold: { upCount: 0, downCount: 0, upPercent: 50, downPercent: 50 },
          labDollar: { upCount: 0, downCount: 0, upPercent: 50, downPercent: 50 }
        },
        // 取引統計
        tradeStats: {
          userToUser: 0,    // ユーザー間取引数
          userToMarket: 0,  // マーケット取引数
          totalVolume: 0,   // 総取引量（資産数量ベース）
          lastUpdate: null  // 最終更新時刻
        },
        // 資産ごとの取引統計 - 新しく追加
        assetTradeStats: {
          kuzellium: { volume: 0, buy: 0, sell: 0 },
          gold: { volume: 0, buy: 0, sell: 0 },
          labDollar: { volume: 0, buy: 0, sell: 0 }
        },
        // 各資産のトレンド方向
        assetTrendDirections: {
          kuzellium: null,
          gold: null,
          labDollar: null
        },
        // リスナーの解除関数を保存
        unsubscribers: []
      };
    },
    computed: {
      // 資産を変動率でソート（降順）
      sortedAssets() {
        return [...this.assets].sort((a, b) => b.changePercent - a.changePercent);
      },
      // 市場センチメントの計算
      overallSentiment() {
        // 基本センチメント値（変動率の加重平均+取引高の活発さで調整）
        let sentimentValue = 50; // デフォルト：中立
        
        // KZMと金の変動率を考慮（ラボドルは変動しないので除外）
        const kzmAsset = this.assets.find(a => a.id === 'kuzellium');
        const goldAsset = this.assets.find(a => a.id === 'gold');
        
        if (kzmAsset && goldAsset) {
          // KZMの重み：0.7、金の重み：0.3
          const weightedChange = (kzmAsset.changePercent * 0.7) + (goldAsset.changePercent * 0.3);
          
          // 変動率に基づいてセンチメント値を調整（-10%〜+10%の範囲を0〜100にマップ）
          sentimentValue += weightedChange * 5; // 5は調整係数
        }
        
        // 取引活発度による調整
        if (this.tradeStats.totalVolume > 5000) {
          sentimentValue += 10; // 取引が活発なら+10
        } else if (this.tradeStats.totalVolume < 1000) {
          sentimentValue -= 10; // 取引が不活発なら-10
        }
        
        // 上昇率と下落率による調整
        if (this.priceStats.upPercent > 70) {
          sentimentValue += 15; // 上昇傾向が強い
        } else if (this.priceStats.downPercent > 70) {
          sentimentValue -= 15; // 下落傾向が強い
        }
        
        // 0-100の範囲に制限
        sentimentValue = Math.max(0, Math.min(100, sentimentValue));
        
        // センチメントテキストと色を決定
        let text = '中立';
        let color = 'info';
        
        if (sentimentValue >= 80) {
          text = '非常に強気';
          color = 'success darken-1';
        } else if (sentimentValue >= 65) {
          text = '強気';
          color = 'success';
        } else if (sentimentValue >= 55) {
          text = 'やや強気';
          color = 'light-green';
        } else if (sentimentValue >= 45) {
          text = '中立';
          color = 'info';
        } else if (sentimentValue >= 35) {
          text = 'やや弱気';
          color = 'amber';
        } else if (sentimentValue >= 20) {
          text = '弱気';
          color = 'error';
        } else {
          text = '非常に弱気';
          color = 'error darken-3';
        }
        
        return {
          value: sentimentValue,
          text: text,
          color: color
        };
      },
      
      // ボラティリティ指標
      volatilityData() {
        // 最大価格変動率を取得（金とKZMのみ）
        const volatilityRates = this.assets
          .filter(a => a.id !== 'labDollar' && a.priceHistory.length > 0)
          .map(a => {
            if (a.priceHistory.length < 2) return 0;
            
            // 直近のN個のデータポイントを使用
            const recentHistory = a.priceHistory.slice(-5);
            
            // 最大と最小を計算
            const prices = recentHistory.map(item => item.price);
            const maxPrice = Math.max(...prices);
            const minPrice = Math.min(...prices);
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            
            // 最大変動率を計算
            return ((maxPrice - minPrice) / avgPrice) * 100;
          });
        
        // 平均ボラティリティ
        const avgVolatility = volatilityRates.length > 0 
          ? volatilityRates.reduce((sum, rate) => sum + rate, 0) / volatilityRates.length
          : 0;
        
        // 0-100のスケールに変換（最大30%変動を100%とする）
        const volatilityValue = Math.min(100, (avgVolatility / 30) * 100);
        
        // テキストと色を決定
        let text = '低';
        let color = 'success';
        
        if (volatilityValue >= 75) {
          text = '非常に高';
          color = 'error';
        } else if (volatilityValue >= 50) {
          text = '高';
          color = 'warning';
        } else if (volatilityValue >= 25) {
          text = '中';
          color = 'info';
        } else {
          text = '低';
          color = 'success';
        }
        
        return {
          value: volatilityValue,
          text: text,
          color: color
        };
      }
    },
    created() {
      this.setupListeners();
    },
    methods: {
      formatNumber(value) {
        return new Intl.NumberFormat('ja-JP').format(Math.round(value));
      },
      formatTradeVolume(volume) {
        if (volume >= 10000) {
          return (volume / 1000).toFixed(1) + 'K';
        }
        return volume.toString();
      },
      // Firebaseリスナーのセットアップ
      setupListeners() {
        this.setupPriceListeners();
        this.setupTransactionListeners();
        this.loadInitialPriceHistory();
      },
      // 価格リスナーのセットアップ
      setupPriceListeners() {
        // 変動する資産のみリスナーを設定
        const variableAssets = ['kuzellium', 'gold'];
        
        variableAssets.forEach(assetId => {
          const priceRef = ref(rtdb, `prices/${assetId}`);
          
          const unsubscribe = onValue(priceRef, snapshot => {
            const data = snapshot.val();
            if (!data) return;
            
            const assetIndex = this.assets.findIndex(a => a.id === assetId);
            if (assetIndex === -1) return;
            
            const oldPrice = this.assets[assetIndex].price;
            const newPrice = data.price;
            
            // 変動率を計算
            const changePercent = data.changePercent !== undefined 
              ? data.changePercent 
              : ((newPrice - oldPrice) / oldPrice) * 100;
            
            // 資産情報を更新
            this.assets[assetIndex].price = newPrice;
            this.assets[assetIndex].changePercent = changePercent;
            
            // 価格履歴に追加
            this.assets[assetIndex].priceHistory.push({
              price: newPrice,
              timestamp: data.updatedAt || Date.now(),
              changePercent: changePercent
            });
            
            // 履歴を最大30件に制限
            if (this.assets[assetIndex].priceHistory.length > 30) {
              this.assets[assetIndex].priceHistory.shift();
            }
            
            // 価格統計を更新
            this.updatePriceStats();
            this.updateAssetPriceStats(assetId);
            
            // トレンド方向を更新
            this.updateTrendDirections();
          });
          
          this.unsubscribers.push(unsubscribe);
        });
      },
      // 取引リスナーのセットアップ
      setupTransactionListeners() {
        try {
          // Firestoreから最新の取引を監視
          const txCollectionRef = collection(firestore, 'transactions');
          const recentTxQuery = firestoreQuery(
            txCollectionRef,
            orderBy('timestamp', 'desc'),
            limit(50)
          );
          
          const unsubscribe = onSnapshot(recentTxQuery, snapshot => {
            // 前回の更新から10分以内の取引のみを集計
            const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
            let userToUserCount = 0;
            let userToMarketCount = 0;
            let totalVolume = 0;
            
            // 資産ごとの取引統計をリセット
            this.assetTradeStats = {
              kuzellium: { volume: 0, buy: 0, sell: 0 },
              gold: { volume: 0, buy: 0, sell: 0 },
              labDollar: { volume: 0, buy: 0, sell: 0 }
            };
            
            snapshot.forEach(doc => {
              const tx = doc.data();
              
              // 10分以内の取引のみカウント
              if (tx.timestamp && tx.timestamp.toMillis() < tenMinutesAgo) {
                return;
              }
              
              // ユーザー間取引かマーケット取引かを判定
              if (tx.toUser === 'MARKET' || tx.fromUser === 'MARKET') {
                userToMarketCount++;
              } else {
                userToUserCount++;
              }
              
              // 取引量を加算
              if (tx.amount && tx.assetType) {
                totalVolume += tx.amount;
                
                // 資産別の取引統計を更新
                if (this.assetTradeStats[tx.assetType]) {
                  this.assetTradeStats[tx.assetType].volume += tx.amount;
                  
                  // 買い/売り判定
                  if (tx.fromUser === 'MARKET') {
                    // マーケットからの購入=買い
                    this.assetTradeStats[tx.assetType].buy++;
                  } else if (tx.toUser === 'MARKET') {
                    // マーケットへの売却=売り
                    this.assetTradeStats[tx.assetType].sell++;
                  } else {
                    // ユーザー間取引は両方カウント
                    this.assetTradeStats[tx.assetType].buy++;
                    this.assetTradeStats[tx.assetType].sell++;
                  }
                }
              }
            });
            
            // 取引統計を更新
            this.tradeStats.userToUser = userToUserCount;
            this.tradeStats.userToMarket = userToMarketCount;
            this.tradeStats.totalVolume = totalVolume;
            this.tradeStats.lastUpdate = Date.now();
          });
          
          this.unsubscribers.push(unsubscribe);
        } catch (error) {
          console.error('取引リスナーのセットアップエラー:', error);
        }
      },
      // 価格履歴の初期ロード
      async loadInitialPriceHistory() {
        try {
          const variableAssets = ['kuzellium', 'gold'];
          
          for (const assetId of variableAssets) {
            const historyRef = ref(rtdb, `priceHistory/${assetId}`);
            const historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(10));
            
            const snapshot = await get(historyQuery);
            if (!snapshot.exists()) continue;
            
            const historyData = [];
            snapshot.forEach(childSnapshot => {
              const data = childSnapshot.val();
              historyData.push({
                price: data.price,
                timestamp: data.timestamp,
                changePercent: 0 // 履歴データには変動率が含まれていないかもしれない
              });
            });
            
            // 時間順にソート
            historyData.sort((a, b) => a.timestamp - b.timestamp);
            
            // 変動率を計算
            for (let i = 1; i < historyData.length; i++) {
              const prevPrice = historyData[i-1].price;
              const currPrice = historyData[i].price;
              historyData[i].changePercent = ((currPrice - prevPrice) / prevPrice) * 100;
            }
            
            // 資産の履歴を更新
            const assetIndex = this.assets.findIndex(a => a.id === assetId);
            if (assetIndex !== -1) {
              this.assets[assetIndex].priceHistory = historyData;
            }
            
            // 資産ごとの価格統計を更新
            this.updateAssetPriceStats(assetId);
          }
          
          // 統計とトレンドを更新
          this.updatePriceStats();
          this.updateTrendDirections();
        } catch (error) {
          console.error('価格履歴ロードエラー:', error);
        }
      },
      // 価格統計の更新
      updatePriceStats() {
        let upCount = 0;
        let downCount = 0;
        let flatCount = 0;
        
        // 変動する資産（金とKZM）の最近の履歴から統計を計算
        this.assets
          .filter(asset => asset.id !== 'labDollar')
          .forEach(asset => {
            // 履歴がない場合はスキップ
            if (asset.priceHistory.length < 2) return;
            
            // 最近の5つの価格変動を確認
            const recentHistory = asset.priceHistory.slice(-5);
            
            recentHistory.forEach((item, index) => {
              if (index === 0) return; // 最初のアイテムはスキップ
              
              const prevItem = recentHistory[index - 1];
              const change = item.price - prevItem.price;
              
              // 小さな変動は無視（0.1%未満）
              if (Math.abs(change) / prevItem.price < 0.001) {
                flatCount++;
              } else if (change > 0) {
                upCount++;
              } else {
                downCount++;
              }
            });
          });
        
        const total = upCount + downCount + flatCount;
        
        this.priceStats.upCount = upCount;
        this.priceStats.downCount = downCount;
        this.priceStats.flatCount = flatCount;
        
        // パーセンテージ計算（flat除外）
        const activeTotal = upCount + downCount;
        if (activeTotal > 0) {
          this.priceStats.upPercent = Math.round((upCount / activeTotal) * 100);
          this.priceStats.downPercent = Math.round((downCount / activeTotal) * 100);
        } else {
          this.priceStats.upPercent = 50;
          this.priceStats.downPercent = 50;
        }
      },
      // 資産ごとの価格統計を更新 - 新しく追加
      updateAssetPriceStats(assetId) {
        const asset = this.assets.find(a => a.id === assetId);
        if (!asset || asset.priceHistory.length < 2) return;
        
        let upCount = 0;
        let downCount = 0;
        
        // 最近の5つの価格変動を確認
        const recentHistory = asset.priceHistory.slice(-5);
        
        recentHistory.forEach((item, index) => {
          if (index === 0) return; // 最初のアイテムはスキップ
          
          const prevItem = recentHistory[index - 1];
          const change = item.price - prevItem.price;
          
          // 変動方向をカウント（小さな変動も含む）
          if (change > 0) {
            upCount++;
          } else if (change < 0) {
            downCount++;
          }
        });
        
        // パーセンテージ計算
        const total = upCount + downCount;
        if (total > 0) {
          this.assetPriceStats[assetId] = {
            upCount,
            downCount,
            upPercent: Math.round((upCount / total) * 100),
            downPercent: Math.round((downCount / total) * 100)
          };
        } else {
          this.assetPriceStats[assetId] = {
            upCount: 0,
            downCount: 0,
            upPercent: 50,
            downPercent: 50
          };
        }
        
        // ラボドルは常に安定
        if (assetId === 'labDollar') {
          this.assetPriceStats[assetId] = {
            upCount: 0,
            downCount: 0,
            upPercent: 50,
            downPercent: 50
          };
        }
      },
      // 各資産のトレンド方向を更新
      updateTrendDirections() {
        this.assets.forEach(asset => {
          // ラボドルは固定なのでスキップ
          if (asset.id === 'labDollar') {
            this.assetTrendDirections[asset.id] = 'stable';
            return;
          }
          
          // 履歴が少ない場合は判定不可
          if (asset.priceHistory.length < 3) {
            this.assetTrendDirections[asset.id] = null;
            return;
          }
          
          // 直近3つの価格ポイントを取得
          const recent = asset.priceHistory.slice(-3);
          const prices = recent.map(item => item.price);
          
          // 単純なトレンド判定（上昇、下降、安定）
          if (prices[2] > prices[0] * 1.01) {
            // 1%以上の上昇
            this.assetTrendDirections[asset.id] = 'rising';
          } else if (prices[2] < prices[0] * 0.99) {
            // 1%以上の下降
            this.assetTrendDirections[asset.id] = 'falling';
          } else {
            // ほぼ変動なし
            this.assetTrendDirections[asset.id] = 'stable';
          }
          
          // さらに詳細なパターンを判定
          if (prices[0] < prices[1] && prices[1] > prices[2]) {
            // 逆V字パターン（高値圏での調整）
            this.assetTrendDirections[asset.id] = 'peaking';
          } else if (prices[0] > prices[1] && prices[1] < prices[2]) {
            // V字パターン（底入れ反発）
            this.assetTrendDirections[asset.id] = 'bottoming';
          }
          
          // 加速度チェック
          if (this.assetTrendDirections[asset.id] === 'rising') {
            const diff1 = prices[1] - prices[0];
            const diff2 = prices[2] - prices[1];
            
            if (diff2 > diff1 * 1.5) {
              // 上昇が加速
              this.assetTrendDirections[asset.id] = 'accelerating';
            }
          } else if (this.assetTrendDirections[asset.id] === 'falling') {
            const diff1 = prices[0] - prices[1];
            const diff2 = prices[1] - prices[2];
            
            if (diff2 > diff1 * 1.5) {
              // 下落が加速
              this.assetTrendDirections[asset.id] = 'crashing';
            }
          }
        });
      },
      // トレンド方向に基づくアイコンを取得
      getTrendIcon(trendDirection) {
        switch (trendDirection) {
          case 'rising': return 'mdi-trending-up';
          case 'falling': return 'mdi-trending-down';
          case 'stable': return 'mdi-trending-neutral';
          case 'peaking': return 'mdi-chevron-up-circle';
          case 'bottoming': return 'mdi-chevron-down-circle';
          case 'accelerating': return 'mdi-rocket-launch';
          case 'crashing': return 'mdi-alert';
          default: return '';
        }
      },
      // トレンド方向に基づく色を取得
      getTrendColor(trendDirection) {
        switch (trendDirection) {
          case 'rising': return 'success';
          case 'falling': return 'error';
          case 'stable': return 'info';
          case 'peaking': return 'amber';
          case 'bottoming': return 'light-green';
          case 'accelerating': return 'green darken-2';
          case 'crashing': return 'red darken-2';
          default: return 'grey';
        }
      },
      // トレンド説明を取得
      getTrendDescription(trendDirection) {
        switch (trendDirection) {
          case 'rising': return '上昇傾向';
          case 'falling': return '下降傾向';
          case 'stable': return '安定傾向';
          case 'peaking': return '高値圏での調整';
          case 'bottoming': return '底値圏からの反発';
          case 'accelerating': return '急速に上昇中';
          case 'crashing': return '急速に下落中';
          default: return '';
        }
      },
      // 資産の上昇率を取得 - 新しく追加
      getAssetUpPercent(assetId) {
        return this.assetPriceStats[assetId]?.upPercent || 0;
      },
      // 資産の下落率を取得 - 新しく追加
      getAssetDownPercent(assetId) {
        return this.assetPriceStats[assetId]?.downPercent || 0;
      },
      // 資産の取引高を取得 - 新しく追加
      getAssetTradeVolume(assetId) {
        const volume = this.assetTradeStats[assetId]?.volume || 0;
        return this.formatTradeVolume(volume);
      },
      // 資産の取引高のパーセンテージを取得 - 新しく追加
      getAssetVolumePercent(assetId) {
        const volume = this.assetTradeStats[assetId]?.volume || 0;
        const totalVolume = this.tradeStats.totalVolume;
        if (totalVolume === 0) return 0;
        return Math.min(100, Math.round((volume / totalVolume) * 100));
      },
      // 資産の買い注文数を取得 - 新しく追加
      getAssetBuyCount(assetId) {
        return this.assetTradeStats[assetId]?.buy || 0;
      },
      // 資産の売り注文数を取得 - 新しく追加
      getAssetSellCount(assetId) {
        return this.assetTradeStats[assetId]?.sell || 0;
      }
    },
    beforeUnmount() {
      // リスナーを全て解除
      this.unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    }
  };
  </script>
  
  <style scoped>
  .market-trend-indicator {
    margin-top: 8px;
  }
  
  .trend-label {
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .trend-value {
    font-weight: bold;
  }
  
  /* 資産パフォーマンスカード - 新しく追加 */
  .asset-performance-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .asset-card {
    position: relative;
    border-radius: 4px;
  }
  
  .border-left-primary {
    border-left: 3px solid var(--v-primary-base) !important;
  }
  
  .border-left-warning {
    border-left: 3px solid var(--v-warning-base) !important;
  }
  
  .border-left-success {
    border-left: 3px solid var(--v-success-base) !important;
  }
  
  .asset-name {
    font-size: 0.85rem;
  }
  
  .asset-price {
    font-size: 1rem;
    font-weight: bold;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
  }
  
  /* 資産別上昇/下落率 - 新しく追加 */
  .asset-trend-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .asset-trend-card {
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 4px;
  }
  
  .trend-bar-container {
    display: flex;
    width: 100%;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    background-color: #f5f5f5;
  }
  
  .trend-bar-up {
    height: 100%;
    background-color: var(--v-success-base);
  }
  
  .trend-bar-down {
    height: 100%;
    background-color: var(--v-error-base);
  }
  
  /* 資産別取引高 - 新しく追加 */
  .asset-volume-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .asset-volume-card {
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 4px;
  }
  
  .asset-volume-bar {
    height: 8px;
    border-radius: 4px;
    background-color: var(--v-primary-base);
  }
  </style>