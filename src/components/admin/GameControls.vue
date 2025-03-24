<template>
    <div class="game-controls-panel panel">
      <h3>ゲーム制御</h3>
      
      <div class="status-section">
        <div class="status-item">
          <span class="label">ステータス:</span>
          <span class="value" :class="statusClass">{{ gameStatusText }}</span>
        </div>
        <div class="status-item">
          <span class="label">現在のフェーズ:</span>
          <span class="value">{{ currentPhase }} / 5</span>
        </div>
        <div v-if="gameStatus === 'active'" class="status-item timer">
          <span class="label">残り時間:</span>
          <span class="value time-value">{{ formatTime(timeRemaining) }}</span>
        </div>
      </div>
      
      <div v-if="gameStatus === 'active'" class="game-timer-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${(timeRemaining / (phaseDurations[currentPhase] * 60)) * 100}%` }"></div>
        </div>
        <div class="phase-timer">フェーズ {{ currentPhase }} 残り時間: {{ formatTime(timeRemaining) }}</div>
      </div>
      
      <div class="controls">
        <button 
          @click="handleStartGame" 
          class="control-button" 
          :class="{ primary: gameStatus === 'waiting', disabled: gameStatus === 'active' || gameStatus === 'finished' }"
          :disabled="gameStatus === 'active' || gameStatus === 'finished'"
        >
          ゲーム開始
        </button>
        
        <button 
          @click="handleAdvancePhase" 
          class="control-button" 
          :class="{ primary: gameStatus === 'active', disabled: gameStatus !== 'active' || currentPhase === 5 }"
          :disabled="gameStatus !== 'active' || currentPhase === 5"
        >
          次フェーズへ進む ({{ currentPhase }} → {{ currentPhase + 1 }})
        </button>
        
        <button 
          @click="handleEndGame" 
          class="control-button danger" 
          :class="{ disabled: gameStatus !== 'active' }"
          :disabled="gameStatus !== 'active'"
        >
          ゲーム終了
        </button>
      </div>
      
      <div class="phase-info">
        <h4>フェーズ情報</h4>
        <div class="phase-timeline">
          <div 
            v-for="phase in 5" 
            :key="phase"
            class="phase-item"
            :class="{ 
              'completed': phase < currentPhase, 
              'active': phase === currentPhase,
              'pending': phase > currentPhase
            }"
          >
            <span class="phase-number">{{ phase }}</span>
            <span class="phase-duration">{{ phaseDurations[phase] }}分</span>
          </div>
        </div>
        <div class="phase-description">
          <strong>フェーズ {{ currentPhase }}:</strong> 
          <span>{{ phaseDescription }}</span>
        </div>
        
        <div v-if="gameStatus === 'active'" class="phase-actions">
          <h5>推奨アクション:</h5>
          <ul class="action-list">
            <li v-if="currentPhase === 1">
              <i class="fas fa-info-circle"></i> プレイヤーにUIの操作方法を説明
            </li>
            <li v-if="currentPhase === 1">
              <i class="fas fa-hammer"></i> 簡単なマイニングチャレンジを提供
            </li>
            <li v-if="currentPhase === 2">
              <i class="fas fa-bolt"></i> 「技術革新」イベントの発生を検討
            </li>
            <li v-if="currentPhase === 2">
              <i class="fas fa-exchange-alt"></i> ユーザー間取引を促進
            </li>
            <li v-if="currentPhase === 3">
              <i class="fas fa-chart-line"></i> 「投機バブル」イベントの発生を検討
            </li>
            <li v-if="currentPhase === 3">
              <i class="fas fa-hammer"></i> 難易度の高いマイニングチャレンジを提供
            </li>
            <li v-if="currentPhase === 4">
              <i class="fas fa-exclamation-triangle"></i> 「市場パニック」イベントの発生を検討
            </li>
            <li v-if="currentPhase === 4">
              <i class="fas fa-ban"></i> 一部取引制限イベントの発生を検討
            </li>
            <li v-if="currentPhase === 5">
              <i class="fas fa-clock"></i> 残り時間のカウントダウン通知
            </li>
            <li v-if="currentPhase === 5">
              <i class="fas fa-balance-scale"></i> 最終相場の安定化措置を検討
            </li>
          </ul>
        </div>
      </div>
      
      <div v-if="confirmAction" class="confirmation-dialog">
        <div class="confirmation-content">
          <h4>{{ confirmTitle }}</h4>
          <p>{{ confirmMessage }}</p>
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
    name: 'GameControls',
    props: {
      gameStatus: {
        type: String,
        required: true,
        validator: value => ['waiting', 'active', 'finished'].includes(value)
      },
      currentPhase: {
        type: Number,
        required: true,
        validator: value => value >= 1 && value <= 5
      }
    },
    data() {
      return {
        confirmAction: null,
        confirmTitle: '',
        confirmMessage: '',
        phaseDescriptions: [
          '準備フェーズ',
          '導入と基本理解 (10分): 初期資産確認、基本操作の説明、簡単なマイニングチャレンジ',
          '初期市場形成 (15分): ユーザー間での初期取引、基本的な投資戦略の考案',
          '市場変動と戦略適応 (15分): 活発な取引、資産の多様化、市場予測',
          '市場混乱期 (10分): リスク管理、投資戦略の再考、急激な変動への対応',
          '最終調整と資産確定 (10分): 最終取引の実行、資産構成の最適化'
        ],
        phaseDurations: [0, 10, 15, 15, 10, 10], // 各フェーズの所要時間（分）
        timeRemaining: 0,
        timer: null,
        phaseStartTime: null,
        totalGameTime: 60 // 合計ゲーム時間（分）
      };
    },
    computed: {
      gameStatusText() {
        const statusMap = {
          'waiting': '待機中',
          'active': '進行中',
          'finished': '終了'
        };
        return statusMap[this.gameStatus] || '不明';
      },
      statusClass() {
        const classMap = {
          'waiting': 'status-waiting',
          'active': 'status-active',
          'finished': 'status-finished'
        };
        return classMap[this.gameStatus] || '';
      },
      phaseDescription() {
        return this.phaseDescriptions[this.currentPhase] || '説明なし';
      }
    },
    created() {
      // ゲームがアクティブな場合、タイマーを開始
      if (this.gameStatus === 'active') {
        this.startTimer();
      }
    },
    
    beforeDestroy() {
      // コンポーネント破棄時にタイマーをクリア
      this.clearTimer();
    },
    
    watch: {
      // ゲームステータスが変わったらタイマーを更新
      gameStatus(newStatus) {
        if (newStatus === 'active') {
          this.startTimer();
        } else {
          this.clearTimer();
        }
      },
      
      // フェーズが変わったらタイマーをリセット
      currentPhase() {
        if (this.gameStatus === 'active') {
          this.phaseStartTime = new Date();
          this.updateTimeRemaining();
        }
      }
    },
  
    methods: {
      handleStartGame() {
        if (this.gameStatus !== 'waiting') return;
        
        this.confirmTitle = 'ゲーム開始の確認';
        this.confirmMessage = 'ゲームを開始しますか？参加者は確定され、開始後は待機状態に戻れません。ゲームは約1時間続きます。';
        this.confirmAction = 'start-game';
      },
      
      handleAdvancePhase() {
        if (this.gameStatus !== 'active' || this.currentPhase >= 5) return;
        
        this.confirmTitle = 'フェーズ進行の確認';
        this.confirmMessage = `フェーズ ${this.currentPhase} から フェーズ ${this.currentPhase + 1} に進みますか？この操作は元に戻せません。`;
        this.confirmAction = 'advance-phase';
      },
      
      handleEndGame() {
        if (this.gameStatus !== 'active') return;
        
        this.confirmTitle = 'ゲーム終了の確認';
        this.confirmMessage = 'ゲームを終了しますか？この操作は元に戻せず、最終結果が確定します。';
        this.confirmAction = 'end-game';
      },
      
      executeConfirmedAction() {
        switch(this.confirmAction) {
          case 'start-game':
            this.$emit('start-game');
            this.phaseStartTime = new Date();
            break;
          case 'advance-phase':
            this.$emit('advance-phase');
            this.phaseStartTime = new Date();
            break;
          case 'end-game':
            this.$emit('end-game');
            this.clearTimer();
            break;
        }
        this.confirmAction = null;
      },
      
      cancelConfirmation() {
        this.confirmAction = null;
      },
      
      // タイマー関連メソッド
      startTimer() {
        this.phaseStartTime = new Date();
        this.clearTimer(); // 既存のタイマーをクリア
        this.timer = setInterval(() => {
          this.updateTimeRemaining();
        }, 1000);
        this.updateTimeRemaining(); // 初回更新
      },
      
      clearTimer() {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      },
      
      updateTimeRemaining() {
        if (!this.phaseStartTime || this.gameStatus !== 'active') return;
        
        const now = new Date();
        const elapsedSeconds = Math.floor((now - this.phaseStartTime) / 1000);
        const phaseTimeSeconds = this.phaseDurations[this.currentPhase] * 60;
        
        // 現在のフェーズの残り時間を計算
        this.timeRemaining = Math.max(0, phaseTimeSeconds - elapsedSeconds);
        
        // フェーズ終了が近づいたら通知
        if (this.timeRemaining <= 60 && this.timeRemaining > 0 && this.timeRemaining % 10 === 0) {
          this.notifyTimeRemaining();
        }
      },
      
      notifyTimeRemaining() {
        // フェーズ終了が近いことを通知
        console.log(`フェーズ${this.currentPhase}終了まであと${Math.floor(this.timeRemaining / 60)}分${this.timeRemaining % 60}秒`);
        // 実際の実装では、通知コンポーネントを使用したり、イベントを発火させたりする
      },
      
      formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
      }
    }
  };
  </script>
  
  <style scoped>
  .game-controls-panel {
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
  
  .status-section {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  
  .status-item {
    display: flex;
    align-items: center;
  }
  
  .label {
    font-weight: 500;
    margin-right: 8px;
  }
  
  .value {
    font-weight: 600;
  }
  
  .status-waiting {
    color: #f39c12;
  }
  
  .status-active {
    color: #2ecc71;
  }
  
  .status-finished {
    color: #3498db;
  }
  
  .controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .control-button {
    padding: 10px;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .control-button.primary {
    background-color: #3498db;
    color: white;
  }
  
  .control-button.primary:hover {
    background-color: #2980b9;
  }
  
  .control-button.danger {
    background-color: #e74c3c;
    color: white;
  }
  
  .control-button.danger:hover {
    background-color: #c0392b;
  }
  
  .control-button.disabled {
    background-color: #ecf0f1;
    color: #95a5a6;
    cursor: not-allowed;
  }
  
  .phase-info {
    margin-top: 20px;
  }
  
  .phase-info h4 {
    margin-top: 0;
    margin-bottom: 12px;
    font-size: 16px;
  }
  
  .phase-timeline {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  
  .phase-item {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    position: relative;
  }
  
  .phase-item.completed {
    background-color: #2ecc71;
    color: white;
  }
  
  .phase-item.active {
    background-color: #3498db;
    color: white;
    box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2);
  }
  
  .phase-item.pending {
    background-color: #ecf0f1;
    color: #7f8c8d;
  }
  
  .phase-item:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    width: calc(100% - 15px);
    height: 2px;
    background-color: #ecf0f1;
    transform: translateY(-50%);
  }
  
  .phase-item.completed:not(:last-child)::after {
    background-color: #2ecc71;
  }
  
  .phase-description {
    background-color: #f8f9fa;
    padding: 12px;
    border-radius: 4px;
    font-size: 14px;
    margin-bottom: 16px;
  }
  
  .phase-actions {
    background-color: #eaf5ff;
    padding: 12px;
    border-radius: 4px;
    margin-top: 12px;
  }
  
  .phase-actions h5 {
    margin-top: 0;
    margin-bottom: 8px;
    font-size: 14px;
    color: #2980b9;
  }
  
  .action-list {
    margin: 0;
    padding-left: 20px;
  }
  
  .action-list li {
    margin-bottom: 6px;
    font-size: 14px;
    line-height: 1.4;
  }
  
  .action-list i {
    color: #3498db;
    margin-right: 6px;
  }
  
  .game-timer-section {
    margin: 16px 0;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background-color: #ecf0f1;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 6px;
  }
  
  .progress-fill {
    height: 100%;
    background-color: #3498db;
    transition: width 1s linear;
  }
  
  .phase-timer {
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    color: #34495e;
  }
  
  .time-value {
    font-family: monospace;
    font-weight: 700;
    color: #e74c3c;
  }
  
  .phase-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }
  
  .phase-number {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .completed .phase-number {
    background-color: #2ecc71;
    color: white;
  }
  
  .active .phase-number {
    background-color: #3498db;
    color: white;
    box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2);
  }
  
  .pending .phase-number {
    background-color: #ecf0f1;
    color: #7f8c8d;
  }
  
  .phase-duration {
    font-size: 10px;
    color: #7f8c8d;
    margin-top: 4px;
  }
  
  .status-item.timer {
    margin-left: auto;
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