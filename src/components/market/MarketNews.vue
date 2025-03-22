<template>
    <v-card height="100%">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>市場ニュース</span>
        <v-chip
          color="primary"
          outlined
          small
          class="news-update-chip"
        >
          <v-icon left x-small>mdi-sync</v-icon>
          10分前に更新
        </v-chip>
      </v-card-title>
      
      <div class="news-container">
        <v-list two-line>
          <template v-for="(item, index) in newsItems">
            <v-list-item :key="index" class="news-item">
              <v-list-item-avatar tile color="grey lighten-3" class="news-thumbnail">
                <v-icon :color="item.icon.color">{{ item.icon.name }}</v-icon>
              </v-list-item-avatar>
              
              <v-list-item-content>
                <v-list-item-title class="news-title">{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle class="news-preview">{{ item.preview }}</v-list-item-subtitle>
                
                <div class="news-meta">
                  <span class="news-source">{{ item.source }}</span>
                  <span class="news-time">{{ item.time }}</span>
                  <v-chip
                    x-small
                    outlined
                    :color="item.impact.color"
                    class="news-impact-tag ml-2"
                  >
                    {{ item.impact.text }}
                  </v-chip>
                </div>
              </v-list-item-content>
            </v-list-item>
            
            <v-divider
              v-if="index < newsItems.length - 1"
              :key="`divider-${index}`"
            ></v-divider>
          </template>
        </v-list>
      </div>
    </v-card>
  </template>
  
  <script>
  export default {
    name: 'MarketNews',
    data() {
      return {
        newsItems: [
          {
            title: 'クーゼリアムの採掘効率が向上、新技術の導入により',
            preview: '最新のブロックチェーン技術により、クーゼリアムの採掘時間が30%短縮されると発表されました。',
            source: 'テックニュース',
            time: '2時間前',
            icon: { name: 'mdi-pickaxe', color: 'primary' },
            impact: { text: '高影響', color: 'success' }
          },
          {
            title: '金の需要、世界的に増加傾向',
            preview: '世界経済の不安定さから、安全資産としての金の需要が増加しています。価格上昇が予測されます。',
            source: '経済レポート',
            time: '5時間前',
            icon: { name: 'mdi-gold', color: 'amber' },
            impact: { text: '中影響', color: 'warning' }
          },
          {
            title: 'ラボドル、安定通貨として信頼性向上',
            preview: '市場の変動が激しい中、ラボドルは安定した価値を維持し、信頼性の高い通貨として評価されています。',
            source: 'マーケットウォッチ',
            time: '1日前',
            icon: { name: 'mdi-currency-usd', color: 'green' },
            impact: { text: '低影響', color: 'info' }
          },
          {
            title: '仮想通貨規制の見直し、ブロックチェーン業界に新たな動き',
            preview: '規制当局が仮想通貨に関する新たなガイドラインを公表。市場に一時的な混乱をもたらす可能性があります。',
            source: '政策ニュース',
            time: '2日前',
            icon: { name: 'mdi-gavel', color: 'red' },
            impact: { text: '高影響', color: 'error' }
          },
          {
            title: '新興デジタル資産「KzCoin」が登場、市場は様子見',
            preview: 'クーゼリアムに類似した特性を持つ新たなデジタル資産が発表されましたが、市場の反応は限定的です。',
            source: 'クリプトダイジェスト',
            time: '3日前',
            icon: { name: 'mdi-coin', color: 'purple' },
            impact: { text: '低影響', color: 'info' }
          }
        ]
      };
    }
  };
  </script>
  
  <style scoped>
  .news-container {
    height: 400px;
    overflow-y: auto;
  }
  
  .news-update-chip {
    font-size: 0.7rem;
  }
  
  .news-item {
    padding: 12px 16px;
  }
  
  .news-thumbnail {
    margin-right: 12px;
  }
  
  .news-title {
    font-weight: 500;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .news-preview {
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.6);
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
  }
  
  .news-meta {
    display: flex;
    align-items: center;
    margin-top: 6px;
    font-size: 0.7rem;
  }
  
  .news-source {
    font-weight: 500;
    color: rgba(0, 0, 0, 0.7);
  }
  
  .news-time {
    color: rgba(0, 0, 0, 0.5);
    margin-left: 8px;
  }
  
  .news-impact-tag {
    font-size: 0.65rem;
    height: 20px !important;
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