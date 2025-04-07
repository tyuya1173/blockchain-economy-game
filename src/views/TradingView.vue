<template>
    <v-container>
      <h2>取引ルーム</h2>
  
      <v-card class="pa-4 mb-4">
        <h3>新しいルームを作成</h3>
        <v-btn color="primary" @click="createRoom">ルーム作成</v-btn>
        <div v-if="createdRoomId">
          <p>作成されたルームID: <strong>{{ createdRoomId }}</strong></p>
          <v-btn text color="success" @click="goToRoom(createdRoomId)">ルームに入る</v-btn>
        </div>
      </v-card>
  
      <v-card class="pa-4">
        <h3>既存ルームに参加</h3>
        <v-text-field v-model="inputRoomId" label="ルームIDを入力" />
        <v-btn color="primary" @click="joinRoom">参加</v-btn>
        <v-alert v-if="joinError" type="error" class="mt-2">
          ルームが見つかりませんでした。
        </v-alert>
      </v-card>
    </v-container>
  </template>
  
  <script>
  import { getAuth } from 'firebase/auth'
  import { createTradeRoom, joinTradeRoom } from '@/firebase/firestore'
  
  export default {
    name: 'TradingView',
    data() {
      return {
        createdRoomId: null,
        inputRoomId: '',
        joinError: false
      }
    },
    computed: {
      userId() {
        return getAuth().currentUser?.uid || ''
      }
    },
    methods: {
      async createRoom() {
        const roomId = await createTradeRoom(this.userId)
        this.createdRoomId = roomId
      },
      async joinRoom() {
        const exists = await joinTradeRoom(this.inputRoomId)
        if (exists) {
          this.$router.push(`/trade-room/${this.inputRoomId}`)
        } else {
          this.joinError = true
        }
      },
      goToRoom(roomId) {
        this.$router.push(`/trade-room/${roomId}`)
      }
    }
  }
  </script>
  
  <style scoped>
  h2, h3 {
    font-weight: bold;
  }
  </style>