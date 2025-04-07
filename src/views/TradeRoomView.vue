<template>
    <v-container>
      <h2>取引ルーム：{{ roomId }}</h2>
      <TradeRoom :room-id="roomId" :user-id="userId" />
    </v-container>
  </template>
  
  <script>
  import TradeRoom from '@/components/trading/TradeRoom.vue'
  import { useRoute } from 'vue-router'
  import { getAuth } from 'firebase/auth'
  
  export default {
    components: { TradeRoom },
    data() {
      return {
        roomId: this.$route.params.roomId,
        userId: getAuth().currentUser.uid
      }
    }
  }
  </script>