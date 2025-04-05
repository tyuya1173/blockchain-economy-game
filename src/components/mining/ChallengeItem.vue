<template>
  <div class="challenge-item">
    <h3>{{ challenge.title }}</h3>
    <p>{{ challenge.description }}</p>
    <input v-model="answer" placeholder="Enter your answer" />
    <button @click="submitAnswer">Submit Answer</button>
    <p v-if="rewardMessage">{{ rewardMessage }}</p>
  </div>
</template>

<script>
export default {
  name: 'ChallengeItem',
  props: {
    challenge: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      answer: '',
      rewardMessage: ''
    };
  },
  methods: {
    submitAnswer() {
      if (this.answer === this.challenge.correctAnswer) {
        this.rewardUser();
      } else {
        this.rewardMessage = 'Incorrect answer. Please try again.';
      }
    },
    rewardUser() {
      // Logic to reward the user with クーゼリアム
      // This is a placeholder and should be replaced with actual reward logic
      this.rewardMessage = 'Congratulations! You have earned クーゼリアム.';
    }
  }
};
</script>

<style scoped>
.challenge-item {
  border: 1px solid #ccc;
  padding: 16px;
  margin: 16px 0;
}
</style>