<template>
  <div class="price-controls-panel panel">
    <h3>価格管理</h3>
    
    <div class="price-items">
      <!-- クーゼリアム (KZM) 価格制御 -->
      <div class="price-item">
        <div class="price-header">
          <h4>クーゼリアム (KZM)</h4>
          <div class="current-price">
            現在: <span>{{ formatCurrency(getCurrentPrice('kuzellium')) }}</span>
          </div>
        </div>
        
        <div class="price-chart">
          <div class="price-trend">
            <i 
              class="trend-icon" 
              :class="getPriceTrend('kuzellium').icon" 
              :style="{ color: getPriceTrend('kuzellium').color }"
            ></i>
            <span 
              class="trend-value" 
              :style="{ color: getPriceTrend('kuzellium').color }"
            >
              {{ getPriceTrend('kuzellium').value }}
            </span>
          </div>
          
          <!-- 簡易チャート (リアルデータに基づく) -->
          <div class="chart-placeholder">
            <div class="chart-line" :style="{ 
              backgroundImage: `linear-gradient(to right, ${getPriceTrend('kuzellium').gradientStart}, ${getPriceTrend('kuzellium').gradientEnd})` 
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
                @keydown.enter="updatePrice('kuzellium', kzmPrice)"
                @focus="$event.target.select()"
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
          
          <!-- マーケットイベントボタンを追加 -->
          <div class="market-events">
            <button 
              @click="triggerMarketEvent('kuzellium', 'crash')" 
              class="event-button crash"
              title="市場パニック: 30%下落"
            >
              <i class="fas fa-arrow-down"></i> 市場パニック
            </button>
            <button 
              @click="triggerMarketEvent('kuzellium', 'boom')" 
              class="event-button boom"
              title="投機バブル: 50%上昇"
            >
              <i class="fas fa-arrow-up"></i> 投機バブル
            </button>
          </div>
        </div>
      </div>
      
      <!-- 金 (AU) 価格制御 -->
      <div class="price-item">
        <div class="price-header">
          <h4>金 (AU)</h4>
          <div class="current-price">
            現在: <span>{{ formatCurrency(getCurrentPrice('gold')) }}</span>
          </div>
        </div>
        
        <div class="price-chart">
          <div class="price-trend">
            <i 
              class="trend-icon" 
              :class="getPriceTrend('gold').icon" 
              :style="{ color: getPriceTrend('gold').color }"
            ></i>
            <span 
              class="trend-value" 
              :style="{ color: getPriceTrend('gold').color }"
            >
              {{ getPriceTrend('gold').value }}
            </span>
          </div>
          
          <!-- 簡易チャート (リアルデータに基づく) -->
          <div class="chart-placeholder">
            <div class="chart-line" :style="{ 
              backgroundImage: `linear-gradient(to right, ${getPriceTrend('gold').gradientStart}, ${getPriceTrend('gold').gradientEnd})` 
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
                @keydown.enter="updatePrice('gold', goldPrice)"
                @focus="$event.target.select()"
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
          
          <!-- マーケットイベントボタンを追加 -->
          <div class="market-events">
            <button 
              @click="triggerMarketEvent('gold', 'crash')" 
              class="event-button crash"
              title="市場パニック: 30%下落"
            >
              <i class="fas fa-arrow-down"></i> 市場パニック
            </button>
            <button 
              @click="triggerMarketEvent('gold', 'boom')" 
              class="event-button boom"
              title="投機バブル: 50%上昇"
            >
              <i class="fas fa-arrow-up"></i> 投機バブル
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="price-schedule">
      <h4>自動価格更新スケジュール</h4>
      <p class="schedule-description">
        通常、市場価格は自動的に更新されます:
        <br>
        - クーゼリアム: 1分ごとに変動 (±80%)
        <br>
        - 金: 1分ごとに変動 (±10%、基本上昇傾向)
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
            <span>{{ formatCurrency(getCurrentPrice(selectedAsset)) }}</span>
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
import { subscribeToPriceUpdates, subscribeToPriceHistory } from '@/firebase/realtime';

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
      newPrice: 0,
      eventData: null,
      // 価格履歴データを追加
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
      // リスナーの解除関数を保存
      unsubscribers: {
        kuzelliumHistory: null,
        goldHistory: null,
        kuzelliumPrice: null,
        goldPrice: null
      }
    };
  },
  created() {
    // 初期値を設定
    this.resetPriceInputs();
    // リアルタイムデータ取得を設定
    this.setupListeners();
  },
  mounted() {
    console.log('PriceControls コンポーネントがマウントされました');
  },
  beforeUnmount() {
    console.log('PriceControls コンポーネントのクリーンアップ');
    // コンポーネント破棄時にリスナーを解除
    Object.values(this.unsubscribers).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
  },
  watch: {
    'priceData.kuzellium.current': {
      handler(newVal) {
        // クーゼリアムの価格が更新されたら、入力値も更新
        if (newVal && newVal.price) {
          this.kzmPrice = newVal.price;
          // 親コンポーネントに通知
          this.$emit('price-updated', 'kuzellium', newVal.price);
        }
      },
      deep: true
    },
    'priceData.gold.current': {
      handler(newVal) {
        // 金の価格が更新されたら、入力値も更新
        if (newVal && newVal.price) {
          this.goldPrice = newVal.price;
          // 親コンポーネントに通知
          this.$emit('price-updated', 'gold', newVal.price);
        }
      },
      deep: true
    }
  },
  computed: {
    isKzmPriceChanged() {
      return this.kzmPrice !== this.getCurrentPrice('kuzellium');
    },
    isGoldPriceChanged() {
      return this.goldPrice !== this.getCurrentPrice('gold');
    },
    priceChangePercentage() {
      if (!this.selectedAsset) return 0;
      
      const currentPrice = this.getCurrentPrice(this.selectedAsset);
      return ((this.newPrice - currentPrice) / currentPrice) * 100;
    },
    priceChangeClass() {
      if (this.priceChangePercentage > 0) return 'price-increase';
      if (this.priceChangePercentage < 0) return 'price-decrease';
      return '';
    }
  },
  methods: {
    // 現在の価格を取得（リアルタイムデータベースから）
    getCurrentPrice(assetType) {
      // リアルタイムデータが存在する場合はそちらを優先
      if (this.priceData[assetType] && this.priceData[assetType].current && this.priceData[assetType].current.price) {
        return this.priceData[assetType].current.price;
      }
      // フォールバックとして親から渡されたプロパティを使用
      return this.marketPrices[assetType] || 0;
    },
    
    // リアルタイムリスナーをセットアップ
    setupListeners() {
      console.log('セットアップ: 価格リスナーを初期化中...');
      
      // クーゼリアムの現在価格リスナー
      this.unsubscribers.kuzelliumPrice = subscribeToPriceUpdates('kuzellium', (data) => {
        console.log('クーゼリアム価格更新:', data);
        this.priceData.kuzellium.current = data;
      });
      
      // 金の現在価格リスナー
      this.unsubscribers.goldPrice = subscribeToPriceUpdates('gold', (data) => {
        console.log('ゴールド価格更新:', data);
        this.priceData.gold.current = data;
      });
      
      // クーゼリアムの価格履歴リスナー
      this.unsubscribers.kuzelliumHistory = subscribeToPriceHistory('kuzellium', (historyData) => {
        console.log('クーゼリアム履歴更新:', historyData.length, '件のデータ');
        this.priceData.kuzellium.history = historyData;
      });
      
      // 金の価格履歴リスナー
      this.unsubscribers.goldHistory = subscribeToPriceHistory('gold', (historyData) => {
        console.log('ゴールド履歴更新:', historyData.length, '件のデータ');
        this.priceData.gold.history = historyData;
      });
    },
    
    // 価格トレンドを取得（実際のデータに基づく）
    getPriceTrend(assetType) {
      const history = this.priceData[assetType].history;
      
      // 履歴データが不足している場合はデフォルト値を返す
      if (!history || history.length < 2) {
        return {
          value: '0.0%',
          icon: 'fas fa-minus',
          color: '#95a5a6',
          gradientStart: 'rgba(149, 165, 166, 0.2)',
          gradientEnd: 'rgba(149, 165, 166, 0.8)'
        };
      }
      
      // 最新の2つのデータポイントを取得
      const latestData = history[history.length - 1];
      const previousData = history[history.length - 2];
      
      if (!latestData || !previousData) {
        return {
          value: '0.0%',
          icon: 'fas fa-minus',
          color: '#95a5a6',
          gradientStart: 'rgba(149, 165, 166, 0.2)',
          gradientEnd: 'rgba(149, 165, 166, 0.8)'
        };
      }
      
      // 変動率を計算
      const changePercent = ((latestData.price - previousData.price) / previousData.price) * 100;
      
      // トレンド情報の構築
      if (changePercent > 0) {
        return {
          value: `+${changePercent.toFixed(1)}%`,
          icon: 'fas fa-arrow-up',
          color: '#2ecc71',
          gradientStart: 'rgba(46, 204, 113, 0.2)',
          gradientEnd: 'rgba(46, 204, 113, 0.8)'
        };
      } else if (changePercent < 0) {
        return {
          value: `${changePercent.toFixed(1)}%`,
          icon: 'fas fa-arrow-down',
          color: '#e74c3c',
          gradientStart: 'rgba(231, 76, 60, 0.2)',
          gradientEnd: 'rgba(231, 76, 60, 0.8)'
        };
      } else {
        return {
          value: '0.0%',
          icon: 'fas fa-minus',
          color: '#95a5a6',
          gradientStart: 'rgba(149, 165, 166, 0.2)',
          gradientEnd: 'rgba(149, 165, 166, 0.8)'
        };
      }
    },
    
    resetPriceInputs() {
      // リアルタイムデータがある場合はそれを使用、なければプロパティから
      this.kzmPrice = this.getCurrentPrice('kuzellium');
      this.goldPrice = this.getCurrentPrice('gold');
    },
    
    quickAdjustPrice(assetType, percentChange) {
      if (assetType === 'kuzellium') {
        const currentPrice = this.getCurrentPrice('kuzellium');
        this.kzmPrice = Math.round(currentPrice * (1 + percentChange / 100));
      } else if (assetType === 'gold') {
        const currentPrice = this.getCurrentPrice('gold');
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
      
      if (this.isAutoUpdateEnabled) {
        // 自動更新を再開する場合は特別なアクションは不要
        // バックエンドでは自動的に1分ごとに更新されるため
        console.log('自動価格更新: 有効');
      } else {
        // 自動更新を停止する場合、市場イベントとして通知
        this.confirmTitle = '自動更新の停止';
        this.confirmMessage = '自動価格更新を停止しますか？代わりに手動で価格を制御できます。';
        this.confirmAction = 'toggle-auto-update';
      }
    },
    
    // 価格の急激な変動のためのメソッドを追加（マーケットイベントのショートカット）
    triggerMarketEvent(assetType, effectType) {
      // マーケットイベントの設定
      this.selectedAsset = assetType;
      
      let eventType, effectPercent;
      
      if (effectType === 'crash') {
        eventType = '市場パニック';
        effectPercent = -30; // 30%下落
        this.confirmTitle = '市場パニックイベント';
        this.confirmMessage = `${assetType === 'kuzellium' ? 'クーゼリアム' : '金'}の価格が急落するイベントを発生させますか？`;
      } else if (effectType === 'boom') {
        eventType = '投機バブル';
        effectPercent = 50; // 50%上昇
        this.confirmTitle = '投機バブルイベント';
        this.confirmMessage = `${assetType === 'kuzellium' ? 'クーゼリアム' : '金'}の価格が急騰するイベントを発生させますか？`;
      }
      
      this.confirmAction = 'trigger-market-event';
      this.eventData = { eventType, assetType, effectPercent };
    },
    
    executeConfirmedAction() {
      if (this.confirmAction === 'update-price' && this.selectedAsset) {
        this.$emit('update-price', this.selectedAsset, this.newPrice);
      } else if (this.confirmAction === 'toggle-auto-update') {
        console.log('自動価格更新: 無効');
      } else if (this.confirmAction === 'trigger-market-event' && this.eventData) {
        this.$emit('trigger-market-event', this.eventData.eventType, this.eventData.assetType, this.eventData.effectPercent);
      }
      
      this.confirmAction = null;
      this.selectedAsset = null;
      this.eventData = null;
    },
    
    cancelConfirmation() {
      this.confirmAction = null;
      this.selectedAsset = null;
      this.eventData = null;
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

/* マーケットイベントボタン */
.market-events {
  display: flex;
  gap: 8px;
}

.event-button {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.event-button.crash {
  background-color: #fff2f0;
  color: #e74c3c;
  border: 1px solid #f8d7da;
}

.event-button.crash:hover {
  background-color: #f8d7da;
}

.event-button.boom {
  background-color: #f0fff4;
  color: #2ecc71;
  border: 1px solid #d7f8e0;
}

.event-button.boom:hover {
  background-color: #d7f8e0;
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