<template>
  <div>
    <computer-sciense @game-completed="handleGameCompletion"/>
  </div>
</template>

<script>
import ComputerSciense from '@/components/mining/ComputerSciense.vue';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase'; // Firestoreインスタンス
import { getAuth } from 'firebase/auth'; // ユーザー情報を取得する関数
export default {
  name: 'ComputerScienseView',
  components: {
    ComputerSciense,
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

      // 1. ユーザーIDを確認 (より安全なチェック)
      const auth = getAuth();
      const user = auth.currentUser;
      const userId = user.uid; // オプショナルチェイニングで user が null でもエラーを防ぐ
      
      if (!userId) {
        this.message = 'エラー: ユーザーがログインしていません。';
        return;
      }


      // 2. 報酬額を計算 (★ メソッド呼び出しを修正)
      const rewardAmount = this.calculateNumberHashReward(gameResult);

      if (rewardAmount <= 0) {
         this.message = '報酬を獲得できませんでした。';
         setTimeout(() => { this.message = ''; }, 3000);
         return;
      }

      // 3. Firestoreに書き込むデータを準備
      const challengeType = 'computer-sciense'; // ★ このゲームのID (確認済み)
      const submissionData = {
        userId: userId,
        reward: rewardAmount,
        challengeType: challengeType,
        result: gameResult, // ★ ゲーム結果も保存するとデバッグに役立つ (任意)
        completedAt: serverTimestamp(), // ★ タイムスタンプを追加 (Cloud Functionで利用する場合)
      };

      try {
        // 4. Firestoreに書き込み (Cloud Functionsをトリガー)
        const submissionsColRef = collection(db, 'miningChallenges', challengeType, 'submissions');
        // console.log("Collection ref:", submissionsColRef); // 通常は不要
        const docRef = await addDoc(submissionsColRef, submissionData);

        this.message = `クリア！ ${rewardAmount} Kuzellium を獲得しました！`;

        // setTimeout(() => { this.$router.push('/mining'); }, 2000);

      } catch (error) {
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
      let reward = 0;
      // 例: gameResult.score が存在し、数値の場合
      if (gameResult && typeof gameResult.score === 'number') {
          reward = Math.floor(gameResult.score * 0.1); // 例: スコアの10%
      } else {
          reward = 10; // 固定報酬 (デフォルト値)
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