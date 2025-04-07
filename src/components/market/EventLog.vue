<template>
    <v-card height="100%">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>イベントログ</span>
        <v-btn text small color="primary">
          すべて表示
          <v-icon small right>mdi-chevron-right</v-icon>
        </v-btn>
      </v-card-title>
      
      <div class="event-log-container">
        <v-timeline dense>
          <v-timeline-item
            v-for="(event, i) in events"
            :key="i"
            :color="event.color"
            small
          >
            <template v-slot:opposite>
              <span class="event-time">{{ event.time }}</span>
            </template>
            <div class="event-content">
              <div class="event-title">{{ event.title }}</div>
              <div class="event-description">{{ event.description }}</div>
              <div class="event-effects">
                <v-chip 
                  v-for="(effect, j) in event.effects" 
                  :key="j"
                  x-small
                  outlined
                  :color="effect.color"
                  class="mr-1 mt-1"
                >
                  {{ effect.text }}
                </v-chip>
              </div>
            </div>
          </v-timeline-item>
        </v-timeline>
      </div>
    </v-card>
  </template>
  
  <script>
  export default {
    name: 'EventLog',
    data() {
      return {
        events: [
          {
            time: '10分前',
            title: '技術革新',
            description: 'クーゼリアムのマイニング効率が向上しました',
            color: 'success',
            effects: [
              { text: 'マイニング報酬 +50%', color: 'success' },
              { text: 'KZM価格 +5%', color: 'success' }
            ]
          },
          {
            time: '1時間前',
            title: '市場不安',
            description: '投資家の間で不安が広がっています',
            color: 'warning',
            effects: [
              { text: 'KZM取引量 +30%', color: 'primary' },
              { text: '市場変動性 +20%', color: 'warning' }
            ]
          },
          {
            time: '3時間前',
            title: '投資ブーム',
            description: '金への投資が増加傾向にあります',
            color: 'primary',
            effects: [
              { text: 'AU価格 +2%', color: 'success' }
            ]
          },
          {
            time: '6時間前',
            title: '規制強化',
            description: '取引手数料が一時的に上昇します',
            color: 'error',
            effects: [
              { text: '取引手数料 +1%', color: 'error' }
            ]
          },
          {
            time: '12時間前',
            title: '安全基準の更新',
            description: 'セキュリティプロトコルが更新されました',
            color: 'info',
            effects: [
              { text: 'システム安定性 +10%', color: 'info' }
            ]
          }
        ]
      };
    }
  };
  </script>
  
  <style scoped>
  .event-log-container {
    height: 400px;
    overflow-y: auto;
    padding: 0 16px;
  }
  
  .event-time {
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.6);
  }
  
  .event-content {
    padding: 4px 0 12px 0;
  }
  
  .event-title {
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .event-description {
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.7);
    margin: 2px 0;
  }
  
  .event-effects {
    margin-top: 4px;
  }
  
  /* カスタムスクロールバー */
  ::-webkit-scrollbar {
    width: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #a0a0a0;
  }
  </style>