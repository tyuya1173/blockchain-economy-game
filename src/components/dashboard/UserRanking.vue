<template>
    <v-card flat tile>
      <v-card-title class="headline font-weight-bold">
        ランキング
      </v-card-title>
  
      <v-card-text>
        <v-skeleton-loader 
          v-if="loading" 
          type="list-item-avatar-three-line@3"
        ></v-skeleton-loader>
  
        <v-list v-else class="ranking-list">
          <v-list-item 
            v-for="(player, index) in players" 
            :key="player.userId" 
            class="ranking-item"
            :class="{'current-user': player.userId === currentUserId}"
          >
            <v-list-item-avatar 
              :color="getAvatarColor(index)"
              class="ranking-position"
            >
              <span class="white--text">{{ index + 1 }}</span>
            </v-list-item-avatar>
  
            <v-list-item-content>
              <v-list-item-title>
                {{ player.displayName }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ formatNumber(player.totalValue) }}円
              </v-list-item-subtitle>
            </v-list-item-content>
  
            <v-list-item-action v-if="player.userId === currentUserId">
              <v-chip 
                small 
                color="primary" 
                outlined
              >
                あなた
              </v-chip>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  export default {
    name: 'UserRanking',
    props: {
      currentUserId: {
        type: String,
        required: true
      },
      players: {
        type: Array,
        default: () => []
      },
      loading: {
        type: Boolean,
        default: true
      }
    },
    methods: {
      // 数値のフォーマット
      formatNumber(value) {
        return new Intl.NumberFormat('ja-JP').format(Math.round(value));
      },
  
      // ランキングアバターの色を決定
      getAvatarColor(index) {
        const colors = [
          'amber darken-1', 
          'blue-grey lighten-1', 
          'brown lighten-1'
        ];
        return index < 3 ? colors[index] : 'grey lighten-1';
      }
    }
  };
  </script>
  
  <style scoped>
  .ranking-item.current-user {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .ranking-position {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  </style>