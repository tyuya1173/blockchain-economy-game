<template>
  <div class="prime-factorization-game">
    <h1>RSA暗号の素因数分解バトル 🏗️</h1>
    <p>素因数分解して、位を入れ替えた値の積を入力せよ</p>
    <p>公開鍵 N: {{ N }}</p>
    <p v-if="message" :class="{ success: isSuccess, error: !isSuccess }">{{ message }}</p>
    <AnswerForm mode="prime-factorization" @submit-answer="checkAnswer" />
  </div>
</template>

<script>
import AnswerForm from './AnswerForm.vue';

export default {
  components: {
    AnswerForm,
  },
  data() {
    return {
      N: null,
      correctP: null, // 正しい p
      correctQ: null, // 正しい q
      message: "",
      isSuccess: false,
      ans: null,
    };
  },
  methods: {
    generateNewKey() {
      const primes = this.generatePrimes(50, 100); // Generate primes between 50 and 100
      const p = primes[Math.floor(Math.random() * primes.length)];
      const q = primes[Math.floor(Math.random() * primes.length)];
      this.N = p * q;
      this.correctP = p; // 正しい p を保存
      this.correctQ = q; // 正しい q を保存
      this.message = "";
      this.isSuccess = false;
      this.x = this.swapDigits(p);
      this.y = this.swapDigits(q);
      this.ans =　this.x * this.y;
    },

    swapDigits(num) {
      const tens = Math .floor(num / 10); // 10の位
      const ones = num % 10; // 1の位
      return ones * 10 + tens; // 1の位と10の位を入れ替えた値
    },

    // 素数を生成する関数
    generatePrimes(start, end) {
      const primes = [];
      for (let i = start; i <= end; i++) {
        if (this.isPrime(i)) primes.push(i);
      }
      return primes;
    },

    isPrime(num) {
      if (num < 2) return false;
      for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
      }
      return true;
    },


    checkAnswer(answer) {
      if (answer === (this.ans).toString()) {
        // 正解の場合
        alert("正解です！");
        this.isSuccess = true;
        this.$router.push("/mining");
      } else {
        // 不正解の場合
        alert("不正解です。もう一度お試しください。");
      }
    }
  },
  mounted() {
    this.generateNewKey();
  },
};
</script>

<style scoped>
.prime-factorization-game {
  font-family: Arial, sans-serif;
  text-align: center;
  margin: 20px;
}
.success {
  color: green;
}
.error {
  color: red;
}
</style>