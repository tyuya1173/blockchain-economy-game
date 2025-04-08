<template>
  <div>
    <number-hash-component @game-completed="handleGameCompletion"/>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script>
import NumberHashComponent from '@/components/mining/NumberHashChallenge.vue';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // serverTimestamp を再度インポート
import { db } from '@/firebase'; // Firestoreインスタンス
import { getAuth } from 'firebase/auth'; // ユーザー情報を取得する関数

export default {
  name: 'NumberHashChallengeView',
  components: {
    NumberHashComponent, // コンポーネント名と合わせる
  },
  data() {
    return {
      message: '', // ユーザーへのフィードバック用
    };
  },
  methods: {
    /**
     * 子コンポーネントから game-completed イベントが発行されたときに実行されるハンドラ
     * @param {object} gameResult - 子コンポーネントから渡されるゲーム結果データ (例: { score: 100 })
     */
    async handleGameCompletion(gameResult) {
      this.message = '結果を送信中...'; // 処理開始をユーザーに通知
      console.log('[NumberHashChallengeView] handleGameCompletion triggered with result:', gameResult); // ★ ログ追加

      // 1. ユーザーIDを確認 (より安全なチェック)
      const auth = getAuth();
      const user = auth.currentUser;
      const userId = user.uid; // オプショナルチェイニングで user が null でもエラーを防ぐ
      
      if (!userId) {
        this.message = 'エラー: ユーザーがログインしていません。';
        console.error('[NumberHashChallengeView] User not logged in or UID not found.');
        // console.log('rewardAmount', rewardAmount); // rewardAmount はまだ定義されていないため削除
        return;
      }
      console.log('[NumberHashChallengeView] User ID:', userId); // ★ ログ追加

      // 2. 報酬額を計算 (★ メソッド呼び出しを修正)
      const rewardAmount = this.calculateNumberHashReward(gameResult);
      console.log('[NumberHashChallengeView] Calculated reward amount:', rewardAmount); // ★ ログ追加

      if (rewardAmount <= 0) {
         this.message = '報酬を獲得できませんでした。';
         console.log('[NumberHashChallengeView] No reward to grant based on result:', gameResult);
         setTimeout(() => { this.message = ''; }, 3000);
         return;
      }

      // 3. Firestoreに書き込むデータを準備
      const challengeType = 'number-hash-challenge'; // ★ このゲームのID (確認済み)
      const submissionData = {
        userId: userId,
        reward: rewardAmount,
        challengeType: challengeType,
        result: gameResult, // ★ ゲーム結果も保存するとデバッグに役立つ (任意)
        completedAt: serverTimestamp(), // ★ タイムスタンプを追加 (Cloud Functionで利用する場合)
      };

      try {
        // 4. Firestoreに書き込み (Cloud Functionsをトリガー)
        console.log("[NumberHashChallengeView] Submitting data:", submissionData); // ★ ログメッセージ修正
        const submissionsColRef = collection(db, 'miningChallenges', challengeType, 'submissions');
        // console.log("Collection ref:", submissionsColRef); // 通常は不要
        const docRef = await addDoc(submissionsColRef, submissionData);

        console.log(`[NumberHashChallengeView] Submission successful with ID: ${docRef.id}. User: ${userId}, Reward: ${rewardAmount}`); // ★ ログメッセージ修正
        this.message = `クリア！ ${rewardAmount} Kuzellium を獲得しました！`;

        // setTimeout(() => { this.$router.push('/mining'); }, 2000);

      } catch (error) {
        console.error("[NumberHashChallengeView] Error submitting challenge result:", error); // ★ ログメッセージ修正
        this.message = 'エラーが発生し、結果を送信できませんでした。';
      }
    },

    /**
     * ★ Number Hash Challenge ゲームの結果に基づいて報酬を計算する ★
     * @param {object} gameResult - ゲーム結果 (score などを含む想定)
     * @returns {number} - 計算された報酬額
     */
    calculateNumberHashReward(gameResult) { // ★ メソッド名を変更
      // --- ★★★ ここに Number Hash Challenge 用の報酬計算ロジックを実装 ★★★ ---
      // 子コンポーネントから渡される gameResult の内容に合わせてください
      console.log("[NumberHashChallengeView] Calculating reward for Number Hash result:", gameResult); // ★ ログメッセージ修正
      let reward = 0;
      // 例: gameResult.score が存在し、数値の場合
      if (gameResult && typeof gameResult.score === 'number') {
          reward = Math.floor(gameResult.score * 0.1); // 例: スコアの10%
          console.log(`[NumberHashChallengeView] Reward calculated from score (${gameResult.score}): ${reward}`);
      } else {
          reward = 10; // 固定報酬 (デフォルト値)
          console.log(`[NumberHashChallengeView] Score not found in gameResult or not a number. Assigning default reward: ${reward}`);
      }
      // ------------------------------------------------------------------
      return Math.max(0, reward); // 報酬がマイナスにならないように
    }
  }
};
</script>

<style scoped>
/* スタイルをここに追加 */
p {
  margin-top: 1em;
  font-weight: bold;
}
</style>