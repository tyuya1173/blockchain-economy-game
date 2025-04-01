<template>
    <div class="event-manager-panel panel">
      <h3>イベント管理</h3>
      
      <div class="tabs">
        <button 
          @click="activeTab = 'active'" 
          class="tab-button" 
          :class="{ active: activeTab === 'active' }"
        >
          アクティブなイベント ({{ activeEvents.length }})
        </button>
        <button 
          @click="activeTab = 'available'" 
          class="tab-button" 
          :class="{ active: activeTab === 'available' }"
        >
          利用可能なイベント ({{ availableEvents.length }})
        </button>
      </div>
      
      <div class="tab-content">
        <!-- アクティブなイベント一覧 -->
        <div v-if="activeTab === 'active'" class="active-events">
          <p v-if="activeEvents.length === 0" class="empty-message">
            現在アクティブなイベントはありません
          </p>
          <div v-else class="event-list">
            <div v-for="event in activeEvents" :key="event.id" class="event-item">
              <div class="event-header">
                <h4>{{ event.name }}</h4>
                <span class="event-type" :class="event.type">{{ event.type }}</span>
              </div>
              <p class="event-description">{{ event.description }}</p>
              <div class="event-details">
                <div class="event-effect">
                  <strong>効果:</strong> {{ formatEffect(event.effect) }}
                </div>
                <div class="event-timing">
                  <div class="timing-item">
                    <span class="timing-label">開始:</span>
                    <span class="timing-value">{{ formatDateTime(event.createdAt) }}</span>
                  </div>
                  <div class="timing-item">
                    <span class="timing-label">終了:</span>
                    <span class="timing-value">{{ formatDateTime(event.expiresAt) }}</span>
                  </div>
                </div>
              </div>
              <div class="event-actions">
                <button 
                  @click="confirmCancelEvent(event)" 
                  class="event-action-button cancel"
                >
                  イベントをキャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 利用可能なイベント一覧 -->
        <div v-if="activeTab === 'available'" class="available-events">
          <div v-if="availableEvents.length === 0" class="empty-message">
            利用可能なイベントがありません
          </div>
          <div v-else class="event-list">
            <div 
              v-for="event in availableEvents" 
              :key="event.id" 
              class="event-item"
              :class="{ 'recommended': recommendedEvents.includes(event.id) && gameStatus === 'active' }"
            >
              <div v-if="recommendedEvents.includes(event.id) && gameStatus === 'active'" class="recommended-badge">
                <i class="fas fa-star"></i> フェーズ{{ currentPhase }}に最適
              </div>
              <div class="event-header">
                <h4>{{ event.name }}</h4>
                <span class="event-type" :class="event.type">{{ event.type }}</span>
              </div>
              <p class="event-description">{{ event.description }}</p>
              <div class="event-details">
                <div class="event-effect">
                  <strong>効果:</strong> {{ formatEffect(event.effect) }}
                </div>
                <div class="event-preview">
                  <div class="effect-preview" :class="getEffectPreviewClass(event.effect)">
                    <i :class="getEffectPreviewIcon(event.effect)"></i>
                    <span>{{ getEffectPreviewText(event.effect) }}</span>
                  </div>
                </div>
                <div class="event-duration">
                  <strong>推奨持続時間:</strong> 
                  <span v-if="currentPhase === 1">5-10分</span>
                  <span v-else-if="currentPhase === 2">10-15分</span>
                  <span v-else-if="currentPhase === 3">10-15分</span>
                  <span v-else-if="currentPhase === 4">5-10分</span>
                  <span v-else-if="currentPhase === 5">5分以下</span>
                  <span v-else>{{ event.duration || '30' }}分</span>
                </div>
              </div>
              <div class="event-actions">
                <button 
                  @click="confirmTriggerEvent(event)" 
                  class="event-action-button trigger"
                >
                  イベントを発生させる
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 確認ダイアログ -->
      <div v-if="confirmAction" class="confirmation-dialog">
        <div class="confirmation-content">
          <h4>{{ confirmTitle }}</h4>
          <p>{{ confirmMessage }}</p>
          <div v-if="confirmAction === 'trigger'" class="duration-selector">
            <label for="event-duration">イベント持続時間 (分):</label>
            <div class="duration-options">
              <button 
                v-for="duration in [5, 10, 15, 20, 30]" 
                :key="duration"
                @click="eventDuration = duration"
                class="duration-option"
                :class="{ active: eventDuration === duration }"
              >
                {{ duration }}分
              </button>
            </div>
            <input 
              id="event-duration" 
              v-model.number="eventDuration" 
              type="number" 
              min="1" 
              max="60" 
              step="1"
            />
            <div class="duration-recommendation" v-if="currentPhase > 0">
              <i class="fas fa-info-circle"></i>
              <span>フェーズ{{ currentPhase }}では
                <strong>
                  {{ currentPhase === 1 ? '5-10分' : 
                     currentPhase === 2 ? '10-15分' : 
                     currentPhase === 3 ? '10-15分' : 
                     currentPhase === 4 ? '5-10分' : '5分以下' }}
                </strong>
                のイベント持続時間を推奨します
              </span>
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
    name: 'EventManager',
    props: {
      activeEvents: {
        type: Array,
        required: true
      },
      availableEvents: {
        type: Array,
        required: true
      },
      currentPhase: {
        type: Number,
        default: 0
      },
      gameStatus: {
        type: String,
        default: 'waiting'
      }
    },
    data() {
      return {
        activeTab: 'active',
        confirmAction: null,
        confirmTitle: '',
        confirmMessage: '',
        selectedEvent: null,
        eventDuration: 30
      };
    },
    methods: {
      formatEffect(effect) {
        if (!effect) return '効果なし';
        
        let effectText = '';
        
        if (effect.type === 'price') {
          const direction = effect.value > 0 ? '上昇' : '下落';
          const percentage = Math.abs(effect.value);
          effectText = `${effect.asset}価格が${percentage}%${direction}`;
        } else if (effect.type === 'mining') {
          const multiplier = effect.value;
          effectText = `マイニング報酬が${multiplier}倍`;
        } else if (effect.type === 'restriction') {
          effectText = `${effect.asset}の取引${effect.description}`;
        } else {
          effectText = `${effect.type}: ${effect.description || effect.value}`;
        }
        
        return effectText;
      },
      
      // イベント効果プレビューのためのクラスを返す
      getEffectPreviewClass(effect) {
        if (!effect) return '';
        
        if (effect.type === 'price') {
          return effect.value > 0 ? 'positive' : 'negative';
        } else if (effect.type === 'mining') {
          return effect.value > 1 ? 'positive' : 'negative';
        } else if (effect.type === 'restriction') {
          return 'warning';
        } else {
          return 'neutral';
        }
      },
      
      // イベント効果プレビュー用のアイコンを返す
      getEffectPreviewIcon(effect) {
        if (!effect) return 'fas fa-question';
        
        if (effect.type === 'price') {
          return effect.value > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
        } else if (effect.type === 'mining') {
          return effect.value > 1 ? 'fas fa-hammer' : 'fas fa-ban';
        } else if (effect.type === 'restriction') {
          return 'fas fa-exclamation-triangle';
        } else if (effect.type === 'market') {
          return 'fas fa-chart-line';
        } else {
          return 'fas fa-info-circle';
        }
      },
      
      // イベント効果プレビュー用のテキストを返す
      getEffectPreviewText(effect) {
        if (!effect) return '効果不明';
        
        if (effect.type === 'price') {
          const assetName = this.getAssetName(effect.asset);
          return effect.value > 0 
            ? `${assetName}の価値が上昇します` 
            : `${assetName}の価値が下落します`;
        } else if (effect.type === 'mining') {
          return effect.value > 1 
            ? `マイニング効率が向上します` 
            : `マイニング効率が低下します`;
        } else if (effect.type === 'restriction') {
          const assetName = this.getAssetName(effect.asset);
          return `${assetName}の取引に制限がかかります`;
        } else {
          return '市場全体に影響します';
        }
      },
      
      // 資産タイプから日本語名を取得
      getAssetName(assetType) {
        const assetNames = {
          'labDollar': 'ラボドル',
          'kuzellium': 'クーゼリアム',
          'gold': '金'
        };
        return assetNames[assetType] || assetType;
      },
      
      formatDateTime(timestamp) {
        if (!timestamp) return '不明';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        
        return date.toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
      
      confirmTriggerEvent(event) {
        this.selectedEvent = event;
        this.confirmTitle = 'イベント発生の確認';
        this.confirmMessage = `「${event.name}」イベントを発生させますか？`;
        this.confirmAction = 'trigger';
        this.eventDuration = event.duration || 30;
      },
      
      confirmCancelEvent(event) {
        this.selectedEvent = event;
        this.confirmTitle = 'イベントキャンセルの確認';
        this.confirmMessage = `「${event.name}」イベントをキャンセルしますか？この操作は元に戻せません。`;
        this.confirmAction = 'cancel';
      },
      
      executeConfirmedAction() {
        if (!this.selectedEvent) return;
        
        if (this.confirmAction === 'trigger') {
          this.$emit('trigger-event', this.selectedEvent.id, this.eventDuration);
        } else if (this.confirmAction === 'cancel') {
          this.$emit('cancel-event', this.selectedEvent.id);
        }
        
        this.resetConfirmation();
      },
      
      cancelConfirmation() {
        this.resetConfirmation();
      },
      
      resetConfirmation() {
        this.confirmAction = null;
        this.selectedEvent = null;
      }
    }
  };
  </script>
  
  <style scoped>
  .event-manager-panel {
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
  
  .tabs {
    display: flex;
    border-bottom: 1px solid #eee;
    margin-bottom: 16px;
  }
  
  .tab-button {
    padding: 10px 16px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .tab-button.active {
    border-bottom-color: #3498db;
    color: #3498db;
  }
  
  .empty-message {
    color: #7f8c8d;
    text-align: center;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 4px;
  }
  
  .event-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .event-item {
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 16px;
    background-color: #f8f9fa;
  }
  
  .event-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  
  .event-header h4 {
    margin: 0;
    font-size: 16px;
  }
  
  .event-type {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 12px;
  }
  
  .event-type.price {
    background-color: #e74c3c;
    color: white;
  }
  
  .event-type.mining {
    background-color: #2ecc71;
    color: white;
  }
  
  .event-type.restriction {
    background-color: #f39c12;
    color: white;
  }
  
  .event-type.market {
    background-color: #3498db;
    color: white;
  }
  
  .event-description {
    margin-bottom: 12px;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .event-details {
    font-size: 14px;
    margin-bottom: 16px;
  }
  
  .event-effect, .event-duration {
    margin-bottom: 8px;
  }
  
  .event-timing {
    display: flex;
    gap: 16px;
  }
  
  .timing-item {
    display: flex;
    flex-direction: column;
    font-size: 12px;
  }
  
  .timing-label {
    color: #7f8c8d;
  }
  
  .event-actions {
    display: flex;
    justify-content: flex-end;
  }
  
  .event-action-button {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }
  
  .event-action-button.trigger {
    background-color: #3498db;
    color: white;
  }
  
  .event-action-button.cancel {
    background-color: #e74c3c;
    color: white;
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
  
  .duration-selector {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .duration-selector input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 100%;
    margin-top: 8px;
  }
  
  .duration-options {
    display: flex;
    gap: 8px;
    margin: 8px 0;
    flex-wrap: wrap;
  }
  
  .duration-option {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f8f9fa;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .duration-option.active {
    background-color: #3498db;
    color: white;
    border-color: #3498db;
  }
  
  .duration-recommendation {
    margin-top: 8px;
    padding: 8px;
    background-color: #f8f9fa;
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  
  .duration-recommendation i {
    color: #3498db;
    margin-top: 2px;
  }
  
  .recommended-badge {
    position: absolute;
    top: -10px;
    right: -10px;
    background-color: #f39c12;
    color: white;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 12px;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .event-item.recommended {
    border: 2px solid #f39c12;
    position: relative;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .event-preview {
    margin-top: 8px;
  }
  
  .effect-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .effect-preview i {
    font-size: 16px;
  }
  
  .effect-preview.positive {
    background-color: #eafaf1;
    color: #27ae60;
  }
  
  .effect-preview.negative {
    background-color: #fdedec;
    color: #e74c3c;
  }
  
  .effect-preview.warning {
    background-color: #fef9e7;
    color: #f39c12;
  }
  
  .effect-preview.neutral {
    background-color: #eaeff2;
    color: #3498db;
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
  </style>