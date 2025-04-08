<template>
  <div class="mining-history">
    <div v-if="loading" class="loading-indicator">
        <p>履歴を読み込み中...</p>
    </div>
    <div v-else-if="history.length === 0" class="no-history">
      <p>挑戦履歴はありません。</p>
    </div>
    <ul v-else class="history-list">
        <li v-for="item in history" :key="item.id" class="history-item">
            <span class="history-timestamp">{{ formatDate(item.timestamp) }}</span>
            <span class="history-challenge">{{ getChallengeName(item.challengeId) }}</span>
            <span class="history-result success">{{ formatResult() }}</span> <span class="history-reward ">{{ formatReward(item.reward) }}</span>
        </li>
    </ul>
  </div>
</template>

<script>
// Firebase Firestoreの関数をインポート
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/index'; // Firebase初期化ファイルをインポート
import { getAuth } from 'firebase/auth'; // ★ ユーザー情報を取得する関数をインポート

export default {
  name: 'MiningHistory',
  data() {
    return {
      history: [], // マイニング履歴データ
      loading: true, // 読み込み状態
    };
  },
  // ★ computed から mapState を削除
  // computed: { ... },
  methods: {
    // Firestoreから履歴を取得
    async fetchHistory() {
      this.loading = true;
      const auth = getAuth();
      const user = auth.currentUser;
      // ★ user オブジェクトと uid を安全に取得
      const userId = user?.uid;

      // ★ userId が取得できない場合は処理を中断
      if (!userId) {
          console.warn("MiningHistory: User not logged in or auth state not ready yet.");
          this.history = []; // 履歴を空にする
          this.loading = false;
          return;
      }

      console.log(`Workspaceing mining history for user: ${userId}`); // ★ 取得した userId を使用
      console.log(user); // ★ 取得した userId を使用
      try {
          // ★ users/{userId}/miningHistory への参照 (取得した userId を使用)
          const historyRef = collection(db, 'users', userId, 'miningHistory');
          console.log("History reference:", historyRef); // ★ 参照をログに出力
          const historyQuery = query(
              historyRef,
              orderBy('timestamp', 'desc'),
              limit(20)
          );
          console.log("History query:", historyQuery); // ★ クエリをログに出力
          const querySnapshot = await getDocs(historyQuery);
          console.log("Query snapshot:", querySnapshot); // ★ クエリスナップショットをログに出力
          const fetchedHistory = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.timestamp && data.reward !== undefined && data.challengeId !== undefined) {
                  fetchedHistory.push({ id: doc.id, ...data });
              } else {
                  console.warn("History item missing required fields:", doc.id, data);
              }
          });
          this.history = fetchedHistory;
          console.log("Mining history fetched:", this.history);
      } catch (error) {
          console.error("Error fetching mining history:", error);
          this.history = [];
      } finally {
          this.loading = false;
      }
    },
    // タイムスタンプフォーマット (変更なし)
    formatDate(timestamp) {
      if (!timestamp) return '';
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp || Date.now());
      if (isNaN(date.getTime())) return '無効な日付';
      return date.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
    },
    // 結果表示フォーマット (常に成功 - 変更なし)
    formatResult() {
        return '成功';
    },
    // 報酬表示フォーマット (result引数なし - 変更なし)
    formatReward(reward) {
        if (typeof reward === 'number' && reward > 0) {
            return `+${reward.toLocaleString()} クーゼリアム`;
        }
        return '-';
    },
    // チャレンジIDから表示名を返す (変更なし)
    getChallengeName(challengeId) {
        switch (challengeId) {
            case 'prime-factorization':
                return 'トランザクション・マッチャー';
            case 'number-hash-challenge':
                return 'クイズチャレンジ';
            case 'computer-sciense':
                return '改ざんブロック探索';
            default:
                return challengeId || '不明なチャレンジ';
        }
    }
  },
  // ★ watch を削除 (getAuth().currentUser はリアクティブでないため)
  // watch: { ... },
  created() {
      // ★ コンポーネント作成時に履歴取得
      console.log("MiningHistory component created. Fetching history...");
      this.fetchHistory();
  }
};
</script>

<style scoped>
/* スタイルは変更なし */
.mining-history { padding: 10px 0; }
.loading-indicator p, .no-history p { text-align: center; color: #888; padding: 20px; }
.history-list { list-style: none; padding: 0; margin: 0; max-height: 250px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #ccc #eee; }

.history-list::-webkit-scrollbar { width: 6px; }
.history-list::-webkit-scrollbar-track { background: #eee; border-radius: 3px;}
.history-list::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 3px;}

.history-item {
  display: grid;
  grid-template-columns: 1.2fr 1.5fr 0.8fr 1fr;
  gap: 10px;
  align-items: center;
  padding: 10px 8px;
  border-bottom: 1px solid #eee;
  font-size: 13px;
  color: #555;
  transition: background-color 0.2s ease;
}
.history-item:last-child { border-bottom: none; }
.history-item:hover { background-color: #f9f9f9; }

.history-timestamp { font-size: 12px; color: #777; white-space: nowrap; }
.history-challenge { font-weight: 600; color: #444; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-result{
    font-weight: bold;
    text-align: center;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #155724;
    background-color: #d4edda;
}
.history-reward{
  text-align: right;
  font-weight: 600;
  color: #2e7d32;
  font-family: monospace;
  font-size: 13px;
}
</style>