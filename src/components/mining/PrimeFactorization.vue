<template>
  <div class="tamper-game-container"> <h1>トランザクション・マッチャー</h1>

    <div class="status-bar">
      <div class="info-item timer-container">
        <div class="timer-bar" :style="{ width: `${(timeLeft / maxTime) * 100}%` }"></div>
        <span>{{ timeLeft }}s</span>
      </div>
      <div class="info-item lives">
        <span v-for="n in lives" :key="'life-' + n" class="heart">❤️</span>
      </div>
      <div class="info-item score">Score: {{ score }}</div>
    </div>

    <p class="instruction">表示された取引内容に合う選択肢を素早く選んでください！</p>

    <div class="problem-display-area" v-if="currentTransaction && !isGameOver">
      <div class="transaction-text-box">
        <p>{{ currentTransaction.text }}</p>
      </div>
    </div>

    <div class="choices-area" v-if="currentTransaction && !isGameOver">
        <div class="choices" v-if="choices && choices.length > 0">
          <button
            v-for="(choice) in choices"
            :key="choice.key"
            @click="submitAnswer(choice)"
            :disabled="isSubmitting"
            class="choice-button"
          >
            {{ choice.text }}
          </button>
        </div>
        <div v-else>
          <p>選択肢を生成中...</p>
        </div>
    </div>

    <div class="message-area">
        <transition name="feedback-fade">
            <p v-if="feedbackMessage" :class="feedbackMessageType">{{ feedbackMessage }}</p>
        </transition>
    </div>

     <div class="game-over-overlay" v-if="isGameOver">
         <div class="game-over-modal">
             <h2>GAME OVER</h2>
             <p>最終スコア: {{ score }}</p>
             <p class="redirect-message">まもなくマイニングページに戻ります...</p>
         </div>
     </div>
  </div>
</template>

<script>
// import sha256 from "crypto-js/sha256"; // このゲームでは不要

// --- 定数定義 ---
const INITIAL_LIVES = 3;
const INITIAL_MAX_TIME = 5; // 時間制限を短く設定 (テスト用) -> 元に戻す場合は 15 や 20 など
const POINTS_PER_CORRECT = 100;
const REDIRECT_DELAY = 3000;
const FEEDBACK_DURATION = 700;

// ダミーデータ生成用
const NAMES = ["アリス", "ボブ", "キャロル", "デイブ", "EVE", "Alice", "Bob", "Carol"];
const CURRENCIES = ["コイン", "トークン", "ポイント", "ETH", "BTC"];
const ITEMS = ["クリスタルソード", "ポーション", "NFTアート#123", "土地(区画A)"];

