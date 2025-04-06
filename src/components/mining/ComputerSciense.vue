<template>
  <div class="tamper-game-container">
    <h1>改ざんブロックを探せ！</h1>

    <div class="status-bar">
      <div class="info-item">ステージ: {{ currentStage }}</div>
      <div class="info-item timer-container">
        <div class="timer-bar" :style="{ width: `${(timeLeft / maxTime) * 100}%` }"></div>
        <span>{{ timeLeft }}s</span>
      </div>
      <div class="info-item lives">
        <span v-for="n in lives" :key="'life-' + n" class="heart">❤️</span>
      </div>
      <div class="info-item score">Score: {{ score }}</div>
      <div class="info-item combo" v-if="consecutiveCorrect > 1">Combo: x{{ comboMultiplier.toFixed(1) }}</div>
    </div>

    <p class="instruction">
        ブロックチェーンの中に、データが改ざんされたブロックが１つだけ隠されています。<br>
        （そのブロックは、内部的なハッシュ値とデータが一致しません）<br>
        怪しいブロックの下にある「報告する」ボタンを押して指摘してください。<br>
        （注意：正常なブロックを報告するとライフが減少します）
    </p>

    <div class="blockchain-area">
      <div class="blockchain">
        <template v-for="(block, index) in blockchain">
          <div class="chain-line" v-if="index > 0" :key="'line-' + index"></div>
          <div class="block-wrapper" :key="'wrapper-' + index">
            <div class="block">
              <div class="block-header">Block #{{ block.index }}</div>
              <div class="block-content">
                <p><strong>Prev Hash:</strong> {{ block.previousHash }}</p>
                <p><strong>Timestamp:</strong> {{ formatTimestamp(block.timestamp) }}</p>
                <p><strong>Data:</strong> {{ block.data }}</p>
                <p><strong>Nonce:</strong> {{ block.nonce }}</p>
                <p class="data-string-label"><strong>連結データ文字列:</strong></p>
                <p class="data-string">{{ block.blockDataString }}</p>
              </div>
            </div>
            <button
              class="report-block-button"
              @click="submitAnswer(index)"
              :disabled="isGameOver || isSubmitting"
            >
              報告する
            </button>
          </div>
        </template>
      </div>
    </div>

    <div class="message-area">
        <p v-if="message && !isGameOver" :class="messageType">{{ message }}</p>
    </div>

    <div class="hash-calculator">
         <h3>ハッシュ計算ツール (任意)</h3>
        <textarea v-model="manualHashInput" placeholder="ここにブロックの連結データ文字列などを入力"></textarea>
        <button @click="calculateManualHash" :disabled="!manualHashInput">ハッシュ化</button>
        <p v-if="manualHashResult">計算結果: <strong>{{ manualHashResult }}</strong></p>
    </div>

     <div class="game-over-overlay" v-if="isGameOver">
          <div class="game-over-modal">
            <h2>ゲームオーバー！</h2>
            <p>最終スコア: {{ score }}</p>
            <p>到達ステージ: {{ currentStage }}</p>
             <p class="redirect-message">まもなくマイニングページに戻ります...</p>
            </div>
     </div>

  </div>
</template>

<script>
// crypto-jsライブラリからsha256関数をインポートします
// 事前に npm install crypto-js または yarn add crypto-js が必要です
import sha256 from "crypto-js/sha256";

// --- 定数定義 ---
const INITIAL_LIVES = 3;           // 初期ライフ数
const INITIAL_MAX_TIME = 100;      // 初期制限時間（秒）
const BLOCKS_PER_STAGE = 12;     // ステージ1のブロック数
const BLOCKS_INCREMENT = 4;      // ステージごとに増加するブロック数
const TIME_DECREMENT = 1;       // ステージごとに減少する時間（秒）
const REDIRECT_DELAY = 3000;     // ゲームオーバー後、遷移するまでの待機時間(ms)

