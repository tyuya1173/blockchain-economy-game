<template>
  <div>
    <div class="mining-challenges">
      <div class="challenge">
        <h1>Mining Challenge</h1>
        <div class="challenge-item-list">
          <router-link to="/number-hash-challenge" class="challenge-link">
            ナンバーハッシュチャレンジ
          </router-link>
          <router-link to="/computer-sciense" class="challenge-link">
            コンピュータサイエンス
          </router-link>
          <router-link to="/prime-factorization" class="challenge-link">
            暗号解読
          </router-link>
        </div>
      </div>
    </div>
    <ChallengeTimer v-if="cooldown" />
    <MiningHistory />
  </div>
</template>

<script>
import NumberHashChallenge from '@/views/ChallengeGame/NumberHashChallengeView.vue';
import QuizChallenge from '@/views/ChallengeGame/ComputerScienseView.vue';
import PrimeFactorization from '@/views/ChallengeGame/PrimeFactorizationView.vue';


export default {
  components: {
    NumberHashChallenge,
    QuizChallenge,
    PrimeFactorization,
  },
  data() {
    return {
      currentChallenge: null
    };
  },
  methods: {
    emitSubmit(payload) {
      this.$emit('submit', payload);
    }
  }
};
</script>

<style scoped>
button {
  margin: 5px;
}

.challenge-item-list {
  padding: 10px;
  display: flex;
  justify-content: center;
}

.challenge-link {
  margin: 20px;
  text-decoration: none;
  color: blue;
  font-weight: bold;
  cursor: pointer;
}

.challenge {
  margin: 10px;
}
</style>
