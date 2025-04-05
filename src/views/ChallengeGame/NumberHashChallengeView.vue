<template>
  <div>
    <number-hash-component />
    <answer-form />
  </div>
</template>

<script>
import AnswerForm from '@/components/mining/AnswerForm.vue';
import NumberHashComponent from '@/components/mining/NumberHashChallenge.vue';

export default {
  name: 'NumberHashChallengeView',
  components: {
    NumberHashComponent,
    AnswerForm
  }
};
</script>

<style scoped>
/* スタイルをここに追加 */
</style>