export default {
  name: "TamperDetectionGameRedirectFull", // コンポーネント名
  data() {
    // コンポーネントのリアクティブな状態を定義
    return {
      blockchain: [],                   // ブロックチェーンデータを格納する配列
      actualTamperedBlockIndex: null, // ★正解ターゲット★ (データが改ざんされたブロックのindex)
      isGameOver: false,              // ゲームオーバー状態か (true/false)
      message: null,                  // プレイヤーに表示するメッセージ
      messageType: 'info',            // メッセージの種類 ('info', 'success', 'error', 'warning')
      score: 0,                       // 現在のスコア
      lives: INITIAL_LIVES,             // 残りライフ
      maxTime: INITIAL_MAX_TIME,        // 現在のステージの最大制限時間
      timeLeft: INITIAL_MAX_TIME,       // 残り時間
      timer: null,                    // setIntervalのID (タイマー制御用)
      currentStage: 1,                // 現在のステージ番号
      isSubmitting: false,              // 判定処理中フラグ (trueの間は操作不可)
      consecutiveCorrect: 0,          // 連続正解数
      manualHashInput: '',            // 手動ハッシュ計算フォームの入力テキスト
      manualHashResult: null,         // 手動ハッシュ計算の結果表示用
    };
  },
  computed: {
    // 算出プロパティ (例: コンボ倍率)
    // 現状のロジックでは直接スコアに影響しないが、定義は残しておく
    comboMultiplier() {
      if (this.consecutiveCorrect >= 10) return 1.5;
      if (this.consecutiveCorrect >= 5) return 1.2;
      return 1.0;
    }
  },
  methods: {
    // --- ゲーム制御メソッド ---

    // ゲームの初期化またはリセット
    initializeGame() {
      console.log("Initializing game...");
      this.currentStage = 1;
      this.score = 0;
      this.lives = INITIAL_LIVES;
      this.maxTime = INITIAL_MAX_TIME;
      this.isGameOver = false;
      this.message = "ゲーム開始！改ざんされたデータを持つブロックを報告！";
      this.messageType = 'info';
      this.isSubmitting = false;
      this.consecutiveCorrect = 0;
      this.manualHashInput = '';     // フォームリセット
      this.manualHashResult = null; // フォームリセット
      if (this.timer) { // 既存のタイマーがあればクリア
        clearInterval(this.timer);
        this.timer = null;
      }
      this.setupStage(); // 最初のステージを設定
    },

    // 現在のステージに応じた設定（ブロック生成、改ざん、タイマー開始）
    setupStage() {
        console.log(`Setting up Stage ${this.currentStage}`);
        // ステージに応じたブロック数と制限時間を計算
        const numBlocks = BLOCKS_PER_STAGE + (this.currentStage - 1) * BLOCKS_INCREMENT;
        this.maxTime = Math.max(10, INITIAL_MAX_TIME - (this.currentStage - 1) * TIME_DECREMENT); // 最低10秒
        // ブロックチェーンを生成
        this.blockchain = this.generateValidBlockchain(numBlocks);
        // 1ブロックを改ざんし、そのインデックスを取得
        this.actualTamperedBlockIndex = this.tamperBlockchainHashMismatch();
        this.timeLeft = this.maxTime; // 時間リセット
        // 検証状態リセットは不要
        this.startTimer(); // タイマースタート
        console.log(`Stage ${this.currentStage} Start! Blocks: ${numBlocks}, Time: ${this.maxTime}s`);
        console.log(`Tampered Block Index (Data/Hash mismatch): ${this.actualTamperedBlockIndex}`); // 正解箇所
    },

    // タイマーを開始またはリセット＆開始
    startTimer() {
      if (this.timer) clearInterval(this.timer); // 既存タイマークリア
      this.timeLeft = this.maxTime; // 時間を最大に戻す
      console.log(`Timer started/reset: ${this.timeLeft}s`);
      this.timer = setInterval(() => {
        // 特定の条件下ではタイマーを進めない
        if (this.isGameOver || this.isSubmitting || this.timeLeft <= 0) {
             return;
        }
        this.timeLeft--; // 時間を1秒減らす
        // 時間切れ判定
        if (this.timeLeft <= 0) {
          console.log("Time's up!");
          this.handleIncorrect(true); // 時間切れ処理
        }
      }, 1000); // 1秒ごとに実行
    },

    // ゲームオーバー処理
    endGame() {
      console.log("Game Over! Redirecting soon...");
      if (this.timer) clearInterval(this.timer); // タイマー停止
      this.timer = null;
      this.isGameOver = true; // ゲームオーバー状態にする
      // message はモーダルで表示するのでここでは設定しない

      // --- ★ 指定時間後に /mining へ遷移 ---
      setTimeout(() => {
          // Vue Routerが利用可能な場合
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

    // 次のステージへ進む処理
    nextStage() {
        console.log(`Stage ${this.currentStage} Cleared!`);
        this.currentStage++; // ステージ番号を増やす
        // スコア加算は handleCorrect で行う
        this.message = `ステージ ${this.currentStage - 1} クリア！ 次のステージへ！`;
        this.messageType = 'success';
        if (this.timer) clearInterval(this.timer); // タイマー停止
        // フォームの内容と状態をリセット
        this.manualHashInput = '';
        this.manualHashResult = null;
        this.isSubmitting = false; // 次のステージでボタンを押せるように

        // 少し待ってから次のステージをセットアップ
        setTimeout(() => {
             if (!this.isGameOver) { // ゲームオーバーでなければ実行
                this.setupStage();
             }
        }, 1500); // 1.5秒待つ
    },

    // スコアに応じて難易度を調整する関数（現在は未使用、将来的な拡張用）
    updateDifficulty() {
        console.log("Difficulty update check (not implemented).");
        // 例: this.maxTime を変更する、改ざんの種類を追加するなど
    },

    // --- ブロックチェーン生成・改ざんメソッド ---

    // 有効なブロックチェーンを指定された長さで生成
    generateValidBlockchain(length) {
      console.log(`Generating blockchain with length: ${length}`);
      const blockchain = [];
      let previousHash = "0".repeat(6); // Genesis Block
      for (let i = 0; i < length; i++) {
        // ブロックの基本データを作成
        const blockData = {
          index: i,
          timestamp: new Date(Date.now() - (length - i) * 60000 + Math.random() * 1000),
          data: `データ ${i}-${Math.random().toString(16).substring(2, 6)}`,
          previousHash: previousHash,
          nonce: Math.floor(Math.random() * 1000),
        };
        // 表示用の連結データ文字列を作成
        const blockDataString = this.createBlockDataString(blockData);
        // このブロックの正しいハッシュを計算
        const hash = this.calculateHashFromString(blockDataString);
        // ブロックチェーン配列に追加
        blockchain.push({
          ...blockData, // スプレッド構文でマージ
          blockDataString: blockDataString, // 表示用データ
          hash: hash, // 計算された正しいハッシュ（内部比較用）
          // validationStatus は不要
        });
        // 次のブロックのためにハッシュを更新
        previousHash = hash;
      }
      return blockchain;
    },

    // ブロックデータから表示/計算用の連結データ文字列を生成
    createBlockDataString(blockData){
         // ハッシュ計算の元になる情報を一意な順序で結合
         return `${blockData.previousHash}${blockData.index}${blockData.timestamp.toISOString()}${blockData.data}${blockData.nonce}`;
    },

    // 文字列からハッシュ値を計算 (sha256利用、なければ簡易版)
    calculateHashFromString(dataString) {
        // crypto-js が利用可能かチェック
        if (typeof sha256 === 'function') {
             // sha256 でハッシュ計算し、先頭6文字を取得
             return sha256(dataString).toString().substring(0, 6);
        } else {
             // crypto-js がない場合の簡易的な代替ハッシュ関数（デモ用）
             console.warn("crypto-js not found, using simple hash.");
             let hash = 0;
             for (let i = 0; i < dataString.length; i++) { const char = dataString.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash |= 0; }
             // 16進数風文字列に変換して返す
             return (hash >>> 0).toString(16).padStart(6, '0').substring(0, 6);
        }
    },

    // ブロックチェーンの一部を改ざん (ハッシュ不一致タイプ)
    tamperBlockchainHashMismatch() {
        if (this.blockchain.length === 0) return -1;
        // 改ざんするブロックのインデックスをランダムに決定
        const tamperedIndex = Math.floor(Math.random() * this.blockchain.length);
        const targetBlock = this.blockchain[tamperedIndex];

        // 1. データを改ざん
        targetBlock.data = `データ - ${Math.random().toString(16).substring(2, 6)}`;
        // 2. 連結データ文字列も更新（表示は変える）
        targetBlock.blockDataString = this.createBlockDataString(targetBlock);
        // 3. targetBlock.hash (内部的なハッシュ値) は変更 *しない*！ -> これでデータとハッシュが不一致になる

        console.log(`Tampering block ${tamperedIndex}. Data changed ('${targetBlock.data}'). Hash property ('${targetBlock.hash}') remains old.`);
        // 改ざんされたブロックのインデックスを返す（これが正解ターゲット）
        return tamperedIndex;
    },

    // --- プレイヤー操作と判定メソッド ---

    // 「報告する」ボタンが押された時の処理
    submitAnswer(index) {
        console.log(`Submit button clicked for block #${index}`);
        // ゲームオーバー中、処理中なら無視
        if (this.isGameOver || this.isSubmitting) return;

        this.isSubmitting = true; // 判定処理開始
        if(this.timer) clearInterval(this.timer); // 判定中はタイマー停止

        // --- 正誤判定 ---
        // 報告されたインデックスが、実際に改ざんされたブロックのインデックスか？
        const isCorrect = (index === this.actualTamperedBlockIndex);

        // --- 補助的な整合性チェック（メッセージ用）---
        let isValidLink = true; // Genesisブロック用初期値
        let isSelfConsistent = (this.calculateHashFromString(this.blockchain[index].blockDataString) === this.blockchain[index].hash);
        if (index > 0) { // Genesis以外はリンクもチェック
            const currentBlock = this.blockchain[index];
            const previousBlock = this.blockchain[index - 1];
            const recalculatedPreviousHash = this.calculateHashFromString(previousBlock.blockDataString);
            isValidLink = (currentBlock.previousHash === recalculatedPreviousHash);
        }

        // 判定結果に基づいて処理を分岐（演出のため少し待つ）
         setTimeout(() => {
            if (isCorrect) {
                this.handleCorrect(); // 正解処理
                // isSubmitting は nextStage で false になる
            } else {
                // 不正解処理 (リンクが正常だったか、自身の整合性が取れていたかの情報も渡す)
                this.handleIncorrect(false, isValidLink, isSelfConsistent);
                // isSubmitting は handleIncorrect 内でリセットされる（ライフがあれば）
            }
        }, 500); // 0.5秒の演出時間
    },

    // 正解時の処理
    handleCorrect() {
        console.log("Correct answer!");
        this.score += 150 * this.currentStage + this.timeLeft * 10; // スコア加算
        this.consecutiveCorrect++;
        this.message = "正解！改ざんされたブロックを発見しました！";
        this.messageType = 'success';
        // 正解エフェクト
        this.nextStage(); // 次のステージへ
    },

    // 不正解または時間切れ時の処理
    handleIncorrect(isTimeout = false, isValidLink = true, isSelfConsistent = true) {
        if (this.isGameOver) return; // ゲームオーバーなら処理しない
        console.log(isTimeout ? "Incorrect: Time's up!" : `Incorrect: Reported block was not the tampered one.`);

        this.lives--; // ライフ減少
        this.consecutiveCorrect = 0; // 連続正解リセット

        // メッセージ設定
        if(isTimeout){
             this.message = "時間切れです！";
             this.messageType = 'error';
        } else if (!isSelfConsistent) { // 指摘したブロック自身のハッシュが不整合だった -> 正解のはず
             // このケースは通常 submitAnswer で isCorrect = true になるはず
             console.error("Logic error: Incorrectly handled a potentially correct answer based on self-consistency.");
             this.message = "エラーが発生しました。不正解として扱われます。";
             this.messageType = 'error';
        } else if (!isValidLink) { // 指摘したブロックのリンクが切れていた（今回のルールでは不正解）
             this.message = "そこはリンク切れ箇所ですが、データ改ざん箇所ではありません！不正解！";
             this.messageType = 'error';
        } else { // 正常なブロックを報告した場合
             this.message = "正常なブロックです！不正解！";
             this.messageType = 'error';
        }
        // 不正解エフェクト

        // 状態リセット
        this.isSubmitting = false; // 判定処理完了

        // ライフチェックとタイマー再開/ゲームオーバー
        if (this.lives <= 0) {
            this.endGame(); // ゲームオーバー
        } else {
            console.log("Incorrect/Timeout: Resetting timer.");
            this.startTimer(); // ★★★ ライフがあれば必ずタイマーリセット＆再開 ★★★
        }
    },

    // --- ハッシュ計算フォーム用メソッド ---
    // 手動で入力されたテキストのハッシュを計算
    calculateManualHash() {
        if (!this.manualHashInput) {
            this.manualHashResult = '入力がありません';
            return;
        }
        try {
            // calculateHashFromString を使って計算
            this.manualHashResult = this.calculateHashFromString(this.manualHashInput);
        } catch (error) {
            console.error("Manual hash calculation error:", error);
            this.manualHashResult = '計算エラー';
        }
    },

    // --- ヘルパー関数 ---
    // タイムスタンプを指定フォーマットの文字列に変換
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
        if (isNaN(date.getTime())) return 'Invalid Date';
        // 日本のロケールで、24時間表記、秒まで表示
        return date.toLocaleString('ja-JP', {
             year: 'numeric', month: '2-digit', day: '2-digit',
             hour: '2-digit', minute: '2-digit', second: '2-digit',
             hour12: false
        });
    },
    // shuffleArray は現在未使用
    // shuffleArray(array) { ... }
  },
  // コンポーネントがマウントされた時にゲームを開始
  mounted() {
    // crypto-js の存在確認
    if (typeof sha256 !== 'function') {
         console.error("sha256 function (from crypto-js) is not available! Make sure crypto-js is installed and imported correctly.");
         this.message = "エラー: 暗号化ライブラリが見つかりません。";
         this.messageType = "error";
         this.isGameOver = true; // ゲームを進行不可にする
         return;
    }
    console.log("Component mounted, starting game.");
    this.initializeGame();
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
.tamper-game-container { display: flex; flex-direction: column; align-items: center; gap: 15px; padding: 20px; font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; max-width: 100%; margin: auto; background-color: #e9eff1; border-radius: 12px; box-shadow: 0 6px 12px rgba(0,0,0,0.1); position: relative; box-sizing: border-box; }
h1 { color: #2c3e50; margin-bottom: 5px; font-size: 1.8em; text-align: center; }
.instruction { font-size: 14px; color: #555; margin-bottom: 15px; text-align: center; line-height: 1.6; }
/* --- ステータスバー --- */
.status-bar { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 15px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); flex-wrap: wrap; gap: 10px 20px; margin-bottom: 10px; }
.info-item { font-weight: bold; font-size: 14px; color: #333; padding: 5px 10px; background-color: #f8f9fa; border-radius: 4px; white-space: nowrap; }
.timer-container { width: 120px; height: 22px; background-color: #e9ecef; border-radius: 11px; overflow: hidden; position: relative; padding: 0; }
.timer-bar { height: 100%; background: linear-gradient(to right, #28a745, #90ee90); transition: width 0.5s linear; border-radius: 11px 0 0 11px; }
.timer-container span { position: absolute; right: 8px; top: 2px; font-size: 12px; color: #333; font-weight: bold; }
.lives { display: flex; gap: 4px; background: none; padding: 0; }
.heart { font-size: 20px; color: #e44d26; animation: heartbeat 1.5s ease-in-out infinite; }
@keyframes heartbeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
.score { font-size: 16px; background: none; padding: 0; }
.combo { font-size: 14px; color: #007bff; background: none; padding: 0; }

/* --- ブロックチェーン表示エリア --- */
.blockchain-area { width: 100%; overflow-x: auto; overflow-y: hidden; padding: 15px 0 25px 0; background-color: #d4dde1; border: 1px solid #c8d0d4; border-radius: 8px; scrollbar-width: thin; scrollbar-color: #888 #ddd; }
.blockchain-area::-webkit-scrollbar { height: 10px; }
.blockchain-area::-webkit-scrollbar-track { background: #ddd; border-radius: 5px;}
.blockchain-area::-webkit-scrollbar-thumb { background-color: #888; border-radius: 5px; border: 2px solid #ddd; }
.blockchain { display: flex; align-items: flex-start; padding: 0 25px; width: max-content; min-width: 100%; }

/* --- ブロックラッパー (ブロック + ボタン) --- */
.block-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; }

/* --- ブロック間の線 --- */
.chain-line { height: 5px; width: 35px; background-color: #78909c; margin: 60px 6px 0 6px; border-radius: 2px; flex-shrink: 0; }

/* --- ブロック本体 --- */
.block { padding: 12px 15px; border: 2px solid #90a4ae; background-color: #ffffff; width: 260px; text-align: left; cursor: text; user-select: text; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.08); position: relative; flex-shrink: 0; }

/* --- ブロック内部 & 連結データ --- */
.block-header { font-weight: bold; font-size: 15px; color: #1a237e; border-bottom: 1px solid #cfd8dc; padding-bottom: 8px; margin-bottom: 8px; }
.block-content p { margin: 5px 0; font-size: 12px; color: #37474f; word-break: break-all; line-height: 1.5; }
.block-content p strong { font-weight: 600; color: #1c313a; margin-right: 5px; display: inline-block; min-width: 70px; vertical-align: top; }
.data-string-label strong { min-width: auto; }
.data-string { font-family: 'Courier New', Courier, monospace; font-size: 10px; background-color: #f5f5f5; padding: 5px; border-radius: 4px; margin-top: 2px !important; word-break: break-all; line-height: 1.3; border: 1px solid #eee; max-height: 60px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #ccc #eee; cursor: text; }
.data-string::-webkit-scrollbar { width: 5px; }
.data-string::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 3px; }

/* --- 各ブロックの報告ボタン --- */
.report-block-button { padding: 6px 12px; font-size: 13px; font-weight: bold; color: white; background-color: #6c757d; border: none; border-radius: 5px; cursor: pointer; transition: background-color 0.2s ease, transform 0.1s ease; margin-top: 5px; width: 80%; max-width: 150px; }
.report-block-button:hover:not(:disabled) { background-color: #ef5350; transform: scale(1.05); }
.report-block-button:active:not(:disabled) { transform: scale(0.98); }
.report-block-button:disabled { background-color: #ccc !important; color: #666 !important; cursor: not-allowed !important; opacity: 0.7 !important; }

/* --- アクションエリア --- */
.action-area { margin-top: 15px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.message-area { min-height: 30px; width: 100%; text-align: center; }
.message-area p { font-weight: bold; padding: 10px 20px; border-radius: 6px; display: inline-block; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: background-color 0.3s ease, color 0.3s ease; animation: messageFadeIn 0.4s ease; }
@keyframes messageFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.message-area .info { background-color: #e0f7fa; color: #00796b; }
.message-area .success { background-color: #e8f5e9; color: #2e7d32; }
.message-area .error { background-color: #ffebee; color: #c62828; }
.message-area .warning { background-color: #fffde7; color: #f57f17; }

/* --- ハッシュ計算フォーム --- */
.hash-calculator { margin-top: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 8px; background-color: #f8f9fa; width: 95%; max-width: 600px; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; }
.hash-calculator h3 { margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #444; text-align: center; }
.hash-calculator textarea { width: 100%; min-height: 60px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 12px; resize: vertical; box-sizing: border-box; }
.hash-calculator button { padding: 8px 15px; font-size: 14px; background-color: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; transition: background-color 0.2s; align-self: center; }
.hash-calculator button:hover:not(:disabled) { background-color: #5a6268; }
.hash-calculator button:disabled { background-color: #adb5bd; cursor: not-allowed; }
.hash-calculator p { margin-top: 5px; font-size: 14px; font-weight: bold; font-family: 'Courier New', Courier, monospace; word-break: break-all; text-align: center; min-height: 1em; }

/* --- ゲームオーバー表示 --- */
.game-over-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.75); display: flex; justify-content: center; align-items: center; z-index: 1000; border-radius: 12px; opacity: 0; animation: fadeInOverlay 0.5s ease forwards; }
@keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
.game-over-modal { background-color: white; padding: 35px 45px; border-radius: 10px; box-shadow: 0 8px 20px rgba(0,0,0,0.3); text-align: center; transform: scale(0.8); animation: zoomInModal 0.4s 0.2s ease forwards; }
@keyframes zoomInModal { from { opacity:0; transform: scale(0.8); } to { opacity:1; transform: scale(1); } }
.game-over-modal h2 { color: #d32f2f; margin-top: 0; font-size: 1.8em; }
.game-over-modal p { font-size: 1.1em; margin: 10px 0 15px; }
.redirect-message { font-size: 1em; color: #666; margin-top: 20px; font-style: italic; }

</style>