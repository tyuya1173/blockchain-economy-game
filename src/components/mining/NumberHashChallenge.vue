<template>
  <div class="game-container">
    <div class="status-bar">
      <div class="timer-container">
        <div class="timer-bar" :style="{ width: `${(timeLeft / maxTime) * 100}%` }"></div>
        <span>{{ timeLeft }}s</span>
      </div>
      <div class="lives">
        <span v-for="n in lives" :key="'life-' + n" class="heart">❤️</span>
      </div>
      <div class="score">Score: {{ score }}</div>
      <div class="combo" v-if="consecutiveCorrect > 1">Combo: x{{ comboMultiplier.toFixed(1) }}</div>
    </div>

    <div class="game-area" :class="{ 'animating': isAnimating }">
        <div class="block-container previous-block-container">
            <div class="block previous-block" v-if="previousBlock">
                <h3>前のブロック</h3>
                <p><span>ハッシュ:</span> {{ previousBlock.hash }}</p>
                <p><span>タイムスタンプ:</span> {{ formatTimestamp(previousBlock.timestamp) }}</p>
                <p><span>前のハッシュ:</span> {{ previousBlock.previousHash || 'N/A' }}</p>
                </div>
             <div class="block placeholder-block" v-else>
                 </div>
        </div>
        <div class="block-container current-block-container">
            <div class="block current-block" v-if="currentBlock && !isGameOver">
                <h3>現在のブロック</h3>
                <p>
                  <span>前のブロックのハッシュ:</span>
                  <span v-if="currentBlock.missingField === 'previousHash'" class="missing-box">?</span>
                  <span v-else>{{ currentBlock.previousHash }}</span>
                </p>
                <p>
                  <span>タイムスタンプ:</span>
                  <span v-if="currentBlock.missingField === 'timestamp'" class="missing-box">?</span>
                  <span v-else>{{ formatTimestamp(currentBlock.timestamp) }}</span>
                </p>
                <p><span>ハッシュ:</span> {{ currentBlock.hash }}</p>
                 </div>
             <div class="block placeholder-block" v-else-if="!isGameOver">
                Loading...
             </div>
        </div>
        <div class="block-container next-block-container" v-if="isAnimating && nextBlock">
             <div class="block next-block">
                  <h3>次のブロック</h3>
                 <p>
                    <span>前のブロックのハッシュ:</span>
                    <span v-if="nextBlock.missingField === 'previousHash'" class="missing-box">?</span>
                    <span v-else>{{ nextBlock.previousHash }}</span>
                 </p>
                 <p>
                    <span>タイムスタンプ:</span>
                    <span v-if="nextBlock.missingField === 'timestamp'" class="missing-box">?</span>
                    <span v-else>{{ formatTimestamp(nextBlock.timestamp) }}</span>
                 </p>
                  <p><span>ハッシュ:</span> {{ nextBlock.hash }}</p>
                   </div>
         </div>
    </div>

    <div class="choices" v-if="currentBlock && choices.length > 0 && !isGameOver">
      <p>「?」に当てはまるのはどれ？</p>
      <button
        v-for="(choice, index) in choices"
        :key="index"
        @click="submitAnswer(choice)"
        :disabled="isAnimating || isSubmitting"
      >
        {{ currentBlock.missingField === 'timestamp' ? formatTimestamp(choice) : choice }}
      </button>
    </div>

    <div class="game-over-container" v-if="isGameOver">
        <h2>ゲームオーバー！</h2>
        <p>最終スコア: {{ score }}</p>
        <p class="redirect-message">まもなくマイニングページに戻ります...</p>
        </div>

  </div>
</template>

<script>
// --- 定数定義 ---
const ANIMATION_DURATION = 500; // アニメーション時間 (ms) CSSと合わせる
const REDIRECT_DELAY = 3000;   // ゲームオーバー後、遷移するまでの待機時間(ms)

