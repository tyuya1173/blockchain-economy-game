<template>
    <div class="asset-summary">
      <v-card flat tile class="asset-summary-card">
        <v-card-title class="pb-0">
          <span class="headline font-weight-bold">資産状況</span>
        </v-card-title>
        
        <v-card-text>
          <div class="total-assets-container">
            <div class="total-assets-value">
              <span class="text-h5 font-weight-bold">{{ formatNumber(totalAssetsValue) }}</span>
              <span class="text-subtitle-2 ml-1">円</span>
            </div>
            <div 
              class="total-assets-change" 
              :class="{
                'text-success': totalAssetsChange > 0, 
                'text-error': totalAssetsChange < 0
              }"
            >
              {{ totalAssetsChange > 0 ? '+' : '' }}{{ totalAssetsChange.toFixed(2) }}%
            </div>
          </div>
  
          <v-row no-gutters class="asset-grid">
            <v-col cols="4" class="asset-column">
              <div class="asset-item">
                <div class="asset-label">ラボドル</div>
                <div class="asset-value">{{ formatNumber(userAssets.labDollar) }} LD</div>
                <div class="asset-conversion">≈ {{ formatNumber(userAssets.labDollar * 100) }}円</div>
              </div>
            </v-col>
            <v-col cols="4" class="asset-column">
              <div class="asset-item">
                <div class="asset-label">クーゼリアム</div>
                <div class="asset-value">{{ formatNumber(userAssets.kuzellium) }} KZM</div>
                <div class="asset-conversion">≈ {{ formatNumber(userAssets.kuzellium * marketPrices.kuzellium) }}円</div>
              </div>
            </v-col>
            <v-col cols="4" class="asset-column">
              <div class="asset-item">
                <div class="asset-label">ゴールド</div>
                <div class="asset-value">{{ formatNumber(userAssets.gold) }} AU</div>
                <div class="asset-conversion">≈ {{ formatNumber(userAssets.gold * marketPrices.gold) }}円</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AssetSummary',
    props: {
      userAssets: {
        type: Object,
        required: true,
        validator: (value) => {
          return ['labDollar', 'kuzellium', 'gold'].every(key => key in value);
        }
      },
      marketPrices: {
        type: Object,
        required: true,
        validator: (value) => {
          return ['kuzellium', 'gold'].every(key => key in value);
        }
      }
    },
    computed: {
      totalAssetsValue() {
        // ラボドル、クーゼリアム、金の円換算総額を計算
        const labDollarValue = this.userAssets.labDollar * 100;
        const kuzelliumValue = this.userAssets.kuzellium * this.marketPrices.kuzellium;
        const goldValue = this.userAssets.gold * this.marketPrices.gold;
        
        return labDollarValue + kuzelliumValue + goldValue;
      },
      totalAssetsChange() {
        // TODO: 前回の総資産価値との比較を実装 
        // 現在は仮の値を返しています
        return 0.00;
      }
    },
    methods: {
      formatNumber(value) {
        // 数値をカンマ区切りでフォーマット
        return new Intl.NumberFormat('ja-JP').format(Math.round(value));
      }
    }
  };
  </script>
  
  <style scoped>
  .asset-summary-card {
    /* スマートフォンでの境界線と影を追加 */
    border: 1px solid rgba(0,0,0,0.1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .total-assets-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 8px;
  }
  
  .total-assets-change {
    font-weight: bold;
  }
  
  .asset-grid {
    /* グリッドの境界線を追加 */
    border-top: 1px solid rgba(0,0,0,0.1);
  }

  .asset-column {
    /* 各カラムに境界線を追加 */
    border-right: 1px solid rgba(0,0,0,0.1);
    padding: 8px 0;
  }

  .asset-column:last-child {
    /* 最後のカラムは右境界線を削除 */
    border-right: none;
  }
  
  .asset-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .asset-label {
    color: rgba(0, 0, 0, 0.6);
    font-size: 0.75rem;
    margin-bottom: 4px;
  }
  
  .asset-value {
    font-size: 1rem;
    font-weight: bold;
    margin-bottom: 2px;
  }
  
  .asset-conversion {
    color: rgba(0, 0, 0, 0.6);
    font-size: 0.75rem;
  }

  /* スマートフォン向けの微調整 */
  @media (max-width: 600px) {
    .total-assets-container {
      flex-direction: column;
      align-items: flex-start;
    }

    .total-assets-change {
      margin-top: 8px;
    }
  }
  </style>