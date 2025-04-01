<template>
  <div class="trade-form">
    <h2>資産を送る</h2>

    <form @submit.prevent="handleSubmit">
      <!-- 送信者ユーザーID入力 -->
      <div class="form-group">
        <label for="fromUserId">あなたのユーザーID</label>
        <input 
          v-model="fromUserId" 
          id="fromUserId" 
          type="text" 
          required 
          placeholder="自分のユーザーID"
        />
      </div>

      <!-- 資産選択 -->
      <div class="form-group">
        <label for="assetType">資産タイプ</label>
        <select v-model="assetType" id="assetType" required>
          <option value="labDollar">ラボドル</option>
          <option value="kuzellium">クーゼリアム</option>
          <option value="gold">金</option>
        </select>
      </div>

      <!-- 送信先ユーザーID -->
      <div class="form-group">
        <label for="toUserId">送信先ユーザーID</label>
        <input 
          v-model="toUserId" 
          id="toUserId" 
          type="text" 
          required 
          placeholder="相手のユーザーID" 
        />
      </div>

      <!-- 数量入力 -->
      <div class="form-group">
        <label for="amount">数量</label>
        <input 
          v-model.number="amount" 
          id="amount" 
          type="number" 
          required 
          min="1" 
          placeholder="数量を入力" 
        />
      </div>

      <button type="submit">確認する</button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'TradeForm',
  data() {
    return {
      fromUserId: '',
      toUserId: '',
      assetType: 'labDollar',
      amount: 1
    };
  },
  methods: {
    handleSubmit() {
      // 入力内容を親に emit（確認モーダル表示用）
      this.$emit('confirm-trade', {
        fromUserId: this.fromUserId.trim(),
        toUserId: this.toUserId.trim(),
        assetType: this.assetType,
        amount: this.amount
      });
    }
  }
};
</script>

<style scoped>
.trade-form {
  max-width: 400px;
  margin: auto;
}

.form-group {
  margin-bottom: 1rem;
}

input,
select {
  width: 100%;
  padding: 0.5rem;
}
</style>