export default {
  name: 'BlockchainSequenceCheckerRedirectFull', // コンポーネント名
  data() {
    // コンポーネントのリアクティブな状態
    return {
      maxTime: 15,                // このゲームの制限時間 (秒)
      timeLeft: 15,               // 残り時間
      lives: 3,                   // 残りライフ
      score: 0,                   // スコア
      previousBlock: null,        // 左側に表示される前のブロック情報
      currentBlock: null,         // 右側に表示される現在のブロック（問題）
      nextBlock: null,            // アニメーション用に次に表示するブロック
      choices: [],                // 選択肢の配列
      correctAnswer: null,        // 現在の問題の正解
      timer: null,                // setIntervalのID
      consecutiveCorrect: 0,      // 連続正解数
      isSubmitting: false,          // 回答処理中フラグ
      isGameOver: false,          // ゲームオーバー状態フラグ
      isAnimating: false,         // ブロックスライドアニメーション中フラグ
    };
  },
  computed: {
    // 算出プロパティ (例: コンボ倍率)
    comboMultiplier() {
      if (this.consecutiveCorrect >= 10) return 1.5;
      if (this.consecutiveCorrect >= 5) return 1.2;
      return 1.0;
    }
  },
  methods: {
    // --- ゲーム制御メソッド ---

    // ゲームの初期化またはリセット
    startGame() {
      console.log("Starting game (BlockchainSequenceChecker)...");
      this.resetGame();              // ゲーム状態をリセット
      this.prepareFirstQuestion(); // 最初の問題を準備
      this.startTimer();             // タイマースタート
      this.isGameOver = false;       // ゲームオーバーフラグを解除
    },
    // ゲーム状態を初期値にリセット
    resetGame() {
      this.timeLeft = this.maxTime;
      this.lives = 3;
      this.score = 0;
      this.consecutiveCorrect = 0;
      this.previousBlock = null;
      this.currentBlock = null;
      this.nextBlock = null;
      this.choices = [];
      this.correctAnswer = null;
      this.isSubmitting = false;
      this.isAnimating = false;
      if (this.timer) { // 既存タイマーがあればクリア
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    // タイマーを開始またはリセット＆開始
    startTimer() {
       if (this.timer) clearInterval(this.timer); // 既存タイマークリア
       this.timeLeft = this.maxTime; // 時間をリセット
       console.log(`Timer started/reset: ${this.timeLeft}s`);
       this.timer = setInterval(() => {
        // ゲームオーバー中、アニメーション中、処理中はタイマーを進めない
        if (this.isGameOver || this.isAnimating || this.isSubmitting || this.timeLeft <= 0) {
             return;
        }
        this.timeLeft--; // 時間を減らす
        // 時間切れ判定
        if (this.timeLeft <= 0) {
           console.log("Time's up!");
           this.handleIncorrect(true); // 時間切れ処理
           // タイマー再開は handleIncorrect 内で行う（ライフがあれば）
        }
      }, 1000); // 1秒ごとに実行
    },

    // --- ★ ゲームオーバー処理 (ページ遷移) ★ ---
    endGame() {
      console.log("Game Over! Redirecting soon...");
      if (this.timer) clearInterval(this.timer); // タイマー停止
      this.timer = null;
      this.isGameOver = true; // ゲームオーバー状態にする

      // 指定時間後に /mining へ遷移
      setTimeout(() => {
          // Vue Routerの存在を確認して使用
          if (this.$router) {
               console.log("Redirecting to /mining using Vue Router...");
              this.$router.push('/mining');
          } else {
              // Vue Routerがない場合のフォールバック
              console.warn("Vue Router not found. Attempting standard redirect to /mining.");
              window.location.href = '/mining'; // 通常のページ遷移
          }
      }, REDIRECT_DELAY); // 設定した遅延時間後に遷移
    },

    // --- 問題生成メソッド ---

    // 最初の問題を準備
    prepareFirstQuestion() {
        // 最初の「前のブロック」は完成状態で生成
        this.previousBlock = this.createDummyBlock(null, true);
        // 最初の「現在のブロック」（問題）を生成
        this.currentBlock = this.generateNewBlockData(this.previousBlock);
        // 最初の問題の選択肢と正解を準備
        this.prepareChoicesAndAnswer(this.currentBlock);
    },

    // 新しいブロックデータ（問題）を生成
    generateNewBlockData(prevBlock) {
        const newTimestamp = this.generateTimestamp(prevBlock?.timestamp); // 前のブロックのタイムスタンプを基準にする
        // 穴埋め箇所をランダムに決定 ('previousHash' または 'timestamp')
        const missingField = Math.random() < 0.6 ? 'previousHash' : 'timestamp';
        // 新しいブロックオブジェクトを作成
        const newBlock = {
           previousHash: prevBlock?.hash ?? 'genesis', // 前のブロックのハッシュを参照 (なければ 'genesis')
           timestamp: newTimestamp,                 // 生成したタイムスタンプ
           missingField: missingField,              // 穴埋め対象フィールド名
           hash: this.generateRandomHash(),         // このブロック自身のハッシュ（ダミー）
           // 他のデータもここに追加可能 (例: difficulty, nonceなど)
       };
       return newBlock;
    },

    // 与えられたブロックデータから正解と選択肢を準備
    prepareChoicesAndAnswer(blockData) {
       // 穴埋め対象フィールドに応じて正解を設定
       if (blockData.missingField === 'previousHash') {
           this.correctAnswer = blockData.previousHash;
       } else { // timestamp
           this.correctAnswer = blockData.timestamp;
       }
       // 正解を含む選択肢を生成
       this.choices = this.generateChoices(
           this.correctAnswer,
           blockData.missingField
       );
       console.log("問題準備完了:", blockData.missingField, "正解:", this.correctAnswer);
    },

    // ダミーのブロックデータを生成（主に初期表示用）
    createDummyBlock(previousTimestamp, isComplete = false) {
        const timestamp = this.generateTimestamp(previousTimestamp);
        const prevHash = previousTimestamp ? this.generateRandomHash() : 'genesis';
        const block = {
            hash: this.generateRandomHash(), // ダミーハッシュ
            timestamp: timestamp,
            previousHash: prevHash,
            // 完成状態なら missingField は null
            missingField: isComplete ? null : (Math.random() < 0.6 ? 'previousHash' : 'timestamp'),
        };
        // もし問題として生成する場合（isComplete=false）は選択肢も準備
         if (!isComplete) {
             this.prepareChoicesAndAnswer(block);
         }
        return block;
    },

    // 正解とダミーを含む選択肢の配列を生成
    generateChoices(correctAnswer, fieldType) {
      const choices = new Set([correctAnswer]); // Setで重複を防ぐ
      while (choices.size < 3) { // 合計3つの選択肢になるまでループ
        let dummyAnswer;
        if (fieldType === 'previousHash') {
          // ダミーのハッシュ文字列を生成
          dummyAnswer = this.generateRandomHash();
          // まれに正解と同じになった場合のフォールバック
          if (dummyAnswer === correctAnswer && choices.size < 2) {
                dummyAnswer = this.generateRandomHash() + 'd';
           }
        } else { // timestamp
          // 正解時刻からランダムにずれたダミー時刻を生成
          const plusOrMinus = Math.random() < 0.5 ? -1 : 1;
          const diffMinutes = Math.floor(Math.random() * 10) + 1; // 1〜10分違い
          // correctAnswerがDateオブジェクトか確認
          const baseTime = (correctAnswer instanceof Date) ? correctAnswer.getTime() : new Date(correctAnswer).getTime();
          dummyAnswer = new Date(baseTime + plusOrMinus * diffMinutes * 60000);
           // まれに正解と同じになった場合のフォールバック
          if (dummyAnswer.getTime() === baseTime && choices.size < 2) {
               dummyAnswer = new Date(baseTime + (plusOrMinus * 11) * 60000);
           }
        }
        // 正解と異なる値が生成されたらSetに追加
         let correctValue = (fieldType === 'timestamp' && correctAnswer instanceof Date) ? correctAnswer.getTime() : correctAnswer;
         let dummyValue = (fieldType === 'timestamp' && dummyAnswer instanceof Date) ? dummyAnswer.getTime() : dummyAnswer;
         if(dummyValue !== correctValue) {
            choices.add(dummyAnswer);
         } else if (choices.size === 2){ // 最後の選択肢がどうしても被る場合の最終手段
             if(fieldType === 'previousHash') choices.add(this.generateRandomHash() + 'x');
             else choices.add(new Date(correctValue + 12345));
         }
      }
      // Setを配列に変換し、順番をシャッフルして返す
      return this.shuffleArray(Array.from(choices));
    },

    // --- 回答処理メソッド ---

    // プレイヤーが選択肢をクリックした時の処理
    submitAnswer(choice) {
       // アニメーション中、処理中、ゲームオーバーなら何もしない
       if (this.isAnimating || this.isSubmitting || this.isGameOver) return;
       this.isSubmitting = true; // 処理開始フラグ
       clearInterval(this.timer); // タイマー停止

       let isCorrect = false;
       // タイムスタンプの比較は getTime() でミリ秒を比較するのが確実
       if (this.currentBlock.missingField === 'timestamp') {
           const choiceTime = (choice instanceof Date) ? choice.getTime() : new Date(choice).getTime();
           const correctTime = (this.correctAnswer instanceof Date) ? this.correctAnswer.getTime() : new Date(this.correctAnswer).getTime();
           isCorrect = choiceTime === correctTime;
       } else { // previousHash の比較
           isCorrect = choice === this.correctAnswer;
       }

       // 正誤に応じて処理を分岐
       if (isCorrect) {
           this.handleCorrect(); // 正解処理へ
       } else {
           this.handleIncorrect(false); // 不正解処理へ
           // this.isSubmitting = false; // 不正解時はすぐに次の操作可能に -> handleIncorrect内で行う
           // タイマー再開も handleIncorrect 内
       }
    },

    // 正解時の処理
    handleCorrect() {
      console.log("正解！");
      this.consecutiveCorrect++; // 連続正解数を増やす
      const timeBonus = this.timeLeft * 5; // 時間ボーナス計算
      const baseScore = 100; // 基本スコア
      this.score += Math.round((baseScore + timeBonus) * this.comboMultiplier); // スコア加算

      // 正解したので、現在のブロックを「完成状態」にする
      const completedBlock = { ...this.currentBlock, missingField: null };

      // 次の問題（新しい currentBlock）を生成しておく
      this.nextBlock = this.generateNewBlockData(completedBlock); // completedBlock を prevBlock として渡す
      // 次の問題の選択肢と正解も準備
      this.prepareChoicesAndAnswer(this.nextBlock);

      // アニメーション開始
      this.isAnimating = true;

      // アニメーション完了後に状態を更新するためのタイマー
      setTimeout(() => {
          this.previousBlock = completedBlock; // 左のブロックを更新 (完成状態で表示)
          this.currentBlock = this.nextBlock;   // 右のブロック（問題）を更新
          this.nextBlock = null; // アニメーション用の一時データはクリア
          this.isAnimating = false; // アニメーション終了
          this.isSubmitting = false; // 処理完了
          this.startTimer(); // 次の問題のタイマースタート
          console.log("アニメーション完了、次の問題へ");
      }, ANIMATION_DURATION); // CSSのアニメーション時間と合わせる
    },

    // 不正解または時間切れ時の処理
    handleIncorrect(isTimeout = false) {
        if (this.isGameOver) return; // ゲームオーバーなら処理しない
        console.log(isTimeout ? "時間切れ！" : "不正解！");
        this.lives--; // ライフを減らす
        this.consecutiveCorrect = 0; // 連続正解リセット

        // 不正解エフェクトなどをここに追加可能

        // ライフが残っているかチェック
        if (this.lives <= 0) {
          this.endGame(); // ゲームオーバー処理へ
        } else {
            // ★不正解でも同じ問題が表示され続けるので、タイマーだけリセットして再開★
            console.log("Incorrect/Timeout: Resetting timer for the same question.");
            this.isSubmitting = false; // 操作可能にする
            this.startTimer(); // タイマーリセット＆再開
        }
    },

    // --- ヘルパー関数 ---

    // ランダムなハッシュ風文字列を生成
     generateRandomHash() {
      return Math.random().toString(36).substring(2, 8);
    },
    // 前のタイムスタンプを基に少し未来のタイムスタンプを生成
    generateTimestamp(previousTimestamp) {
      // 前のタイムスタンプがない(最初のブロック)場合は現在時刻より少し前を基準にする
      const baseTime = previousTimestamp ? (typeof previousTimestamp === 'string' ? new Date(previousTimestamp) : previousTimestamp).getTime() : Date.now() - 600000; // 10分前
      const randomMinutes = Math.floor(Math.random() * 5) + 1; // 1〜5分進める
      return new Date(baseTime + randomMinutes * 60000);
    },
    // タイムスタンプを指定フォーマットの文字列に変換
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
        if (isNaN(date.getTime())) return 'Invalid Date'; // 無効な日付チェック
        // スウェーデン形式 (YYYY-MM-DD HH:MM:SS) が近いため利用
        return date.toLocaleString('sv-SE');
    },
    // 配列の要素をシャッフル（Fisher-Yatesアルゴリズム）
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // 要素を入れ替え
      }
      return array;
    },
  },
  // コンポーネントがマウントされた時にゲームを開始
  mounted() {
    console.log("Component mounted, starting game.");
    this.startGame();
  },
  // コンポーネントが破棄される前にタイマーをクリア
  beforeDestroy() {
    console.log("Component destroying, clearing timer.");
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
};
</script>

