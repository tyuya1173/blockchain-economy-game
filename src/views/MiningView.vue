<template>
  <div class="container">
    <div class="content">
      <div class="view-header">
        <h2> マイニング</h2> <p>チャレンジをクリアして報酬を獲得しましょう</p> </div>

      <div v-if="cooldown" class="cooldown-notification"> <i class="fas fa-stopwatch"></i> <div>
            <strong>クールダウン中</strong>
            <ChallengeTimer /> </div>
      </div>

      <div class="mining-component"> <h3>マイニングチャレンジ</h3>
          <MiningChallenge @submit-answer="handleAnswer" />
      </div>

      <div class="mining-component"> <h3>チャレンジアイテム</h3>
        <ChallengeItem />
      </div>

      <div class="mining-component"> <h3>マイニング履歴</h3>
        <MiningHistory />
      </div>

    </div>
  </div>
</template>

<script>


import MiningChallenge from '@/components/mining/MiningChallenge.vue';
import ChallengeTimer from '@/components/mining/ChallengeTimer.vue';
import ChallengeItem from '@/components/mining/ChallengeItem.vue';
import MiningHistory from '@/components/mining/MiningHistory.vue';
// 他のインポート (Firebaseなど) は必要に応じてそのまま維持
// import { onAuthStateChanged } from '@/firebase/auth';
// import { getUser, getUserAssets } from '@/firebase/firestore';
// import { db } from '@/firebase/index';
// import { collection, doc, getDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';


export default {
  name: 'MiningViewDashboardStyle', // 名前変更
  components: {
    MiningChallenge,
    ChallengeTimer,
    ChallengeItem,
    MiningHistory
  },
  data() {
    return {
      cooldown: false, // クールダウン状態
      // 他のデータ (ユーザー情報、資産など) が必要であればここに追加
    };
  },
  // computed は必要なら追加
  methods: {
    // MiningChallenge からのイベントを処理
    handleAnswer({ answer, challengeType, isSuccess }) { // isSuccessを受け取る想定
      console.log(`Answer received in MiningView for ${challengeType}:`, answer, `Success: ${isSuccess}`);

      // チャレンジに成功した場合にクールダウンを開始
      if(isSuccess) {
          this.cooldown = true;
          console.log("Cooldown started.");
          // ChallengeTimer コンポーネントが終了時にイベントを emit して
          // cooldown を false に戻す必要がある
          // 例: @cooldown-finished="onCooldownComplete" を ChallengeTimer に追加
      } else {
          // 失敗した場合の処理 (例: メッセージ表示など)
          console.log("Challenge failed.");
      }
    },
    // クールダウン終了時の処理 (ChallengeTimerから呼び出される想定)
    onCooldownComplete() {
       this.cooldown = false;
       console.log("Cooldown finished.");
    }
    // created や beforeDestroy でのデータ取得やリスナー解除は必要に応じて実装
  }
};
</script>

<style scoped>
/* ★★★ DashboardView のスタイルを適用・調整 ★★★ */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'); /* Font Awesome */

/* --- 全体コンテナとコンテンツエリア --- */
.container {
  display: flex; /* サイドバーなどを考慮する場合 */
  min-height: 100vh;
  background-color: #f4f6f9; /* 明るい背景色 */
}

.content {
  flex-grow: 1;
  padding: 24px 30px; /* パディング */
  overflow-y: auto; /* コンテンツが多い場合にスクロール */
}

/* --- ヘッダー --- */
.view-header {
  margin-bottom: 30px; /* 下マージン */
  border-bottom: 1px solid #e0e0e0; /* 下線 */
  padding-bottom: 15px;
}
.view-header h2 {
  font-size: 1.8rem; /* サイズ調整 */
  margin-bottom: 8px;
  color: #333; /* 文字色 */
  display: flex;
  align-items: center;
  gap: 10px;
}
.view-header h2 i {
    font-size: 0.8em;
    color: #555;
}
.view-header p {
  font-size: 1rem;
  color: #666; /* サブテキストの色 */
  margin: 0;
}

/* --- ★クールダウン通知スタイル (イベント通知風)★ --- */
.cooldown-notification {
  background-color: #e3f2fd; /* 水色系の背景 */
  color: #0d47a1; /* 濃い青系の文字 */
  border: 1px solid #bbdefb; /* 薄い青系の枠線 */
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 15px;
}
.cooldown-notification i {
  font-size: 1.6rem; /* アイコンサイズ */
  opacity: 0.8;
}
.cooldown-notification strong {
  font-size: 1.1em;
  display: block;
  margin-bottom: 4px;
}
/* ChallengeTimerコンポーネント自体のスタイルは別途定義が必要 */
.cooldown-notification >>> .timer-display { /* 例: 子コンポーネント内のクラス */
    font-weight: bold;
    color: #1565c0;
}

/* --- ★各コンポーネント用ラッパー★ --- */
.mining-component {
    background-color: #ffffff; /* 白背景のカード */
    padding: 20px 25px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08); /* 軽い影 */
    margin-bottom: 24px; /* 下マージン */
    border: 1px solid #e0e0e0; /* 枠線 */
}
.mining-component h3 {
    margin-top: 0;
    margin-bottom: 18px;
    font-size: 1.3em; /* 見出しサイズ */
    color: #444;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.mining-component h3 i {
    font-size: 0.9em;
    color: #777;
}


/* --- レスポンシブデザイン --- */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
  .content {
     padding: 20px 15px;
  }
   .view-header h2 {
     font-size: 1.6rem;
  }
   .mining-component h3 {
     font-size: 1.2em;
   }
}
</style>