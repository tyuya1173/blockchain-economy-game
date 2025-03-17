<template>
    <v-card flat tile class="user-ranking-card">
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="headline font-weight-bold">ランキング</span>
        <v-btn 
          icon 
          small 
          color="grey lighten-1"
          @click="showFullRanking"
        >
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </v-card-title>
  
      <v-card-text>
        <v-skeleton-loader 
          v-if="loading" 
          type="list-item-avatar-three-line@3"
        ></v-skeleton-loader>
  
        <v-list v-else class="ranking-list">
          <v-list-item 
            v-for="(player, index) in displayedPlayers" 
            :key="player.userId" 
            class="ranking-item"
            :class="{'current-user': player.userId === currentUserId}"
          >
            <div class="ranking-position-container">
              <div 
                class="ranking-position" 
                :class="`rank-${index + 1}`"
              >
                {{ index + 1 }}
              </div>
            </div>
  
            <v-list-item-content class="ml-3">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <v-list-item-title class="player-name">
                    {{ player.displayName }}
                    <v-chip 
                      v-if="player.userId === currentUserId" 
                      small 
                      color="primary" 
                      outlined
                      class="ml-2"
                    >
                      あなた
                    </v-chip>
                  </v-list-item-title>
                  <v-list-item-subtitle class="player-value">
                    {{ formatNumber(player.totalValue) }}円
                  </v-list-item-subtitle>
                </div>
                <div 
                  class="ranking-trend" 
                  :class="{
                    'text-success': player.trend > 0,
                    'text-error': player.trend < 0
                  }"
                >
                  <v-icon 
                    v-if="player.trend !== 0" 
                    small 
                    :color="player.trend > 0 ? 'success' : 'error'"
                  >
                    {{ player.trend > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                  </v-icon>
                  {{ Math.abs(player.trend).toFixed(1) }}%
                </div>
              </div>
            </v-list-item-content>
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
    data() {
      return {
        playersToShow: 3
      };
    },
    computed: {
      displayedPlayers() {
        return this.players.slice(0, this.playersToShow);
      }
    },
    methods: {
      // 数値のフォーマット
      formatNumber(value) {
        return new Intl.NumberFormat('ja-JP').format(Math.round(value));
      },
  
      // ランキングの完全な表示
      showFullRanking() {
        this.$emit('show-full-ranking');
      }
    }
  };
  </script>
  
  <style scoped>
  .user-ranking-card {
    border: 1px solid rgba(0,0,0,0.1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-radius: 8px;
  }

  .ranking-list {
    background-color: #f5f5f5;
    border-radius: 8px;
    padding: 8px 0;
  }
  
  .ranking-item {
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(0,0,0,0.1);
    padding: 8px 16px;
  }

  .ranking-item:last-child {
    border-bottom: none;
  }

  .ranking-item.current-user {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .ranking-position-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ranking-position {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
  }

  /* ランキングポジションの色分け */
  .rank-1 {
    background-color: #FFD700; /* ゴールド */
  }

  .rank-2 {
    background-color: #C0C0C0; /* シルバー */
  }

  .rank-3 {
    background-color: #CD7F32; /* ブロンズ */
  }

  .rank-4, .rank-5 {
    background-color: #4CAF50; /* グリーン */
  }

  .player-name {
    font-weight: bold;
    font-size: 0.95rem;
  }

  .player-value {
    color: rgba(0,0,0,0.6);
    font-size: 0.85rem;
  }

  .ranking-trend {
    display: flex;
    align-items: center;
    font-weight: bold;
    font-size: 0.85rem;
  }

  /* レスポンシブ対応 */
  @media (max-width: 600px) {
    .ranking-item {
      padding: 8px;
    }

    .ranking-position {
      width: 32px;
      height: 32px;
      font-size: 0.85rem;
    }

    .player-name, .player-value {
      font-size: 0.8rem;
    }
  }
  </style>