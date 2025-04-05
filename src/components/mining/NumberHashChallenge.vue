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
        <button @click="startGame">もう一度プレイ</button>
     </div>

  </div>
</template>

<script>
const ANIMATION_DURATION = 500; // アニメーション時間 (ms) CSSと合わせる

export default {
  name: 'BlockchainSequenceChecker', // 名前変更
  data() {
    return {
      maxTime: 15,
      timeLeft: 15,
      lives: 3,
      score: 0,
      previousBlock: null, // 左のブロック
      currentBlock: null,  // 右のブロック（問題）
      nextBlock: null,     // アニメーション用に次に表示するブロック
      choices: [],
      correctAnswer: null,
      timer: null,
      consecutiveCorrect: 0,
      isSubmitting: false, // 回答後の処理中フラグ
      isGameOver: false,
      isAnimating: false,  // アニメーション中フラグ
    };
  },
  computed: {
    comboMultiplier() {
      if (this.consecutiveCorrect >= 10) return 1.5;
      if (this.consecutiveCorrect >= 5) return 1.2;
      return 1.0;
    }
  },
  methods: {
    // --- ゲーム制御 ---
    startGame() {
      this.resetGame();
      this.prepareFirstQuestion(); // 最初の問題を準備
      this.startTimer();
      this.isGameOver = false;
    },
    resetGame() {
      this.timeLeft = this.maxTime;
      this.lives = 3;
      this.score = 0;
      this.consecutiveCorrect = 0;
      this.previousBlock = null; // 最初は前のブロックなし
      this.currentBlock = null;
      this.nextBlock = null;
      this.choices = [];
      this.correctAnswer = null;
      this.isSubmitting = false;
      this.isAnimating = false;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    startTimer() {
       if (this.timer) clearInterval(this.timer);
       this.timeLeft = this.maxTime;
       this.timer = setInterval(() => {
        if (this.isGameOver || this.isAnimating || this.isSubmitting) {
             return; // 停止条件
        }
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          console.log("時間切れ処理");
          clearInterval(this.timer); // タイマー停止
          this.handleIncorrect(true); // 時間切れ=不正解として処理
          // 不正解処理後、ライフがあればタイマー再開
           if (!this.isGameOver) {
               // 不正解時は同じ問題でタイマー再開
               this.startTimer();
           }
        }
      }, 1000);
    },
    endGame() {
      clearInterval(this.timer);
      this.timer = null;
      this.isGameOver = true;
    },

    // --- 問題生成 ---
    prepareFirstQuestion() {
        this.previousBlock = this.createDummyBlock(null, true); // 最初の左ブロック（完成状態）
        this.currentBlock = this.generateNewBlockData(this.previousBlock); // 最初の右ブロック（問題）
        this.prepareChoicesAndAnswer(this.currentBlock);
    },

    generateNewBlockData(prevBlock) {
        // 新しいブロックデータを生成する (currentBlock または nextBlock 用)
        const newTimestamp = this.generateTimestamp(prevBlock?.timestamp); // 前のブロックがない場合も考慮
        const missingField = Math.random() < 0.6 ? 'previousHash' : 'timestamp';
        const newBlock = {
           previousHash: prevBlock?.hash ?? 'genesis', // 前のブロックのハッシュを参照 (なければ 'genesis')
           timestamp: newTimestamp,
           missingField: missingField,
           hash: this.generateRandomHash(), // 自身のハッシュ
           // 他のデータも追加可能
       };
       return newBlock;
    },

    prepareChoicesAndAnswer(blockData) {
        // 与えられたブロックデータから正解と選択肢を準備
        if (blockData.missingField === 'previousHash') {
           this.correctAnswer = blockData.previousHash;
       } else {
           this.correctAnswer = blockData.timestamp;
       }
       this.choices = this.generateChoices(
           this.correctAnswer,
           blockData.missingField
       );
       console.log("問題準備完了:", blockData.missingField, "正解:", this.correctAnswer);
    },

    createDummyBlock(previousTimestamp, isComplete = false) {
        // ダミーブロック生成（isComplete = true なら完成状態）
        const timestamp = this.generateTimestamp(previousTimestamp);
        const prevHash = previousTimestamp ? this.generateRandomHash() : 'genesis'; // 適当な前のハッシュ
        const block = {
            hash: this.generateRandomHash(),
            timestamp: timestamp,
            previousHash: prevHash,
             missingField: isComplete ? null : (Math.random() < 0.6 ? 'previousHash' : 'timestamp'), // 完成状態ならnull
        };
         if (!isComplete) {
             this.prepareChoicesAndAnswer(block); // 問題なら選択肢も準備
         }
        return block;
    },

    generateChoices(correctAnswer, fieldType) {
      // 選択肢生成ロジック (前回と同じ)
      const choices = new Set([correctAnswer]);
      while (choices.size < 3) {
        let dummyAnswer;
        if (fieldType === 'previousHash') {
          dummyAnswer = this.generateRandomHash();
           // 正解と同じにならないようにする簡易チェック
           if (dummyAnswer === correctAnswer && choices.size < 2) { // 選択肢がまだ少ない場合、再生成
                dummyAnswer = this.generateRandomHash() + 'd'; // ダミー生成しなおし
           }
        } else {
          const plusOrMinus = Math.random() < 0.5 ? -1 : 1;
          const diffMinutes = Math.floor(Math.random() * 10) + 1;
          const baseTime = (correctAnswer instanceof Date) ? correctAnswer.getTime() : new Date(correctAnswer).getTime();
          dummyAnswer = new Date(baseTime + plusOrMinus * diffMinutes * 60000);
           // 正解と同じにならないように簡易チェック
           if (dummyAnswer.getTime() === baseTime && choices.size < 2) {
               dummyAnswer = new Date(baseTime + (plusOrMinus * 11) * 60000); // 別の時間に
           }
        }
         let correctValue = (fieldType === 'timestamp' && correctAnswer instanceof Date) ? correctAnswer.getTime() : correctAnswer;
         let dummyValue = (fieldType === 'timestamp' && dummyAnswer instanceof Date) ? dummyAnswer.getTime() : dummyAnswer;

         if(dummyValue !== correctValue) {
            choices.add(dummyAnswer);
         } else if (choices.size === 2){ // 最後の選択肢がどうしても被る場合、無理やり違う値に
             if(fieldType === 'previousHash') choices.add(this.generateRandomHash() + 'x');
             else choices.add(new Date(correctValue + 12345));
         }
      }
      return this.shuffleArray(Array.from(choices));
    },

    // --- 回答処理 ---
    submitAnswer(choice) {
       if (this.isAnimating || this.isSubmitting || this.isGameOver) return;
       this.isSubmitting = true; // 処理開始
       clearInterval(this.timer); // タイマー停止

       let isCorrect = false;
       if (this.currentBlock.missingField === 'timestamp') {
           const choiceTime = (choice instanceof Date) ? choice.getTime() : new Date(choice).getTime();
           const correctTime = (this.correctAnswer instanceof Date) ? this.correctAnswer.getTime() : new Date(this.correctAnswer).getTime();
           isCorrect = choiceTime === correctTime;
       } else {
           isCorrect = choice === this.correctAnswer;
       }

       if (isCorrect) {
           this.handleCorrect(); // 正解処理へ
       } else {
           this.handleIncorrect(false); // 不正解処理へ
           this.isSubmitting = false; // 不正解時はすぐに次の操作可能に
            // 不正解時は同じ問題でタイマー再開
           this.startTimer();
       }
    },

    handleCorrect() {
      console.log("正解！");
      this.consecutiveCorrect++;
      const timeBonus = this.timeLeft * 5;
      const baseScore = 100;
      this.score += Math.round((baseScore + timeBonus) * this.comboMultiplier);

      // 正解したので、現在のブロックを完成状態にする（missingFieldをnullに）
      const completedBlock = { ...this.currentBlock, missingField: null };

      // 次のブロック（問題）を生成しておく
      this.nextBlock = this.generateNewBlockData(completedBlock);
      this.prepareChoicesAndAnswer(this.nextBlock); // 次の問題の選択肢も準備

      // アニメーション開始
      this.isAnimating = true;

      // アニメーション完了後に状態を更新
      setTimeout(() => {
          this.previousBlock = completedBlock; // 左のブロックを更新
          this.currentBlock = this.nextBlock;   // 右のブロック（問題）を更新
          this.nextBlock = null; // アニメーション用はクリア
          this.isAnimating = false;
          this.isSubmitting = false;
          this.startTimer(); // 次の問題のタイマー開始
          console.log("アニメーション完了、次の問題へ");
      }, ANIMATION_DURATION);
    },

    handleIncorrect(isTimeout = false) {
       console.log(isTimeout ? "時間切れ！" : "不正解！");
      this.lives--;
      this.consecutiveCorrect = 0;

      // 不正解エフェクト（例：画面を赤くフラッシュさせるなど）をここに追加可能

      if (this.lives <= 0) {
        this.endGame();
      }
      // 不正解の場合、isSubmitting は submitAnswer で false に戻される
      // 時間切れの場合、startTimer でタイマーが再開される
    },

    // --- ヘルパー関数 ---
     generateRandomHash() {
      return Math.random().toString(36).substring(2, 8);
    },
    generateTimestamp(previousTimestamp) {
      const baseTime = previousTimestamp ? (typeof previousTimestamp === 'string' ? new Date(previousTimestamp) : previousTimestamp).getTime() : Date.now() - 600000;
      const randomMinutes = Math.floor(Math.random() * 5) + 1;
      return new Date(baseTime + randomMinutes * 60000);
    },
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('sv-SE');
    },
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },
  },
  mounted() {
    this.startGame();
  },
   beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
};
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px; /* 少し狭める */
  padding: 15px;
  font-family: sans-serif;
  max-width: 800px; /* 少し広げる */
  margin: auto;
  background-color: #f4f7f6; /* 背景色変更 */
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  overflow: hidden; /* アニメーションのため */
  position: relative; /* ゲームオーバー表示のため */
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 15px; /* 少し調整 */
  background-color: #e9ecef; /* 色変更 */
  border-radius: 5px;
  flex-wrap: wrap;
  gap: 10px;
  z-index: 10;
}
/* status-bar内の要素のスタイルは基本的に維持 */
.timer-container { width: 150px; height: 20px; background-color: #ccc; border-radius: 10px; overflow: hidden; position: relative; }
.timer-bar { height: 100%; background-color: #28a745; transition: width 0.2s linear; border-radius: 10px 0 0 10px; }
.timer-container span { position: absolute; right: 5px; top: 1px; font-size: 12px; color: #333; font-weight: bold; }
.lives { display: flex; gap: 5px; }
.heart { font-size: 20px; color: red; }
.score { font-weight: bold; font-size: 16px; }
.combo { font-weight: bold; font-size: 14px; color: #007bff; }


.game-area {
    display: flex;
    width: 200%; /* アニメーションのために倍の幅 */
    position: relative;
    transition: transform 0.5s ease-in-out; /* アニメーション */
    margin-top: 10px;
}
/* アニメーション中のクラス */
.game-area.animating {
    transform: translateX(-50%); /* 左に50%（1ブロック分）スライド */
}


.block-container.previous-block-container {
    width: 50%; /* 各ブロックエリアは全体の50% */
    padding: 0 10px; /* 左右に少しパディング */
    box-sizing: border-box;
    display: flex; /* 中央揃えのため */
    justify-content:right;
}

.block-container.current-block-container {
    width: 50%; /* 各ブロックエリアは全体の50% */
    padding: 0 10px; /* 左右に少しパディング */
    box-sizing: border-box;
    display: flex; /* 中央揃えのため */
    justify-content:left;
}

.block {
  border: 2px solid #adb5bd; /* 枠線変更 */
  padding: 15px;
  border-radius: 8px;
  background-color: white;
  width: 100%; /* コンテナ幅いっぱいに */
  max-width: 350px; /* 最大幅 */
  min-height: 150px; /* 最小高さ */
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: opacity 0.3s ease-in-out; /* フェード用 */
}
.block h3 { margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #495057; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; }
.block p { margin: 5px 0; font-size: 14px; word-break: break-all; }
.block p span:first-child { font-weight: bold; color: #343a40; margin-right: 5px; }

/* 穴埋め箇所 */
.missing-box {
    display: inline-block;
    width: 25px; /* 少し広げる */
    height: 20px; /* 高さを合わせる */
    background-color: #343a40; /* 黒色 */
    color: white;
    font-weight: bold;
    text-align: center;
    line-height: 20px; /* 垂直中央揃え */
    border-radius: 3px;
    vertical-align: middle; /* 他のテキストと高さを合わせる */
    margin: 0 2px; /* 前後に少しスペース */
}

/* アニメーション中の透明度調整 */
.game-area.animating .previous-block-container {
    opacity: 0; /* 古い左ブロックは消える */
}
.game-area.animating .current-block-container {
    /* transform: translateX(-100%); */ /* スライドは親要素で行う */
    opacity: 1; /* 右から左へ移動 */
}
.next-block-container {
    position: absolute; /* スライドインのため */
    width: 50%;
    left: 100%; /* 初期位置は右外 */
    top: 0;
    padding: 0 10px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    opacity: 1; /* アニメーション中は表示 */
}
.game-area.animating .next-block-container {
    /* transform: translateX(-100%); */ /* 親要素と一緒にスライド */
    opacity: 1;
}


.choices {
  display: flex;
  justify-content: center; /* 中央揃え */
  align-items: center; /* 垂直中央揃え */
  gap: 15px; /* ボタン間のスペース */
  width: 100%;
  margin-top: 15px;
  flex-wrap: wrap; /* 画面幅が狭い場合に折り返す */
}
.choices p {
    margin: 0;
    font-weight: bold;
    flex-basis: 100%; /* 改行させる */
    text-align: center;
    margin-bottom: 5px;
}

.choices button {
  padding: 10px 20px; /* 少し小さく */
  font-size: 14px; /* 少し小さく */
  cursor: pointer;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  transition: background-color 0.2s;
  min-width: 80px; /* 最小幅 */
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.choices button:hover:not(:disabled) { background-color: #0056b3; }
.choices button:disabled { background-color: #ccc; cursor: not-allowed; opacity: 0.7; }

/* ゲームオーバー表示 */
.game-over-container {
    position: absolute; /* game-container基準 */
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(255, 255, 255, 0.95); /* 少し透明度変更 */
    padding: 30px 40px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    text-align: center;
    z-index: 1001;
}
/* 他のスタイルは流用 */
.game-over-container h2 { color: red; margin-top: 0; }
.game-over-container button { margin-top: 20px; width: auto; padding: 10px 25px; }

</style>