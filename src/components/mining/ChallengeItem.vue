<template>
  <div class="challenge-item-list">
    <ul class="reward-list">
      <li v-for="item in rewardsInfo" :key="item.name" class="reward-item">
        <span class="reward-icon">{{ item.icon }}</span>
        <div class="reward-details">
          <span class="reward-name">{{ item.challengeName }}</span>
          <span class="reward-description">報酬: {{ item.reward }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'ChallengeItem',
  data() {
    return {
      // 各チャレンジで獲得できる報酬の情報リスト
      // 実際の報酬体系に合わせて調整してください
      rewardsInfo: [
        {
          challengeName: 'クイズチャレンジ',
          icon: '❓',
          reward: 'トークン 10 ~ 50', // 例: 範囲表示
          difficulty: 'easy' // 参考情報
        },
        {
          challengeName: 'ナンバーハッシュチャレンジ',
          icon: '🔢',
          reward: 'トークン 30 ~ 100',
          difficulty: 'medium'
        },
        {
          challengeName: 'パターンマッチングチャレンジ (素因数分解)', // 仮称
          icon: '🧩',
          reward: 'トークン 50 ~ 200',
          difficulty: 'hard'
        },
        // 他のチャレンジがあれば追加
      ]
    };
  }
};
</script>

<style scoped>
.challenge-item-list {
  padding: 10px 0; /* 上下のパディングを調整 */
}
.reward-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.reward-item {
  display: flex;
  align-items: center;
  padding: 12px 8px; /* パディング調整 */
  border-bottom: 1px solid #eee;
  background-color: #fff; /* 背景追加 */
  border-radius: 4px; /* 角丸 */
  margin-bottom: 8px; /* アイテム間のスペース */
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.reward-item:last-child {
  border-bottom: none;
}
.reward-icon {
  font-size: 1.5em;
  margin-right: 15px;
  width: 30px; /* 幅固定 */
  text-align: center;
}
.reward-details {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.reward-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}
.reward-description {
  font-size: 13px;
  color: #666;
}
</style>