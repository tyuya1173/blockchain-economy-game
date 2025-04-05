<template>
  <div>
    <h2>マイニング</h2>
    <MiningChallenge/>
    <ChallengeTimer v-if="cooldown" />
    <ChallengeItem />
    <MiningHistory />
  </div>
</template>

<script>
import MiningChallenge from '@/components/mining/MiningChallenge.vue';
import ChallengeTimer from '@/components/mining/ChallengeTimer.vue';
import ChallengeItem from '@/components/mining/ChallengeItem.vue';
import MiningHistory from '@/components/mining/MiningHistory.vue';

export default {
  name: 'MiningView',
  components: {
    MiningChallenge,
    ChallengeTimer,
    ChallengeItem,
    MiningHistory
  },
  data() {
    return {
      cooldown: false,
      answers: {
        クイズチャレンジ: '',
        ナンバーハッシュチャレンジ: '',
        パターンマッチングチャレンジ: ''
      }
    };
  },
  methods: {
    handleAnswer({ answer, challengeType }) {
      // Handle the answer submission logic here
      this.answers[challengeType] = answer;
      console.log(`Submitted answer for ${challengeType}:`, answer);
      // If successful, set cooldown to true and start the timer
      this.cooldown = true;
    }
  }
};
</script>

<style scoped>
.challenge-item-list {
  padding: 10px;
  display: flex;
  justify-content: center;
}
.challenge {
  margin: 10px;
}
</style>