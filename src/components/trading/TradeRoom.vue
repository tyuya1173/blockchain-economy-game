<template>
  <div>
    <h3>あなたのオファー</h3>
    <v-select v-model="myAsset" :items="assetOptions" label="資産を選択" />
    <v-text-field v-model.number="myAmount" label="数量" type="number" />
    <v-btn color="primary" @click="submitMyOffer">オファー送信</v-btn>

    <div v-if="myOffer">
      <p>確認状態: {{ myOffer.confirmed ? '確認済み' : '未確認' }}</p>
      <v-btn v-if="!myOffer.confirmed" @click="confirmMyOffer">確認</v-btn>
    </div>

    <h3>相手のオファー</h3>
    <div v-if="opponentOffer">
      <p>{{ opponentOffer.assetType }} を {{ opponentOffer.amount }} 提示</p>
      <p>確認状態: {{ opponentOffer.confirmed ? '確認済み' : '未確認' }}</p>
    </div>

    <v-alert v-if="readyToExecute" type="success">
      お互いに確認済みです。取引を実行できます。
    </v-alert>
    <v-btn v-if="readyToExecute" color="green" @click="handleExecuteTrade">取引実行</v-btn>

    <!-- ✅ ダイアログ -->
    <v-dialog v-model="dialogVisible" max-width="400">
      <v-card>
        <v-card-title class="headline">取引完了</v-card-title>
        <v-card-text>
          取引が正常に完了しました！<br>
          ダッシュボードに戻ります。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" text @click="goToDashboard">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import {
  submitTradeOffer,
  confirmTradeOffer,
  executeTrade,
} from '@/firebase/firestore'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

export default {
  props: ['roomId', 'userId'],
  data() {
    return {
      myAsset: 'labDollar',
      myAmount: 0,
      myOffer: null,
      opponentOffer: null,
      assetOptions: ['labDollar', 'kuzellium', 'gold'],
      dialogVisible: false // ✅ 追加
    }
  },
  computed: {
    readyToExecute() {
      return this.myOffer?.confirmed && this.opponentOffer?.confirmed
    }
  },
  methods: {
    async submitMyOffer() {
      const opponentId = this.opponentOffer?.fromUserId || '仮固定'
      await submitTradeOffer(this.roomId, {
        fromUserId: this.userId,
        toUserId: opponentId,
        assetType: this.myAsset,
        amount: this.myAmount
      })
    },
    async confirmMyOffer() {
      await confirmTradeOffer(this.roomId, this.myOffer.id)
    },
    async handleExecuteTrade() {
      try {
        await executeTrade(this.roomId)
        this.dialogVisible = true // ✅ ダイアログ表示
      } catch (e) {
        console.error('取引実行エラー:', e)
      }
    },
    goToDashboard() {
      this.dialogVisible = false
      this.$router.push('/dashboard') // ✅ 遷移
    },
    observeOffers() {
      const offersRef = collection(db, 'tradeRooms', this.roomId, 'offers')
      onSnapshot(offersRef, snapshot => {
        const all = []
        snapshot.forEach(doc => {
          all.push({ id: doc.id, ...doc.data() })
        })
        this.myOffer = all.find(o => o.fromUserId === this.userId) || null
        this.opponentOffer = all.find(o => o.fromUserId !== this.userId) || null
      })
    }
  },
  mounted() {
    this.observeOffers()
  }
}
</script>