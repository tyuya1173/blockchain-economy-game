<template>
    <div class="price-controls-panel panel">
      <h3>価格管理</h3>
      
      <div class="price-items">
        <!-- クーゼリアム (KZM) 価格制御 -->
        <div class="price-item">
          <div class="price-header">
            <h4>クーゼリアム (KZM)</h4>
            <div class="current-price">
              現在: <span>{{ formatCurrency(marketPrices.kuzellium) }}</span>
            </div>
          </div>
          
          <div class="price-chart">
            <div class="price-trend">
              <i 
                class="trend-icon" 
                :class="kuzelliumTrend.icon" 
                :style="{ color: kuzelliumTrend.color }"
              ></i>
              <span 
                class="trend-value" 
                :style="{ color: kuzelliumTrend.color }"
              >
                {{ kuzelliumTrend.value }}
              </span>
            </div>
            
            <!-- 簡易チャート (実際はもっと詳細なチャートを表示) -->
            <div class="chart-placeholder">
              <div class="chart-line" :style="{ 
                backgroundImage: `linear-gradient(to right, ${kuzelliumTrend.gradientStart}, ${kuzelliumTrend.gradientEnd})` 
              }"></div>
            </div>
          </div>
          
          <div class="price-controls">
            <div class="manual-adjust">
              <label for="kzm-price">手動設定:</label>
              <div class="price-input-group">
                <input 
                  type="number" 
                  id="kzm-price" 
                  v-model.number="kzmPrice" 
                  min="1"
                  step="1"
                  class="price-input"
                />
                <span class="currency-unit">円</span>
              </div>
            </div>
            
            <div class="quick-adjust">
              <button 
                @click="quickAdjustPrice('kuzellium', -20)" 
                class="quick-adjust-button decrease"
              >
                -20%
              </button>
              <button 
                @click="quickAdjustPrice('kuzellium', -10)" 
                class="quick-adjust-button decrease"
              >
                -10%
              </button>
              <button 
                @click="quickAdjustPrice('kuzellium', 10)" 
                class="quick-adjust-button increase"
              >
                +10%
              </button>
              <button 
                @click="quickAdjustPrice('kuzellium', 20)" 
                class="quick-adjust-button increase"
              >
                +20%
              </button>
            </div>
            
            <button 
              @click="updatePrice('kuzellium', kzmPrice)" 
              class="apply-button"
              :disabled="!isKzmPriceChanged"
            >
              価格を適用
            </button>
          </div>
        </div>
        
        <!-- 金 (AU) 価格制御 -->
        <div class="price-item">
          <div class="price-header">
            <h4>金 (AU)</h4>
            <div class="current-price">
              現在: <span>{{ formatCurrency(marketPrices.gold) }}</span>
            </div>
          </div>
          
          <div class="price-chart">
            <div class="price-trend">
              <i 
                class="trend-icon" 
                :class="goldTrend.icon" 
                :style="{ color: goldTrend.color }"
              ></i>
              <span 
                class="trend-value" 
                :style="{ color: goldTrend.color }"
              >
                {{ goldTrend.value }}
              </span>
            </div>
            
            <!-- 簡易チャート -->
            <div class="chart-placeholder">
              <div class="chart-line" :style="{ 
                backgroundImage: `linear-gradient(to right, ${goldTrend.gradientStart}, ${goldTrend.gradientEnd})` 
              }"></div>
            </div>
          </div>
          
          <div class="price-controls">
            <div class="manual-adjust">
              <label for="au-price">手動設定:</label>
              <div class="price-input-group">
                <input 
                  type="number" 
                  id="au-price" 
                  v-model.number="goldPrice" 
                  min="1"
                  step="100"
                  class="price-input"
                />
                <span class="currency-unit">円</span>
              </div>
            </div>
            
            <div class="quick-adjust">
              <button 
                @click="quickAdjustPrice('gold', -20)" 
                class="quick-adjust-button decrease"
              >
                -20%
              </button>
              <button 
                @click="quickAdjustPrice('gold', -10)" 
                class="quick-adjust-button decrease"
              >
                -10%
              </button>
              <button 
                @click="quickAdjustPrice('gold', 10)" 
                class="quick-adjust-button increase"
              >
                +10%
              </button>
              <button 
                @click="quickAdjustPrice('gold', 20)" 
                class="quick-adjust-button increase"
              >
                +20%
              </button>
            </div>
            
            <button 
              @click="updatePrice('gold', goldPrice)" 
              class="apply-button"
              :disabled="!isGoldPriceChanged"
            >
              価格を適用
            </button>
          </div>
        </div>
      </div>
      
      <div class="price-schedule">
        <h4>自動価格更新スケジュール</h4>
        <p class="schedule-description">
          通常、市場価格は自動的に更新されます:
          <br>
          - クーゼリアム: 5分ごとに変動 (±15%)
          <br>
          - 金: 15分ごとに変動 (±5%)
        </p>
        
        <div class="schedule-controls">
          <button @click="toggleAutoUpdate" class="schedule-button">
            {{ isAutoUpdateEnabled ? '自動更新を一時停止' : '自動更新を再開' }}
          </button>
        </div>
      </div>
      
      <div v-if="confirmAction" class="confirmation-dialog">
        <div class="confirmation-content">
          <h4>{{ confirmTitle }}</h4>
          <p>{{ confirmMessage }}</p>
          <div class="confirmation-details" v-if="selectedAsset">
            <div class="detail-row">
              <span>資産タイプ:</span>
              <span>{{ selectedAsset === 'kuzellium' ? 'クーゼリアム (KZM)' : '金 (AU)' }}</span>
            </div>
            <div class="detail-row">
              <span>現在価格:</span>
              <span>{{ formatCurrency(marketPrices[selectedAsset]) }}</span>
            </div>
            <div class="detail-row highlight">
              <span>新価格:</span>
              <span>{{ formatCurrency(newPrice) }}</span>
            </div>
            <div class="detail-row">
              <span>変動率:</span>
              <span :class="priceChangeClass">{{ formatPercentage(priceChangePercentage) }}</span>
            </div>
          </div>
          <div class="confirmation-buttons">
            <button @click="executeConfirmedAction" class="confirm-button">はい</button>
            <button @click="cancelConfirmation" class="cancel-button">キャンセル</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'PriceControls',
    props: {
      marketPrices: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        kzmPrice: 0,
        goldPrice: 0,
        isAutoUpdateEnabled: true,
        confirmAction: null,
        confirmTitle: '',
        confirmMessage: '',
        selectedAsset: null,
        newPrice: 0
      };
    },
    created() {
      // 初期値を設定
      this.resetPriceInputs();
    },
    watch: {
      marketPrices: {
        handler() {
          // 市場価格が更新されたら入力値をリセット
          this.resetPriceInputs();
        },
        deep: true
      }
    },
    computed: {
      isKzmPriceChanged() {
        return this.kzmPrice !== this.marketPrices.kuzellium;
      },
      isGoldPriceChanged() {
        return this.goldPrice !== this.marketPrices.gold;
      },
      kuzelliumTrend() {
        // 仮のトレンドデータ (実際はバックエンドから取得)
        return {
          value: '+5.2%',
          icon: 'fas fa-arrow-up',
          color: '#2ecc71',
          gradientStart: 'rgba(46, 204, 113, 0.2)',
          gradientEnd: 'rgba(46, 204, 113, 0.8)'
        };
      },
      goldTrend() {
        // 仮のトレンドデータ
        return {
          value: '+1.8%',
          icon: 'fas fa-arrow-up',
          color: '#2ecc71',
          gradientStart: 'rgba(46, 204, 113, 0.2)',
          gradientEnd: 'rgba(46, 204, 113, 0.6)'
        };
      },
      priceChangePercentage() {
        if (!this.selectedAsset || !this.marketPrices[this.selectedAsset]) return 0;
        
        const currentPrice = this.marketPrices[this.selectedAsset];
        return ((this.newPrice - currentPrice) / currentPrice) * 100;
      },
      priceChangeClass() {
        if (this.priceChangePercentage > 0) return 'price-increase';
        if (this.priceChangePercentage < 0) return 'price-decrease';
        return '';
      }
    },
    methods: {
      resetPriceInputs() {
        this.kzmPrice = this.marketPrices.kuzellium;
        this.goldPrice = this.marketPrices.gold;
      },
      
      quickAdjustPrice(assetType, percentChange) {
        if (assetType === 'kuzellium') {
          const currentPrice = this.marketPrices.kuzellium;
          this.kzmPrice = Math.round(currentPrice * (1 + percentChange / 100));
        } else if (assetType === 'gold') {
          const currentPrice = this.marketPrices.gold;
          this.goldPrice = Math.round(currentPrice * (1 + percentChange / 100));
        }
      },
      
      updatePrice(assetType, newPrice) {
        if (newPrice <= 0) {
          alert('価格は0より大きい値を設定してください');
          return;
        }
        
        this.selectedAsset = assetType;
        this.newPrice = newPrice;
        
        const assetName = assetType === 'kuzellium' ? 'クーゼリアム (KZM)' : '金 (AU)';
        this.confirmTitle = '価格変更の確認';
        this.confirmMessage = `${assetName}の価格を変更しますか？この変更はゲーム経済に影響します。`;
        this.confirmAction = 'update-price';
      },
      
      toggleAutoUpdate() {
        this.isAutoUpdateEnabled = !this.isAutoUpdateEnabled;
        
        // 本来はバックエンドで自動更新の設定を変更する
        console.log(`自動価格更新: ${this.isAutoUpdateEnabled ? '有効' : '無効'}`);
      },
      
      executeConfirmedAction() {
        if (this.confirmAction === 'update-price' && this.selectedAsset) {
          this.$emit('update-price', this.selectedAsset, this.newPrice);
        }
        
        this.confirmAction = null;
        this.selectedAsset = null;
      },
      
      cancelConfirmation() {
        this.confirmAction = null;
        this.selectedAsset = null;
      },
      
      formatCurrency(value) {
        return value ? value.toLocaleString() + '円' : '0円';
      },
      
      formatPercentage(value) {
        const prefix = value > 0 ? '+' : '';
        return `${prefix}${value.toFixed(2)}%`;
      }
    }
  };
  </script>
  
  <style scoped>
  .price-controls-panel {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 20px;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 18px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }
  
  .price-items {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }
  
  .price-item {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
  }
  
  .price-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .price-header h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  
  .current-price {
    font-size: 14px;
  }
  
  .current-price span {
    font-weight: 600;
    color: #34495e;
  }
  
  .price-chart {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    height: 40px;
  }
  
  .price-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 80px;
  }
  
  .trend-icon {
    font-size: 14px;
  }
  
  .trend-value {
    font-weight: 600;
    font-size: 14px;
  }
  
  .chart-placeholder {
    flex: 1;
    height: 24px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }
  
  .chart-line {
    height: 100%;
    width: 100%;
    border-radius: 12px;
  }
  
  .price-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .manual-adjust {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .manual-adjust label {
    font-size: 14px;
    min-width: 80px;
  }
  
  .price-input-group {
    position: relative;
    flex: 1;
  }
  
  .price-input {
    width: 100%;
    padding: 8px 36px 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .currency-unit {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    color: #7f8c8d;
  }
  
  .quick-adjust {
    display: flex;
    gap: 8px;
  }
  
  .quick-adjust-button {
    flex: 1;
    padding: 6px 0;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    font-size: 12px;
  }
  
  .quick-adjust-button.decrease {
    background-color: #fdecea;
    color: #e74c3c;
  }
  
  .quick-adjust-button.increase {
    background-color: #eafaf1;
    color: #2ecc71;
  }
  
  .apply-button {
    padding: 10px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .apply-button:hover {
    background-color: #2980b9;
  }
  
  .apply-button:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
  
  .price-schedule {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
  }
  
  .price-schedule h4 {
    margin: 0 0 12px;
    font-size: 16px;
  }
  
  .schedule-description {
    margin: 0 0 16px;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .schedule-controls {
    display: flex;
    justify-content: flex-end;
  }
  
  .schedule-button {
    padding: 8px 16px;
    background-color: #95a5a6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .confirmation-dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .confirmation-content {
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    width: 90%;
    max-width: 400px;
  }
  
  .confirmation-content h4 {
    margin-top: 0;
    margin-bottom: 12px;
  }
  
  .confirmation-details {
    background-color: #f8f9fa;
    border-radius: 6px;
    margin: 16px 0;
    padding: 12px;
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 14px;
  }
  
  .detail-row.highlight {
    font-weight: 600;
    color: #3498db;
  }
  
  .price-increase {
    color: #2ecc71;
  }
  
  .price-decrease {
    color: #e74c3c;
  }
  
  .confirmation-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
  
  .confirm-button, .cancel-button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .confirm-button {
    background-color: #3498db;
    color: white;
  }
  
  .cancel-button {
    background-color: #ecf0f1;
    color: #34495e;
  }
  
  @media (min-width: 768px) {
    .price-items {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  </style>