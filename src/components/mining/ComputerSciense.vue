<template>
  <div class="signature-hunter">
    <h1>署名ハンター</h1>
    <p>署名のハッシュ値に合う8桁の値を見つけ出し回答欄に入れよ</p>
    <div v-if="!isGameComplete">
      <p>署名: {{ signature }}</p>
      <div class="hash-form">
        <label for="hash-input">8桁の値を入力してハッシュ化:</label>
        <input id="hash-input" v-model="hashInput" placeholder="例: 12345678" />
        <p v-if="calculatedHash">計算されたハッシュ: {{ calculatedHash }}</p>
      </div>
      <div class="messages">
        <p v-for="(message, index) in messages" :key="index" class="message">
          {{ message }}
        </p>
      </div>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
    <AnswerForm mode="computer-science" @submit-answer="checkAnswer" />
  </div>
</template>

<script>
import sha256 from "crypto-js/sha256";
import AnswerForm from "@/components/mining/AnswerForm.vue";

export default {
  name: "QuizChallenge",
  components: {
    AnswerForm
  },
  data() {
    return {
      messages: [], // メッセージリスト
      correctMessage: "", // 正しいメッセージ
      correctHash: "", // 正しいメッセージのハッシュ値
      signature: "", // 署名
      hashInput: "", // ハッシュ化する入力値
      calculatedHash: "", // 計算されたハッシュ
      isGameComplete: false,
      errorMessage: null
    };
  },
  watch: {
    hashInput(newValue) {
      // 入力値が変更されたらハッシュを計算
      if (newValue.length === 8 && /^\d+$/.test(newValue)) {
        this.calculatedHash = sha256(newValue).toString();
      } else {
        this.calculatedHash = "";
      }
    }
  },
  created() {
    this.initializeGame();
  },
  methods: {
    initializeGame() {
      // 正しいメッセージを設定（8文字の数字）
      this.correctMessage = this.generateRandomNumber();
      this.correctHash = sha256(this.correctMessage).toString();
      this.signature = this.generateSignature(this.correctHash);

      // 他のメッセージを設定（8文字の数字）
      this.messages = Array.from({ length: 29 }, () => this.generateRandomNumber());
      const randomIndex = Math.floor(Math.random() * this.messages.length);
      this.messages.splice(randomIndex, 0, this.correctMessage); // 正しいメッセージをランダムに挿入
    },
    generateRandomNumber() {
      // ランダムな8桁の数字を生成
      return Math.floor(10000000 + Math.random() * 90000000).toString();
    },
    generateSignature(hash) {
      // 簡易的な署名生成（ハッシュをそのまま使用）
      return hash;
    },
    resetGame() {
      this.messages = [];
      this.correctMessage = "";
      this.correctHash = "";
      this.signature = "";
      this.hashInput = "";
      this.calculatedHash = "";
      this.isGameComplete = false;
      this.errorMessage = null;
      this.initializeGame();
    },
    checkAnswer(answer) {
      if (answer === this.correctMessage) {
        // 正解の場合
        alert("正解です！");
        this.isGameComplete = true;
        this.$router.push("/mining");
      } else {
        // 不正解の場合
        alert("不正解です。もう一度お試しください。");
      }
    }
  }
};
</script>

<style scoped>
.signature-hunter {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.hash-form {
  margin-bottom: 20px;
}

.hash-form input {
  margin-left: 10px;
  padding: 5px;
  width: 200px;
}

.messages {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.message {
  padding: 10px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  width: 150px;
  text-align: center;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #2980b9;
}

.success {
  color: green;
}

.error {
  color: red;
}
</style>