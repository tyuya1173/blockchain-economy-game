<template>
    <div class="market-view">
      <v-container fluid>
        <v-row>
          <v-col cols="12">
            <h1 class="text-h4 font-weight-bold mb-4">市場情報</h1>
          </v-col>
        </v-row>
        
        <!-- 資産価格カード -->
        <v-row>
          <v-col cols="12" md="6" lg="4" v-for="asset in assets" :key="asset.id">
            <asset-price-card :asset="asset" />
          </v-col>
        </v-row>
        
        <!-- 価格チャート -->
        <v-row>
          <v-col cols="12" lg="8">
            <price-chart />
          </v-col>
          <v-col cols="12" lg="4">
            <market-trends />
          </v-col>
        </v-row>
        
        <!-- イベントとニュース -->
        <v-row>
          <v-col cols="12" md="6">
            <event-log />
          </v-col>
          <v-col cols="12" md="6">
            <market-news />
          </v-col>
        </v-row>
      </v-container>
    </div>
  </template>
  
  <script>
  import PriceChart from '@/components/market/PriceChart.vue';
  import AssetPriceCard from '@/components/market/AssetPriceCard.vue';
  import MarketTrends from '@/components/market/MarketTrends.vue';
  import EventLog from '@/components/market/EventLog.vue';
  import MarketNews from '@/components/market/MarketNews.vue';
  
  export default {
    name: 'MarketView',
    components: {
      PriceChart,
      AssetPriceCard,
      MarketTrends,
      EventLog,
      MarketNews
    },
    data() {
      return {
        assets: [
          {
            id: 'labDollar',
            name: 'ラボドル',
            symbol: 'LD',
            price: 100,
            changePercent: 0,
            icon: 'mdi-currency-usd',
            color: 'success'
          },
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
          }
        ]
      };
    }
  };
  </script>
  
  <style scoped>
  .market-view {
    padding-bottom: 24px;
  }
  </style>