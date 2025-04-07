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

        <!-- データがない場合のメッセージ -->
        <div v-if="!hasChartData" class="no-data-message">
          <p>価格データを読み込み中...</p>
        </div>

        <!-- 折れ線グラフ表示エリア -->
        <div class="line-chart-container" ref="chartContainer" :class="{ 'hidden': !hasChartData }">
          <canvas ref="lineChart"></canvas>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import Chart from 'chart.js/auto';
import { subscribeToPriceUpdates, subscribeToPriceHistory } from '@/firebase/realtime';

export default {
  name: 'MarketSummary',
  data() {
    return {
      selectedAsset: 'kuzellium',
      assetOptions: [
        { text: 'クーゼリアム (KZM)', value: 'kuzellium' },
        { text: 'ゴールド (AU)', value: 'gold' }
      ],
      priceData: {
        kuzellium: {
          current: { price: 0, changePercent: 0 },
          history: []
        },
        gold: {
          current: { price: 0, changePercent: 0 },
          history: []
        }
      },
      chart: null,
      // リスナーの解除関数を保存
      unsubscribers: {
        kuzelliumPrice: null,
        goldPrice: null,
        kuzelliumHistory: null,
        goldHistory: null
      },
      isLoading: true
    };
  },
  computed: {
    currentAssetData() {
      return this.priceData[this.selectedAsset];
    },
    currentPrice() {
      return this.currentAssetData.current.price || 0;
    },
    priceChange() {
      return this.currentAssetData.current.changePercent || 0;
    },
    chartData() {
      return this.currentAssetData.history.map(item => item.price);
    },
    chartLabels() {
      return this.currentAssetData.history.map(item => item.time);
    },
    hasChartData() {
      return this.currentAssetData.history && this.currentAssetData.history.length > 0;
    }
  },
  methods: {
    // リアルタイムリスナーをセットアップ
    setupListeners() {
      console.log('セットアップ: 価格リスナーを初期化中...');
      
      // クーゼリアムの現在価格リスナー
      this.unsubscribers.kuzelliumPrice = subscribeToPriceUpdates('kuzellium', (data) => {
        console.log('クーゼリアム価格更新:', data);
        this.priceData.kuzellium.current = data;
        if (this.selectedAsset === 'kuzellium') {
          this.updateChart();
        }
      });
      
      // 金の現在価格リスナー
      this.unsubscribers.goldPrice = subscribeToPriceUpdates('gold', (data) => {
        console.log('ゴールド価格更新:', data);
        this.priceData.gold.current = data;
        if (this.selectedAsset === 'gold') {
          this.updateChart();
        }
      });
      
      // クーゼリアムの価格履歴リスナー
      this.unsubscribers.kuzelliumHistory = subscribeToPriceHistory('kuzellium', (historyData) => {
        console.log('クーゼリアム履歴更新:', historyData.length, '件のデータ');
        this.priceData.kuzellium.history = historyData;
        this.isLoading = false;
        if (this.selectedAsset === 'kuzellium') {
          this.updateChart();
        }
      });
      
      // 金の価格履歴リスナー
      this.unsubscribers.goldHistory = subscribeToPriceHistory('gold', (historyData) => {
        console.log('ゴールド履歴更新:', historyData.length, '件のデータ');
        this.priceData.gold.history = historyData;
        this.isLoading = false;
        if (this.selectedAsset === 'gold') {
          this.updateChart();
        }
      });
    },
    
    // グラフをリセット
    resetChart() {
      if (this.chart) {
        this.chart.data.datasets[0].data = [];
        this.chart.data.labels = [];
        this.chart.update();
      }
    },
    
    // チャートの初期化
    initializeChart() {
      // チャート描画用のCanvas要素が存在しない場合は終了
      if (!this.$refs.lineChart) {
        console.warn('Chart canvas element not found');
        return;
      }

      const ctx = this.$refs.lineChart.getContext('2d');
      
      // 既存のチャートがあれば破棄
      if (this.chart) {
        this.chart.destroy();
      }
      
      // 新しいチャートを作成
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.chartLabels,
          datasets: [{
            label: this.selectedAsset === 'kuzellium' ? 'クーゼリアム' : 'ゴールド',
            data: this.chartData,
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
      if (!this.hasChartData) {
        console.log('チャート更新: データがないためスキップ');
        return;
      }

      if (!this.chart) {
        console.log('チャート更新: 初期化');
        this.initializeChart();
        return;
      }
      
      console.log('チャート更新: データ更新', {
        labels: this.chartLabels,
        data: this.chartData
      });
      
      // データセットの更新
      this.chart.data.labels = this.chartLabels;
      this.chart.data.datasets[0].data = this.chartData;
      this.chart.data.datasets[0].label = this.selectedAsset === 'kuzellium' ? 'クーゼリアム' : 'ゴールド';
      this.chart.data.datasets[0].borderColor = this.selectedAsset === 'kuzellium' ? '#1976D2' : '#FFC107';
      this.chart.data.datasets[0].backgroundColor = this.selectedAsset === 'kuzellium' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(255, 193, 7, 0.1)';
      
      this.chart.update();
    },

    // 数値をフォーマット
    formatNumber(value) {
      if (value === null || value === undefined) return '0';
      return new Intl.NumberFormat('ja-JP').format(Math.round(value));
    }
  },
  watch: {
    // 選択された資産が変更されたらチャートを更新
    selectedAsset() {
      console.log('資産選択変更:', this.selectedAsset);
      this.updateChart();
    },
    // 履歴データが変更されたらチャートを更新
    'currentAssetData.history': {
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.$nextTick(() => {
            this.updateChart();
          });
        }
      },
      deep: true
    }
  },
  mounted() {
    console.log('MarketSummary コンポーネントがマウントされました');
    // リアルタイムリスナーをセットアップ
    this.setupListeners();
    
    // チャートの初期化
    this.$nextTick(() => {
      if (this.hasChartData) {
        this.initializeChart();
      }
    });
  },
  beforeUnmount() {
    console.log('MarketSummary コンポーネントのクリーンアップ');
    // コンポーネント破棄時にリスナーを解除
    Object.values(this.unsubscribers).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    
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
  position: relative;
}

.line-chart-container {
  height: 220px;
  width: 100%;
}

.line-chart-container.hidden {
  display: none;
}

.no-data-message {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  text-align: center;
  transform: translateY(-50%);
  color: rgba(0, 0, 0, 0.6);
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