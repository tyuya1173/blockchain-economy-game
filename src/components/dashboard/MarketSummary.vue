<template>
    <v-card flat tile>
      <v-card-title class="d-flex align-center justify-space-between pb-0">
        <span class="headline font-weight-bold">資産価格推移</span>
        <v-select
          v-model="selectedAsset"
          :items="assetOptions"
          dense
          solo
          flat
          hide-details
          class="asset-selector"
        ></v-select>
      </v-card-title>
  
      <v-card-text>
        <div class="price-chart-container">
          <div class="price-chart d-flex align-end justify-space-between">
            <div 
              v-for="(price, index) in priceHistory" 
              :key="index" 
              class="chart-bar"
              :style="{ 
                height: calculateBarHeight(price) + '%', 
                backgroundColor: getChartColor() 
              }"
            >
              <div class="chart-bar-tooltip">
                <div class="chart-bar-value">{{ price }}円</div>
                <div class="chart-bar-label">{{ getPriceDate(index) }}</div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  export default {
    name: 'MarketSummary',
    props: {
      marketPrices: {
        type: Object,
        required: true,
        validator: (value) => {
          return ['kuzellium', 'gold'].every(key => key in value);
        }
      }
    },
    data() {
      return {
        selectedAsset: 'kuzellium',
        assetOptions: [
          { text: 'クーゼリアム (KZM)', value: 'kuzellium' },
          { text: 'ゴールド (AU)', value: 'gold' }
        ],
        priceHistory: []
      };
    },
    methods: {
      // 価格履歴を取得
      async fetchPriceHistory() {
        try {
          // 実際の実装では、Firestoreから価格履歴を取得する
          // ここではデモのためのモックデータを使用
          if (this.selectedAsset === 'kuzellium') {
            this.priceHistory = [85, 92, 97, 105, 102, 98, 100];
          } else {
            this.priceHistory = [9800, 9850, 9900, 9950, 10000, 10050, 10100];
          }
        } catch (error) {
          console.error('価格履歴の取得に失敗しました:', error);
        }
      },
      
      // チャートバーの高さを計算
      calculateBarHeight(price) {
        if (this.priceHistory.length === 0) return 0;
        
        const maxPrice = Math.max(...this.priceHistory);
        const minPrice = Math.min(...this.priceHistory);
        const range = maxPrice - minPrice;
        
        if (range === 0) return 50; // 変動がない場合は50%の高さ
        
        // 最小10%～最大90%の範囲に収める
        return 10 + ((price - minPrice) / range) * 80;
      },
      
      // チャートの色を取得
      getChartColor() {
        return this.selectedAsset === 'kuzellium' 
          ? 'var(--v-primary-base)' 
          : 'var(--v-secondary-base)';
      },
      
      // 価格日付を取得
      getPriceDate(index) {
        const today = new Date();
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - index));
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
    },
    watch: {
      // 選択された資産が変更されたら価格履歴を更新
      selectedAsset() {
        this.fetchPriceHistory();
      }
    },
    mounted() {
      // コンポーネント読み込み時に初期価格履歴を取得
      this.fetchPriceHistory();
    }
  };
  </script>
  
  <style scoped>
  .asset-selector {
    max-width: 200px;
  }
  
  .price-chart-container {
    height: 200px;
    width: 100%;
  }
  
  .price-chart {
    height: 100%;
    display: flex;
    align-items: flex-end;
  }
  
  .chart-bar {
    flex: 1;
    margin: 0 4px;
    position: relative;
    border-radius: 4px 4px 0 0;
    transition: height 0.3s ease;
  }
  
  .chart-bar-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    white-space: nowrap;
  }
  
  .chart-bar-value {
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.7);
    margin-bottom: 4px;
  }
  
  .chart-bar-label {
    font-size: 0.625rem;
    color: rgba(0, 0, 0, 0.6);
  }
  </style>