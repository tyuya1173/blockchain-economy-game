<template>
  <div>
    <PrimeFactorization @game-completed="handleGameCompletion"/>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script>
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase'; // Firestoreインスタンス
import PrimeFactorization from '@/components/mining/PrimeFactorization.vue';
import { getAuth } from 'firebase/auth'; // ユーザー情報を取得する関数

export default {
  name: 'PrimeFactorizationView',
  components: {
    PrimeFactorization,
  },
  data() {
    return {
      message: '', // ユーザーへのフィードバック用
    };
  },
  
  methods: {
    /**
     * 子コンポーネントから game-completed イベントが発行されたときに実行されるハンドラ
     * @param {object} gameResult - 子コンポーネントから渡されるゲーム結果データ (例: { score: 100, time: 30 })
     */
    async handleGameCompletion(gameResult) {
      this.message = '結果を送信中...'; // 処理開始をユーザーに通知

      // 1. ユーザーIDを確認
      const auth = getAuth();
      const user = auth.currentUser;
      const userId = user.uid;
      if (!userId) {
        this.message = 'エラー: ユーザーがログインしていません。';
        console.error('User not logged in.');
        console.log('rewardAmount',rewardAmount);
        return;
      }

      // 2. 報酬額を計算
      const rewardAmount = this.calculatePrimeFactorizationReward(gameResult);
      if (rewardAmount <= 0) {
         this.message = '報酬を獲得できませんでした。';
         console.log('No reward to grant based on result:', gameResult);
         // 報酬なしで終了する場合の処理（例: 少し待ってからメッセージを消す）
         setTimeout(() => { this.message = ''; }, 3000);
         return;
      }

      // 3. Firestoreに書き込むデータを準備
      const challengeType = 'prime-factorization'; // このゲームのID
      const submissionData = {
        userId: userId,
        reward: rewardAmount,
        challengeType: challengeType,
        //completedAt: serverTimestamp(),
      };

      try {
        // 4. Firestoreに書き込み (Cloud Functionsをトリガー)
        console.log("Submitting prime factorization challenge result:", submissionData); // 送信するデータを確
        const submissionsColRef = collection(db, 'miningChallenges', challengeType, 'submissions');
        console.log("Submitting prime factorization challenge result:", submissionsColRef);
        const docRef = await addDoc(submissionsColRef, submissionData);

        console.log(`Prime Factorization submission successful with ID: ${docRef.id}. User: ${userId}, Reward: ${rewardAmount}`);
        this.message = `クリア！ ${rewardAmount} Kuzellium を獲得しました！`;

        // 必要であれば、少し待ってからメッセージをクリアしたり、他の画面に遷移したりする
        // setTimeout(() => { this.$router.push('/mining'); }, 2000);
        try {
            const cooldownMinutes = 5; // 例: 5分間のクールダウン（ゲームごとに変えてもOK）
            const cooldownDurationMs = cooldownMinutes * 60 * 1000;
            const cooldownEndTime = Timestamp.fromMillis(Date.now() + cooldownDurationMs); // Firestore Timestamp型

            // users/{userId} ドキュメントへの参照を取得
            const userDocRef = doc(db, 'users', userId);

            // challengeCooldowns マップフィールド内の該当チャレンジIDの値を更新
            await updateDoc(userDocRef, {
                [`challengeCooldowns.${challengeType}`]: cooldownEndTime
            });
            console.log(`[${challengeType}] Cooldown end time saved to user profile:`, cooldownEndTime.toDate());

        } catch (cooldownError) {
            console.error(`[${challengeType}] Failed to save cooldown time:`, cooldownError);
            // クールダウン設定のエラーは続行しても良いかもしれない
        }
      } catch (error) {
        console.error("Error submitting prime factorization challenge result:", error);
        this.message = 'エラーが発生し、結果を送信できませんでした。';
        // エラー発生時の後処理
      }
    },

    /**
     * Prime Factorization ゲームの結果に基づいて報酬を計算する
     * @param {object} gameResult - ゲーム結果 (score, time などを含む)
     * @returns {number} - 計算された報酬額
     */
    calculatePrimeFactorizationReward(gameResult) {
      // --- ここに報酬計算ロジックを実装 ---
      // 例: スコアがあればスコアの5%、なければ固定値など
      console.log("Calculating reward for result:", gameResult); // 受け取ったデータを確認
      let reward = 0;
      if (gameResult && typeof gameResult.score === 'number') {
        reward = Math.floor(gameResult.score * 0.05); // スコアの5% (例)
      } else {
        reward = 5; // 固定報酬 (例)
      }
      // -----------------------------------
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