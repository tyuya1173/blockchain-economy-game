<template>
    <v-card class="asset-price-card" :class="`border-left-${asset.color}`">
      <v-card-text>
        <div class="d-flex align-center justify-space-between">
          <div class="asset-icon-container" :class="`bg-${asset.color} lighten-4`">
            <v-icon :color="asset.color">{{ asset.icon }}</v-icon>
          </div>
          <div class="asset-change" :class="asset.changePercent >= 0 ? 'text-success' : 'text-error'">
            <v-icon small :color="asset.changePercent >= 0 ? 'success' : 'error'">
              {{ asset.changePercent >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
            {{ asset.changePercent > 0 ? '+' : '' }}{{ asset.changePercent.toFixed(2) }}%
          </div>
        </div>
        
        <div class="asset-name mt-2">{{ asset.name }}</div>
        <div class="d-flex align-center mt-1">
          <span class="asset-price">{{ formatNumber(asset.price) }}</span>
          <span class="asset-currency ml-1">円 / {{ asset.symbol }}</span>
        </div>
        
        <v-divider class="my-3"></v-divider>
        
        <div class="d-flex align-center justify-space-between">
          <div class="asset-data">
            <div class="asset-data-label">24時間取引量</div>
            <div class="asset-data-value">{{ formatNumber(asset.volume || 15000) }} {{ asset.symbol }}</div>
          </div>
          <div class="asset-data text-right">
            <div class="asset-data-label">時価総額</div>
            <div class="asset-data-value">{{ formatNumber(asset.marketCap || asset.price * 5000) }} 円</div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  export default {
    name: 'AssetPriceCard',
    props: {
      asset: {
        type: Object,
        required: true
      }
    },
    methods: {
      formatNumber(value) {
        return new Intl.NumberFormat('ja-JP').format(Math.round(value));
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
  </style>