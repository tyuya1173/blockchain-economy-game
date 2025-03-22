<template>
    <v-card height="100%">
      <v-card-title>市場トレンド</v-card-title>
      <v-card-text>
        <div class="market-trend-indicator mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="trend-label">市場センチメント</span>
            <span class="trend-value" :class="marketSentiment.color">{{ marketSentiment.text }}</span>
          </div>
          <v-progress-linear
            :value="marketSentiment.value"
            :color="marketSentiment.color"
            height="8"
            rounded
          ></v-progress-linear>
        </div>
  
        <div class="trend-stats mb-4">
          <div class="trend-stat-item">
            <div class="trend-stat-title">上昇率</div>
            <div class="trend-stat-value">
              <v-icon small color="success" left>mdi-arrow-up</v-icon>
              64%
            </div>
          </div>
          <div class="trend-stat-item">
            <div class="trend-stat-title">下落率</div>
            <div class="trend-stat-value">
              <v-icon small color="error" left>mdi-arrow-down</v-icon>
              36%
            </div>
          </div>
          <div class="trend-stat-item">
            <div class="trend-stat-title">取引高</div>
            <div class="trend-stat-value">
              <v-icon small color="primary" left>mdi-chart-line</v-icon>
              25.3K
            </div>
          </div>
        </div>
  
        <v-divider class="mb-4"></v-divider>
  
        <h3 class="subtitle-1 font-weight-bold mb-2">資産ランキング</h3>
        <v-list dense>
          <v-list-item v-for="(asset, index) in topAssets" :key="asset.id">
            <v-list-item-avatar size="32">
              <v-icon :color="asset.color">{{ asset.icon }}</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>{{ asset.name }} ({{ asset.symbol }})</v-list-item-title>
              <v-list-item-subtitle>{{ formatNumber(asset.price) }} 円</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <span 
                :class="asset.changePercent >= 0 ? 'text-success' : 'text-error'"
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
  export default {
    name: 'MarketTrends',
    data() {
      return {
        marketSentiment: {
          value: 72,
          text: '強気',
          color: 'success'
        },
        topAssets: [
          {
            id: 'kuzellium',
            name: 'クーゼリアム',
            symbol: 'KZM',
            price: 580,
            changePercent: 3.2,
            icon: 'mdi-currency-eth',
            color: 'primary'
          },
          {
            id: 'gold',
            name: 'ゴールド',
            symbol: 'AU',
            price: 8200,
            changePercent: 1.5,
            icon: 'mdi-gold',
            color: 'warning'
          },
          {
            id: 'labDollar',
            name: 'ラボドル',
            symbol: 'LD',
            price: 100,
            changePercent: 0,
            icon: 'mdi-currency-usd',
            color: 'success'
          }
        ]
      };
    },
    methods: {
      formatNumber(value) {
        return new Intl.NumberFormat('ja-JP').format(Math.round(value));
      }
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
  
  .trend-stats {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
  }
  
  .trend-stat-item {
    flex: 1;
    text-align: center;
    padding: 8px;
  }
  
  .trend-stat-title {
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.6);
    margin-bottom: 4px;
  }
  
  .trend-stat-value {
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  </style>