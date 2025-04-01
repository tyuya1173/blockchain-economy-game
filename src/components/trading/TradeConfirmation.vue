<template>
    <div class="confirmation-modal">
      <div class="modal-content">
        <h3>取引内容の確認</h3>
  
        <p><strong>資産タイプ:</strong> {{ assetLabel }}</p>
        <p><strong>送信先ユーザー:</strong> {{ tradeData.toUserId }}</p>
        <p><strong>数量:</strong> {{ tradeData.amount }}</p>
  
        <div class="buttons">
          <button @click="$emit('cancel')">キャンセル</button>
          <button @click="submitTrade">送信する</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'TradeConfirmation',
    props: {
      tradeData: {
        type: Object,
        required: true
      }
    },
    computed: {
      assetLabel() {
        const map = {
          labDollar: 'ラボドル',
          kuzellium: 'クーゼリアム',
          gold: '金'
        };
        return map[this.tradeData.assetType] || this.tradeData.assetType;
      }
    },
    methods: {
      submitTrade() {
        this.$emit('submit', this.tradeData);
      }
    }
  };
  </script>
  
  <style scoped>
  .confirmation-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-content {
    background: #fff;
    padding: 2rem;
    border-radius: 10px;
    max-width: 400px;
    width: 90%;
  }
  
  .buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 1.5rem;
  }
  </style>