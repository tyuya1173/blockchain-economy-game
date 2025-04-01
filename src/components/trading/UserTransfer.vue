<template>
  <div class="user-transfer">
    <TradeForm @confirm-trade="openConfirmation" />

    <TradeConfirmation
      v-if="showModal"
      :tradeData="selectedTrade"
      @submit="submitTrade"
      @cancel="showModal = false"
    />

    <div v-if="successMessage" class="success">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>

<script>
import TradeForm from './TradeForm.vue';
import TradeConfirmation from './TradeConfirmation.vue';
import { mapState } from 'vuex';

export default {
  name: 'UserTransfer',
  components: {
    TradeForm,
    TradeConfirmation
  },
  data() {
    return {
      showModal: false,
      selectedTrade: null,
      successMessage: '',
      errorMessage: ''
    };
  },
  computed: {
    ...mapState('auth', ['userId']) // Vuexから自分のユーザーIDを取得
  },
  methods: {
    openConfirmation(tradeData) {
      // fromUserId を追加して確認モーダルへ
      this.selectedTrade = {
        ...tradeData,
      };
      this.showModal = true;
    },
    async submitTrade(tradeData) {
      console.log('[送信前チェック]', {
        fromUserId: tradeData.fromUserId,
        toUserId: tradeData.toUserId,
        assetType: tradeData.assetType,
        amount: tradeData.amount
      });
      this.showModal = false;
      this.successMessage = '';
      this.errorMessage = '';

      try {
        await this.$store.dispatch('trading/submitTrade', tradeData);

        this.successMessage = '取引が完了しました！';
        console.log('取引データ送信:', tradeData); // ✅ 正しいログ出力
      } catch (err) {
        this.errorMessage = err.message || '取引に失敗しました';
        console.error('送信エラー:', err);
      }
    }
  }
};
</script>

<style scoped>
.success {
  color: green;
  margin-top: 1rem;
}
.error {
  color: red;
  margin-top: 1rem;
}
</style>