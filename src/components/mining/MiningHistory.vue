<template>
  <div class="mining-history">
    <div v-if="loading" class="loading-indicator">
        <p>履歴を読み込み中...</p>
    </div>
    <div v-else-if="history.length === 0" class="no-history">
      <p>挑戦履歴はありません。</p>
    </div>
    <ul v-else class="history-list">
        <li v-for="item in history" :key="item.id" class="history-item" :class="item.result">
            <span class="history-timestamp">{{ formatDate(item.timestamp) }}</span>
            <span class="history-challenge">{{ item.challengeType || '不明なチャレンジ' }}</span>
            <span class="history-result" :class="item.result">{{ formatResult(item.result) }}</span>
            <span class="history-reward" :class="item.result">{{ formatReward(item.reward, item.result) }}</span>
        </li>
    </ul>
  </div>
</template>

<script>
// Firebase Firestoreの関数をインポート
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/index'; // Firebase初期化ファイルをインポート

export default {
  name: 'MiningHistory',
  props: {
      userId: { type: String, required: true }
  },
  data() {
    return {
      history: [], // マイニング履歴データ
      loading: true, // 読み込み状態
    };
  },
  methods: {
    // Firestoreから履歴を取得 (変更なし)
    async fetchHistory() {
        if (!this.userId) { /* ... */ return; }
        console.log(`Workspaceing mining history for user: ${this.userId}`);
        this.loading = true;
        const historyRef = collection(db, 'users', this.userId, 'miningHistory');
        const historyQuery = query(
            historyRef,
            orderBy('timestamp', 'desc'),
            limit(20)
        );
        try {
            const querySnapshot = await getDocs(historyQuery);
            const fetchedHistory = [];
            querySnapshot.forEach((doc) => {
                // timestampがnullでないか確認
                const data = doc.data();
                if (data.timestamp) {
                    fetchedHistory.push({ id: doc.id, ...data });
                } else {
                    console.warn("History item missing timestamp:", doc.id);
                }
            });
            // 念のため、timestampで再度ソート
            this.history = fetchedHistory.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
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
    // ★ 結果表示フォーマット ★
    formatResult(result) {
        if (result === 'success') return '成功';
        if (result === 'fail') return '失敗';
        if (result === 'timeout') return '時間切れ';
        return result || '不明'; // その他の場合
    },
    // ★ 報酬表示フォーマット (クーゼリウム量表示) ★
    formatReward(reward, result) {
        // 成功時のみ報酬を表示、失敗・時間切れ時は「-」
        if (result !== 'success') {
            return '-';
        }
        // rewardが数値の場合、クーゼリウムとして表示
        if (typeof reward === 'number' && reward > 0) {
             return `+${reward.toLocaleString()} KUZE`; // 3桁区切り
        }
        // rewardが0、null、undefined、または数値でない場合は「報酬なし」
        return '報酬なし';
    }
  },
  watch: {
      // userIdが変わったら履歴を再取得 (変更なし)
      userId(newUserId, oldUserId) {
          if (newUserId && newUserId !== oldUserId) {
              this.fetchHistory();
          }
      }
  },
  created() {
      // コンポーネント作成時に履歴取得 (変更なし)
      this.fetchHistory();
  }
};
</script>

<style scoped>
.mining-history { padding: 10px 0; }
.loading-indicator p, .no-history p { text-align: center; color: #888; padding: 20px; }
.history-list { list-style: none; padding: 0; margin: 0; max-height: 250px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #ccc #eee; }
.history-list::-webkit-scrollbar { width: 6px; }
.history-list::-webkit-scrollbar-track { background: #eee; border-radius: 3px;}
.history-list::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 3px;}

.history-item {
  display: grid;
  /* ★ 列のテンプレートを調整 (Timestamp, Challenge, Result, Reward) ★ */
  grid-template-columns: 1.2fr 1.5fr 0.8fr 1fr;
  gap: 10px;
  align-items: center;
  padding: 10px 8px; /* パディング調整 */
  border-bottom: 1px solid #eee;
  font-size: 13px;
  color: #555;
  transition: background-color 0.2s ease;
}
.history-item:last-child { border-bottom: none; }
.history-item:hover { background-color: #f9f9f9; }

.history-timestamp { font-size: 12px; color: #777; white-space: nowrap; }
.history-challenge { font-weight: 600; color: #444; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-result { font-weight: bold; text-align: center; padding: 3px 8px; /* パディング調整 */ border-radius: 4px; font-size: 12px; }
.history-result.success { color: #155724; background-color: #d4edda; }
.history-result.fail, .history-result.timeout { color: #721c24; background-color: #f8d7da; } /* timeoutもfailと同じ表示 */
/* ★ 報酬表示スタイル調整 ★ */
.history-reward {
  text-align: right;
  font-weight: 600; /* 強調 */
  color: #2e7d32;   /* 成功時の基本色（緑系） */
  font-family: monospace; /* 数字が見やすいように */
  font-size: 13px; /* 少し調整 */
}
.history-item.fail .history-reward, .history-item.timeout .history-reward {
    color: #aaa; /* 失敗・時間切れ時はグレーアウト */
    font-weight: normal;
    /* text-decoration: line-through; */ /* 取り消し線はやめる */
}
</style>