export default {
  name: "TransactionMatcherGameStyledVue2", // コンポーネント名はこのままにしておきます
  data: function () {
    return {
      currentTransaction: null,
      choices: [],
      score: 0,
      lives: INITIAL_LIVES,
      maxTime: INITIAL_MAX_TIME,
      timeLeft: INITIAL_MAX_TIME,
      timer: null,
      isGameOver: false,
      isSubmitting: false,
      feedbackMessage: null,
      feedbackMessageType: 'success',
      problemCounter: 0,
    };
  },
  // computed はなし
  methods: {
    // --- ゲーム制御 ---
    initializeGame: function () {
      console.log("Initializing Transaction Matcher Game (Styled Vue 2)...");
      this.score = 0;
      this.lives = INITIAL_LIVES;
      this.maxTime = INITIAL_MAX_TIME;
      this.timeLeft = this.maxTime;
      this.isGameOver = false;
      this.isSubmitting = false;
      this.feedbackMessage = null;
      this.problemCounter = 0;
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      this.generateProblem();
      this.startTimer();
    },
    startTimer: function () {
      if (this.timer) clearInterval(this.timer);
      this.timeLeft = this.maxTime;
      this.timer = setInterval(() => {
        if (this.isGameOver || this.isSubmitting || this.timeLeft <= 0) return;
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.handleIncorrect(true); // 時間切れ
        }
      }, 1000);
    },
    endGame: function () {
      console.log("Game Over!");
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.isGameOver = true;

      // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
      // ★ 変更点: ゲームオーバー時にイベントを発行 ★
      // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
      console.log(`Emitting game-completed event with score: ${this.score}`);
      this.$emit('game-completed', { score: this.score });
      // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
      // ★ ここまで変更点                           ★
      // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

      // 3秒後にリダイレクト
      setTimeout(() => {
          if (this.$router) { this.$router.push('/mining'); }
          else { window.location.href = '/mining'; } // フォールバック
      }, REDIRECT_DELAY);
    },

    // --- 問題生成 ---
    generateProblem: function () {
        this.problemCounter++;
        const isItemTransfer = Math.random() < 0.3;
        let senderIndex = Math.floor(Math.random() * NAMES.length);
        let receiverIndex = Math.floor(Math.random() * NAMES.length);
        while (senderIndex === receiverIndex) { receiverIndex = Math.floor(Math.random() * NAMES.length); }
        const sender = NAMES[senderIndex];
        const receiver = NAMES[receiverIndex];
        let amount = 0, currencyOrItem = '', transactionText = '', correctChoiceText = '';
        const blockNum = Math.floor(Math.random()*8999)+1000;

        if (isItemTransfer) {
            currencyOrItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
            amount = 1; // アイテムは通常1つ
            transactionText = `記録 [Block #${blockNum}]: ${sender} が ${receiver} へアイテム「${currencyOrItem}」を譲渡。`;
            correctChoiceText = `${sender} → ${receiver} : ${currencyOrItem}`; // アイテム名をそのまま表示
        } else {
            currencyOrItem = CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];
            amount = Math.floor(Math.random() * 991) + 10; // 10から1000
            transactionText = `承認 [Block #${blockNum}]: ${sender} から ${receiver} に ${amount} ${currencyOrItem} を送金。`;
            correctChoiceText = `${sender} → ${receiver} : ${amount}`; // 金額のみ表示
        }
        this.currentTransaction = { text: transactionText, sender: sender, receiver: receiver, amount: amount, unit: currencyOrItem, key: `tx-${this.problemCounter}` };
        this.choices = this.generateChoices(sender, receiver, amount, currencyOrItem, correctChoiceText, isItemTransfer);
        console.log("New problem generated:", this.currentTransaction);
        console.log("Choices generated:", this.choices);
    },
    generateChoices: function (sender, receiver, amount, unit, correctText, isItem) {
        const choicesSet = new Set();
        choicesSet.add(JSON.stringify({ text: correctText, isCorrect: true, key: `choice-${this.problemCounter}-0` }));

        // ダミー選択肢生成ロジック (簡略化・修正の可能性あり)
        while (choicesSet.size < 3) {
            let dSender = sender, dReceiver = receiver, dAmount = amount, dUnit = unit, wrongText = '';
            const changeType = Math.random(); // 変更タイプを決定

            if (changeType < 0.33) { // 送信者/受信者を変更
                if (Math.random() < 0.5) { [dSender, dReceiver] = [receiver, sender]; } // 入れ替え
                else { // 別の人にする
                    let wIdx = Math.floor(Math.random() * NAMES.length);
                    while(NAMES[wIdx] === sender || NAMES[wIdx] === receiver){ wIdx = Math.floor(Math.random() * NAMES.length); }
                    if(Math.random() < 0.5) dSender = NAMES[wIdx]; else dReceiver = NAMES[wIdx];
                }
            } else if (changeType < 0.66) { // 金額/アイテムを変更
                 if (!isItem) { // 金額の場合
                     dAmount = Math.floor(Math.random() * 991) + 10;
                     while(dAmount === amount) dAmount = Math.floor(Math.random() * 991) + 10;
                     // 低確率で通貨単位も変える
                     if(Math.random() < 0.2) dUnit = CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];
                 } else { // アイテムの場合
                     dUnit = ITEMS[Math.floor(Math.random() * ITEMS.length)];
                     while(dUnit === unit) dUnit = ITEMS[Math.floor(Math.random() * ITEMS.length)];
                 }
            } else { // 複合的に変更 (例: 受信者と金額/アイテム)
                 let wrongNameIndex = Math.floor(Math.random() * NAMES.length);
                 while(NAMES[wrongNameIndex] === sender || NAMES[wrongNameIndex] === receiver){ wrongNameIndex = Math.floor(Math.random() * NAMES.length); }
                 dReceiver = NAMES[wrongNameIndex]; // 受信者を変更

                 if (!isItem) {
                     dAmount = Math.floor(Math.random() * 991) + 10;
                     while(dAmount === amount) dAmount = Math.floor(Math.random() * 991) + 10;
                 } else {
                     dUnit = ITEMS[Math.floor(Math.random() * ITEMS.length)];
                     while(dUnit === unit) dUnit = ITEMS[Math.floor(Math.random() * ITEMS.length)];
                 }
            }

            // ダミーテキスト生成
            if (isItem) { wrongText = `${dSender} → ${dReceiver} : ${dUnit}`; }
            else { wrongText = `${dSender} → ${dReceiver} : ${dAmount}`; } // 金額のみ表示

            choicesSet.add(JSON.stringify({ text: wrongText, isCorrect: false, key: `choice-${this.problemCounter}-${choicesSet.size}` }));
        }

        const finalChoices = Array.from(choicesSet).map(s => JSON.parse(s));
        return this.shuffleArray(finalChoices); // 選択肢をシャッフル
    },

    // --- 回答処理 ---
    submitAnswer: function (selectedChoice) {
      if (this.isGameOver || this.isSubmitting) return;
      this.isSubmitting = true;
      if(this.timer) clearInterval(this.timer); // タイマー停止

      const isCorrect = selectedChoice.isCorrect;

      // フィードバックメッセージ設定
      this.feedbackMessage = isCorrect ? "承認!" : "拒否!";
      this.feedbackMessageType = isCorrect ? 'success' : 'error';

      if (isCorrect) { this.handleCorrect(); }
      else { this.handleIncorrect(false); } // 間違い

      // 短いディレイ後、次の問題へ or ゲームオーバー処理
      setTimeout(() => {
          this.feedbackMessage = null; // フィードバックメッセージを消す
          // ゲームオーバーでなければ次の問題へ
          if (!this.isGameOver) {
              this.generateProblem();
              this.isSubmitting = false; // 送信フラグ解除
              this.startTimer(); // タイマー再開
          }
      }, FEEDBACK_DURATION); // FEEDBACK_DURATION後に実行
    },
    handleCorrect: function () {
        console.log("Correct!");
        // スコア計算 (残り時間ボーナスを追加)
        this.score += POINTS_PER_CORRECT + Math.max(0, Math.floor(this.timeLeft / 5)); // 例: 5秒ごとに1点ボーナス
        // isSubmitting 解除やタイマー再開は submitAnswer の setTimeout 後に行う
    },
    handleIncorrect: function (isTimeout = false) {
        if (this.isGameOver) return; // すでにゲームオーバーなら何もしない
        console.log(isTimeout ? "Incorrect: Time's up!" : "Incorrect: Wrong choice.");
        this.lives--;
        // ライフがなくなったらゲームオーバー
        if (this.lives <= 0) {
            this.endGame();
        }
        // isSubmitting 解除やタイマー再開は submitAnswer の setTimeout 後に行う
    },

    // --- ヘルパー関数 ---
    formatTimestamp: function (timestamp) { return ''; }, // 未使用
    shuffleArray: function (array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },
  },
  // --- ライフサイクルフック ---
  mounted: function () {
    console.log("TransactionMatcherGame component mounted (Vue 2 Styled).");
    this.initializeGame(); // マウント時にゲーム初期化
  },
  beforeDestroy: function () {
    console.log("TransactionMatcherGame component destroying (Vue 2 Styled), clearing timer.");
    if (this.timer) {
      clearInterval(this.timer); // コンポーネント破棄時にタイマー解除
    }
  }
};
</script>

