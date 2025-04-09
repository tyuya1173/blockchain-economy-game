<template>
  <div class="container"> <div class="content">
      <div class="view-header">
        <h2><i class="fas fa-gem"></i> マイニング</h2>
        <p>チャレンジをクリアして報酬を獲得しましょう</p>
      </div>



      <div class="mining-component">
          <h3><i class="fas fa-laptop-code"></i> マイニングチャレンジ</h3>
          <MiningChallenge
            v-if="currentUserId"
            @submit-answer="handleAnswer"
             />
            <p v-else>チャレンジを開始するにはログインしてください。</p>
      </div>

      <div class="mining-component">
         <h3><i class="fas fa-star"></i> 獲得可能報酬</h3>
        <ChallengeItem />
      </div>

      <div class="mining-component">
         <h3><i class="fas fa-history"></i> マイニング履歴</h3>
         <MiningHistory v-if="currentUserId" :userId="currentUserId" />
        <p v-else>ログイン情報を読み込み中...</p>
      </div>

    </div>
  </div>
</template>

<script>
// 子コンポーネントのインポート
import MiningChallenge from '@/components/mining/MiningChallenge.vue'; // パスは要確認
import ChallengeItem from '@/components/mining/ChallengeItem.vue';    // パスは要確認
import MiningHistory from '@/components/mining/MiningHistory.vue';  // パスは要確認

// Firebase関連のインポート
import { onAuthStateChanged } from '@/firebase/auth';         // Firebase auth/auth.js からインポート想定
import { db } from '@/firebase/index';                     // Firebase 初期化ファイルをインポート
import { collection, doc, addDoc, serverTimestamp, getDocs, query, where, Timestamp } from 'firebase/firestore'; // Firestore関数

// クールダウン時間の設定 (ミリ秒)
const COOLDOWN_DURATION = {
    'クイズチャレンジ': 5 * 60 * 1000, // 5分
    'ナンバーハッシュチャレンジ': 10 * 60 * 1000, // 10分
    'パターンマッチングチャレンジ': 15 * 60 * 1000, // 15分
    'default': 5 * 60 * 1000 // デフォルト5分
};

export default {
  name: 'MiningViewComplete', // コンポーネント名
  components: {
    MiningChallenge,
    ChallengeItem,
    MiningHistory
  },
  data() {
    // リアクティブなデータ
    return {
      currentUserId: null, // ログインユーザーID
      authUnsubscribe: null, // 認証リスナーの解除関数
    };
  },
  
  methods: {
    // --- イベントハンドラ ---

    // MiningChallengeコンポーネントからの回答イベントを処理
    handleAnswer({ answer, challengeType, isSuccess, reward }) {
      console.log(`Answer received in MiningView for ${challengeType}:`, answer, `Success: ${isSuccess}`, `Reward: ${reward}`);

      // ★ 履歴を記録 (クライアントサイドで行う場合) ★
      this.recordMiningAttempt(challengeType, isSuccess, reward);

    },
    // --- データ処理 ---

    // マイニング履歴をFirestoreに記録するメソッド
    async recordMiningAttempt(challengeType, isSuccess, reward) {
        if (!this.currentUserId) {
            console.error("Cannot record history: User not logged in.");
            return;
        }

        const historyData = {
            userId: this.currentUserId,
            challengeType: challengeType || "不明なチャレンジ", // タイプがない場合
            result: isSuccess ? 'success' : 'fail',
            reward: reward || null, // 報酬情報（なければnull）
            timestamp: serverTimestamp() // Firestoreのサーバータイムスタンプ
        };

        try {
            // users/{userId}/miningHistory サブコレクションにドキュメントを追加
            const historyCollectionRef = collection(db, 'users', this.currentUserId, 'miningHistory');
            const docRef = await addDoc(historyCollectionRef, historyData);
            console.log("Mining history recorded with ID: ", docRef.id);
        } catch (e) {
            console.error("Error adding mining history document: ", e);
        }
    },

    

    
      // Firestore Timestamp またはミリ秒タイムスタンプからミリ秒を取得するヘルパー
      getEndTimeInMillis(endTimeData) {
          if (!endTimeData) return null;
          if (endTimeData.toMillis) { // Firestore Timestamp オブジェクトの場合
              return endTimeData.toMillis();
          }
          if (typeof endTimeData === 'number') { // ミリ秒タイムスタンプの場合
              return endTimeData;
          }
          return null; // それ以外は無効
      },

    // --- 認証関連 ---
     // ログイン状態を監視し、ユーザーIDを取得・設定
     setupAuthListener() {
         this.authUnsubscribe = onAuthStateChanged(async (user) => {
          if (user) {
            if (this.currentUserId !== user.uid) { // ユーザーが変わった場合のみ実行
                this.currentUserId = user.uid;
                console.log("MiningView User logged in:", this.currentUserId);
                
            }
          } else {
            this.currentUserId = null;
            this.challengeCooldowns = {}; // ログアウトしたらクールダウン情報クリア
            this.activeCooldown = { type: null, endTime: null };
            console.log("MiningView User logged out.");
            // 必要ならログインページへリダイレクト
            // if (this.$route.name !== 'login') { this.$router.push('/login'); }
          }
        });
     }
  },
  // --- ライフサイクルフック ---
  created() {
      // コンポーネント作成時に認証リスナーを設定
      this.setupAuthListener();
  },
  beforeDestroy() {
    // コンポーネント破棄時に認証リスナーを解除
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      console.log("Auth listener unsubscribed in MiningView.");
    }
    // タイマーもクリア
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
};
</script>

<style scoped>
/* ★★★ DashboardView のスタイルをベースに適用 ★★★ */
/* @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'); */ /* アイコン使用する場合 */

/* --- 全体コンテナとコンテンツエリア --- */
.container { min-height: 100vh; background-color: #f4f6f9; }
.content { flex-grow: 1; padding: 24px 30px; max-width: 1200px; margin: 0 auto; box-sizing: border-box; }

/* --- ヘッダー --- */
.view-header { margin-bottom: 30px; border-bottom: 1px solid #e0e0e0; padding-bottom: 15px; }
.view-header h2 { font-size: 1.8rem; margin-bottom: 8px; color: #333; display: flex; align-items: center; gap: 10px; }
.view-header h2 i { font-size: 0.8em; color: #555; }
.view-header p { font-size: 1rem; color: #666; margin: 0; }

/* --- クールダウン通知ラッパー --- */
.cooldown-notification-wrapper {
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
}
/* クールダウンがない場合のメッセージ */
.no-cooldown-message {
    text-align: center;
    padding: 10px;
    color: #155724;
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 6px;
    margin-bottom: 24px;
    font-size: 14px;
    font-weight: 500;
    display: inline-block;
}
.no-cooldown-message i { margin-right: 5px; }


/* --- 各コンポーネント用ラッパー --- */
.mining-component { background-color: #ffffff; padding: 20px 25px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08); margin-bottom: 24px; border: 1px solid #e0e0e0; }
.mining-component h3 { margin-top: 0; margin-bottom: 18px; font-size: 1.3em; color: #444; border-bottom: 1px solid #eee; padding-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.mining-component h3 i { font-size: 0.9em; color: #777; }

/* レスポンシブ */
@media (max-width: 768px) {
  .content { padding: 20px 15px; }
  .view-header h2 { font-size: 1.6rem; }
  .mining-component h3 { font-size: 1.2em; }
}
</style>