<style scoped>
/* --- 全体のコンテナ --- */
.game-container { display: flex; flex-direction: column; align-items: center; gap: 15px; padding: 15px; font-family: sans-serif; max-width: 800px; margin: auto; background-color: #f4f7f6; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden; position: relative; }

/* --- ステータスバー --- */
.status-bar { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 8px 15px; background-color: #e9ecef; border-radius: 5px; flex-wrap: wrap; gap: 10px; z-index: 10; }
.timer-container { width: 150px; height: 20px; background-color: #ccc; border-radius: 10px; overflow: hidden; position: relative; }
.timer-bar { height: 100%; background-color: #28a745; transition: width 0.2s linear; border-radius: 10px 0 0 10px; }
.timer-container span { position: absolute; right: 5px; top: 1px; font-size: 12px; color: #333; font-weight: bold; }
.lives { display: flex; gap: 5px; }
.heart { font-size: 20px; color: red; animation: heartbeat 1.5s ease-in-out infinite; }
@keyframes heartbeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
.score { font-weight: bold; font-size: 16px; }
.combo { font-weight: bold; font-size: 14px; color: #007bff; }

/* --- ゲームエリア --- */
.game-area { display: flex; width: 200%; position: relative; transition: transform 0.5s ease-in-out; margin-top: 10px; }
.game-area.animating { transform: translateX(-50%); }

/* --- ブロックコンテナ --- */
.block-container { width: 50%; padding: 0 10px; box-sizing: border-box; display: flex; justify-content: center; }
.block-container.previous-block-container { justify-content: flex-end; }
.block-container.current-block-container { justify-content: flex-start; }
.next-block-container { position: absolute; width: 50%; left: 100%; top: 0; padding: 0 10px; box-sizing: border-box; display: flex; justify-content: center; opacity: 1; }

/* --- ブロック本体 --- */
.block { border: 2px solid #adb5bd; padding: 15px; border-radius: 8px; background-color: white; width: 100%; max-width: 350px; min-height: 200px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: opacity 0.3s ease-in-out; }
.block h3 { margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #495057; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; }
.block p { margin: 5px 0; font-size: 14px; word-break: break-all; }
.block p span:first-child { font-weight: bold; color: #343a40; margin-right: 5px; display: inline-block; min-width: 160px; }

/* --- 穴埋め箇所 --- */
.missing-box { display: inline-block; width: 25px; height: 20px; background-color: #343a40; color: white; font-weight: bold; text-align: center; line-height: 20px; border-radius: 3px; vertical-align: middle; margin: 0 2px; }

/* --- アニメーション --- */
.game-area.animating .previous-block-container { opacity: 0; }

/* --- 選択肢ボタン --- */
.choices { display: flex; justify-content: center; align-items: center; gap: 15px; width: 100%; margin-top: 20px; flex-wrap: wrap; }
.choices p { margin: 0 0 10px 0; font-weight: bold; flex-basis: 100%; text-align: center; }
.choices button { padding: 10px 20px; font-size: 14px; cursor: pointer; border: none; border-radius: 5px; background-color: #007bff; color: white; transition: background-color 0.2s; min-width: 100px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.choices button:hover:not(:disabled) { background-color: #0056b3; }
.choices button:disabled { background-color: #ccc; cursor: not-allowed; opacity: 0.7; }

/* --- ゲームオーバー表示 --- */
.game-over-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: rgba(255, 255, 255, 0.95); padding: 30px 40px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); text-align: center; z-index: 1001; animation: zoomInModal 0.4s ease; }
@keyframes zoomInModal { from { opacity:0; transform: translate(-50%, -50%) scale(0.8); } to { opacity:1; transform: translate(-50%, -50%) scale(1); } }
.game-over-container h2 { color: red; margin-top: 0; }
.redirect-message { font-size: 1em; color: #666; margin-top: 20px; font-style: italic; }

</style>