<style scoped>
/* ★★★ スタイルは変更なし ★★★ */

/* --- 基本スタイル --- */
.tamper-game-container { display: flex; flex-direction: column; align-items: center; gap: 15px; padding: 20px; font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; max-width: 100%; margin: auto; background-color: #e9eff1; border-radius: 12px; box-shadow: 0 6px 12px rgba(0,0,0,0.1); position: relative; box-sizing: border-box; }
h1 { color: #2c3e50; margin-bottom: 10px; font-size: 1.8em; text-align: center; }
.instruction { font-size: 14px; color: #555; margin-bottom: 20px; text-align: center; line-height: 1.6; }

/* --- ステータスバー --- */
.status-bar { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 15px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); flex-wrap: wrap; gap: 10px 20px; margin-bottom: 20px; box-sizing: border-box; }
.info-item { font-weight: bold; font-size: 14px; color: #333; padding: 5px 8px; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
.score { font-size: 16px; background: none; padding: 0; }
/* ★ タイマー表示スタイル修正 ★ */
.timer-container { width: 120px; height: 22px; background-color: #e9ecef; border-radius: 11px; overflow: hidden; position: relative; padding: 0; border: 1px solid #ccc; }
.timer-bar { height: 100%; background: linear-gradient(to right, #5cb85c, #a5d6a7); transition: width 0.5s linear; border-radius: 11px 0 0 11px; }
.timer-container span { position: absolute; right: 8px; top: 2px; font-size: 12px; color: #333; font-weight: bold; }
.lives { gap: 4px; background: none; padding: 0;}
.heart { font-size: 20px; color: #dc3545; animation: heartbeat 1.5s ease-in-out infinite; }
@keyframes heartbeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }

/* --- 問題表示エリア --- */
.problem-display-area { width: 95%; max-width: 500px; margin-bottom: 25px; }
.transaction-text-box { padding: 20px 25px; border: 2px solid #90a4ae; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.08); min-height: 100px; display: flex; justify-content: center; align-items: center; text-align: center; }
.transaction-text-box p { font-size: 1.2em; line-height: 1.7; color: #333; margin: 0; font-family: 'Noto Sans JP', sans-serif; }

/* --- ★ 選択肢エリアとボタン (再修正) ★ --- */
.choices-area { width: 100%; max-width: 500px; }
/* choicesコンテナのスタイルを再定義 */
.choices {
    display: grid;
    grid-template-columns: 1fr; /* デフォルト縦1列 */
    gap: 12px;
    width: 100%;
    margin: 0 auto;
}
/* 画面幅に応じて列数を変更 (任意) - 前回のまま */
@media (min-width: 500px) {
    .choices { grid-template-columns: repeat(3, 1fr); }
}
/* choice-buttonスタイルを再定義 */
.choice-button {
    padding: 15px 10px;
    font-size: 1.05em;
    font-weight: 600;
    color: #34495e;
    background-color: #ffffff;
    border: 2px solid #bdc3c7;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.1s ease;
    text-align: center;
    box-shadow: 0 3px 5px rgba(0,0,0,0.07);
    /* ★ 表示に必要なスタイルを確保 ★ */
    display: block; /* blockレベル要素として表示 */
    visibility: visible; /* 見えるように */
    opacity: 1; /* 透明度なし */
    height: auto; /* 高さを自動に */
    overflow: visible; /* はみ出し許可 */
    position: relative; /* 相対位置 */
}
.choice-button:hover:not(:disabled) { background-color: #ecf0f1; border-color: #3498db; }
.choice-button:active:not(:disabled) { transform: scale(0.98); }
.choice-button:disabled { background-color: #e9ecef; border-color: #ced4da; color: #6c757d; cursor: not-allowed; opacity: 0.8; }
/* トランジション用スタイル削除 (transition-group を削除したため) */
/* .choice-list-enter-active, ... etc ... */


/* --- メッセージエリア --- */
.message-area { margin-top: 15px; min-height: 30px; width: 100%; text-align: center; }
.feedback-fade-enter-active, .feedback-fade-leave-active { transition: opacity 0.3s ease; }
.feedback-fade-enter, .feedback-fade-leave-to { opacity: 0; }
.message-area p { font-weight: bold; padding: 8px 18px; border-radius: 15px; display: inline-block; font-size: 1.1em; animation: messageFadeIn 0.4s ease; }
@keyframes messageFadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.message-area .success { background-color: rgba(46, 204, 113, 0.9); color: white; }
.message-area .error { background-color: rgba(231, 76, 60, 0.9); color: white; }

/* --- ゲームオーバー表示 --- */
.game-over-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; border-radius: 12px; opacity: 0; animation: fadeInOverlay 0.5s ease forwards; }
@keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
.game-over-modal { background-color: white; padding: 35px 45px; border-radius: 10px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); text-align: center; transform: scale(0.8); animation: zoomInModal 0.4s 0.2s ease forwards; }
@keyframes zoomInModal { from { opacity:0; transform: scale(0.8); } to { opacity:1; transform: scale(1); } }
.game-over-modal h2 { color: #dc3545; margin-top: 0; font-size: 1.8em; }
.game-over-modal p { font-size: 1.1em; margin: 10px 0 15px; }
.redirect-message { font-size: 1em; color: #666; margin-top: 20px; font-style: italic; }

</style>