<template>
  <div class="answer-form">
    <form @submit.prevent="submitAnswer">
      <div v-if="mode === 'computer-science'"  class="computer-science">
        <label for="answer">8桁の値:</label>
        <input id="answer" v-model="answer" type="text" placeholder="例: 12345678" />
      </div>
      <div v-else-if="mode === 'prime-factorization'"  class = "prime-factorization">
        <label for="answer">素因数の積:</label>
        <input id="answer" v-model="answer" type="text" placeholder="例: 12345678" />
      </div>
      <button type="submit">回答を送信</button>
    </form>
  </div>
</template>

<script>
export default {
  name: "AnswerForm",
  props: {
    mode: {
      type: String,
      required: true,
      validator: (value) =>
        ["computer-science", "prime-factorization", "rsa-factorization"].includes(value)
    }
  },
  data() {
    return {
      answer: "",
      factor1: "",
      factor2: "",
      rsaP: "",
      rsaQ: ""
    };
  },
  methods: {
    submitAnswer() {
      if (this.mode === "computer-science") {
        this.$emit("submit-answer", this.answer);
      } else if (this.mode === "prime-factorization") {
        this.$emit("submit-answer", this.answer);
      } else if (this.mode === "rsa-factorization") {
        this.$emit("submit-answer", { rsaP: this.rsaP, rsaQ: this.rsaQ });
      }
    }
  }
};
</script>

<style scoped>
.answer-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 300px;
  margin: 0 auto;
  margin-top: 20px;
}

input {
  padding: 8px;
  font-size: 16px;
  margin-left: 10px;
  margin-bottom: 10px;
}

button {
  padding: 8px 12px;
  font-size: 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #2980b9;
}

.computer-science {
  display: flex;
  flex-direction: column;
}

.prime-factorization {
  display: flex;
  flex-direction: column;
}
</style>