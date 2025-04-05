<template>
  <div>
    <h2>パターンマッチングチャレンジ</h2>

    <PrimeFactorization/>
  </div>
</template>

<script>
import PrimeFactorization from '@/components/mining/PrimeFactorization.vue';

export default {
  name: 'PrimeFactorizationView',
  components: {
    PrimeFactorization,
  }
};
</script>

<style scoped>
/* スタイルをここに追加 */
</style>