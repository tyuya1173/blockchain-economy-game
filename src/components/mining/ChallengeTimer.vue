<template>
  <div class="challenge-timer" v-if="isActive"> <p>
      <i class="fas fa-hourglass-half"></i>
      <strong>{{ challengeName }}</strong> はクールダウン中...
      残り: <strong>{{ formattedTime }}</strong>
    </p>
  </div>
   <div v-else class="challenge-timer inactive">
       </div>
</template>

<script>
export default {
  name: 'ChallengeTimer',
  props: {
    // どのチャレンジのクールダウンかを示す情報
    challengeType: {
      type: String,
      default: null // nullならタイマー非表示なども可能
    },
    // クールダウンが終了する時刻のタイムスタンプ (ミリ秒)
    cooldownEndTime: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      timer: null,
      currentTime: Date.now(), // 現在時刻を保持
    };
  },
  computed: {
    // 残り時間を秒で計算
    timeLeftSeconds() {
      if (!this.cooldownEndTime || this.cooldownEndTime <= this.currentTime) {
        return 0;
      }
      return Math.max(0, Math.floor((this.cooldownEndTime - this.currentTime) / 1000));
    },
    // 残り時間を 分:秒 形式にフォーマット
    formattedTime() {
      const minutes = Math.floor(this.timeLeftSeconds / 60);
      const seconds = this.timeLeftSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },
    // タイマーがアクティブかどうか
    isActive() {
        return this.timeLeftSeconds > 0 && this.challengeType !== null;
    },
    // 表示用のチャレンジ名 (必要に応じて調整)
    challengeName() {
        // challengeTypeに応じて分かりやすい名前に変換
        switch (this.challengeType) {
            case 'クイズチャレンジ': return 'クイズ';
            case 'ナンバーハッシュチャレンジ': return 'ナンバーハッシュ';
            case 'パターンマッチングチャレンジ': return 'パターンマッチ';
            default: return this.challengeType || 'チャレンジ';
        }
    }
  },
  methods: {
    startTimer() {
      console.log("Starting cooldown timer check for:", this.challengeType);
      this.stopTimer(); // 既存のタイマーがあれば停止
      this.currentTime = Date.now(); // 開始時に現在時刻を更新
      this.timer = setInterval(() => {
        this.currentTime = Date.now(); // 1秒ごとに現在時刻を更新
        if (this.timeLeftSeconds <= 0) {
          this.stopTimer();
          console.log(`Cooldown finished for: ${this.challengeType}`);
          this.$emit('cooldown-finished', this.challengeType); // 終了イベント発行
        }
      }, 1000);
    },
    stopTimer() {
      if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
          console.log("Cooldown timer stopped for:", this.challengeType);
      }
    }
  },
  watch: {
    // cooldownEndTimeが変わったらタイマーを開始/再開
    cooldownEndTime: {
      immediate: true, // 初期値でも監視
      handler(newEndTime) {
        if (newEndTime && newEndTime > Date.now()) {
          this.startTimer();
        } else {
          this.stopTimer();
        }
      }
    }
  },
  beforeDestroy() {
    this.stopTimer(); // コンポーネント破棄時にタイマー停止
  }
};
</script>

<style scoped>
.challenge-timer {
  padding: 12px 18px; /* パディング調整 */
  font-weight: 600; /* 少し太く */
  color: #1e88e5; /* 青系の色 */
  background-color: #e3f2fd; /* 薄い青 */
  border: 1px solid #bbdefb; /* 少し濃い青の枠 */
  border-radius: 6px;
  display: inline-block;
  margin-top: 15px; /* 上にマージン追加 */
  text-align: center;
  font-size: 14px;
  transition: opacity 0.3s ease;
}
.challenge-timer.inactive {
    opacity: 0.5; /* 非アクティブ時は少し薄く */
}
.challenge-timer p {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}
.challenge-timer i {
    font-size: 1.1em;
    opacity: 0.8;
}
.challenge-timer strong {
    color: #0d47a1; /* さらに濃い青 */
}
</style>