<template>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>価格チャート</span>
        <div class="d-flex align-center">
          <v-btn-toggle v-model="selectedAsset" mandatory dense>
            <v-btn small value="kuzellium">
              <v-icon small left>mdi-currency-eth</v-icon>
              KZM
            </v-btn>
            <v-btn small value="gold">
              <v-icon small left>mdi-gold</v-icon>
              AU
            </v-btn>
          </v-btn-toggle>
          
          <v-btn-toggle v-model="timeRange" mandatory dense class="ml-2">
            <v-btn small value="day">1日</v-btn>
            <v-btn small value="week">1週間</v-btn>
            <v-btn small value="month">1ヶ月</v-btn>
          </v-btn-toggle>
        </div>
      </v-card-title>
      
      <v-card-text>
        <div class="price-info d-flex align-center mb-4">
          <span class="text-h5 font-weight-bold">{{ formatNumber(currentPrice) }} 円</span>
          <span 
            class="ml-2 font-weight-medium" 
            :class="priceChange >= 0 ? 'text-success' : 'text-error'"
          >
            <v-icon small :color="priceChange >= 0 ? 'success' : 'error'">
              {{ priceChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
            </v-icon>
            {{ priceChange > 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
          </span>
        </div>
        
        <div class="chart-container" style="height: 300px; position: relative;">
          <canvas ref="priceChart"></canvas>
        </div>
        
        <div class="d-flex justify-space-between mt-4 text-caption">
          <div v-for="(marker, i) in timeMarkers" :key="i">{{ marker }}</div>
        </div>
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  import Chart from 'chart.js/auto';
  
  export default {
    name: 'PriceChart',
    data() {
      return {
        selectedAsset: 'kuzellium',
        timeRange: 'week',
        chart: null,
        priceData: {
          kuzellium: {
            price: 580,
            change: 3.2,
            data: this.generateRandomData(24, 500, 600)
          },
          gold: {
            price: 8200,
            change: 1.5,
            data: this.generateRandomData(24, 7800, 8300)
          }
        },
        timeMarkers: [
          '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'
        ]
      };
    },
    computed: {
      currentPrice() {
        return this.priceData[this.selectedAsset].price;
      },
      priceChange() {
        return this.priceData[this.selectedAsset].change;
      },
      chartData() {
        return this.priceData[this.selectedAsset].data;
      }
    },
    methods: {
      formatNumber(value) {
        return new Intl.NumberFormat('ja-JP').format(Math.round(value));
      },
      generateRandomData(points, min, max) {
        // ランダムなデータポイントを生成
        const data = [];
        let value = (min + max) / 2;
        
        for (let i = 0; i < points; i++) {
          // 前の値からの変動幅を計算（最大3%の変動）
          const change = value * (Math.random() * 0.06 - 0.03);
          value += change;
          
          // 最小・最大値でバウンド
          value = Math.max(min, Math.min(max, value));
          
          data.push(value);
        }
        
        return data;
      },
      initChart() {
        const ctx = this.$refs.priceChart.getContext('2d');
        
        // 既存のチャートがあれば破棄
        if (this.chart) {
          this.chart.destroy();
        }
        
        const gradientFill = ctx.createLinearGradient(0, 0, 0, 300);
        const isKuzellium = this.selectedAsset === 'kuzellium';
        
        if (isKuzellium) {
          gradientFill.addColorStop(0, 'rgba(25, 118, 210, 0.3)');
          gradientFill.addColorStop(1, 'rgba(25, 118, 210, 0.0)');
        } else {
          gradientFill.addColorStop(0, 'rgba(255, 193, 7, 0.3)');
          gradientFill.addColorStop(1, 'rgba(255, 193, 7, 0.0)');
        }
        
        const chartColor = isKuzellium ? '#1976D2' : '#FFC107';
        
        this.chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: this.timeMarkers,
            datasets: [{
              label: isKuzellium ? 'クーゼリアム価格' : 'ゴールド価格',
              data: this.chartData,
              borderColor: chartColor,
              backgroundColor: gradientFill,
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat('ja-JP').format(Math.round(context.parsed.y)) + ' 円';
                    }
                    return label;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                }
              },
              y: {
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  callback: function(value) {
                    return new Intl.NumberFormat('ja-JP').format(value) + ' 円';
                  }
                }
              }
            }
          }
        });
      }
    },
    watch: {
      selectedAsset() {
        this.initChart();
      },
      timeRange() {
        // 時間範囲が変わったらデータポイント数と時間マーカーを更新
        if (this.timeRange === 'day') {
          this.timeMarkers = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
          this.priceData.kuzellium.data = this.generateRandomData(24, 500, 600);
          this.priceData.gold.data = this.generateRandomData(24, 7800, 8300);
        } else if (this.timeRange === 'week') {
          this.timeMarkers = ['月', '火', '水', '木', '金', '土', '日'];
          this.priceData.kuzellium.data = this.generateRandomData(7, 450, 650);
          this.priceData.gold.data = this.generateRandomData(7, 7500, 8500);
        } else {
          this.timeMarkers = ['1週目', '2週目', '3週目', '4週目'];
          this.priceData.kuzellium.data = this.generateRandomData(4, 400, 700);
          this.priceData.gold.data = this.generateRandomData(4, 7200, 8800);
        }
        
        this.initChart();
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.initChart();
      });
    },
    beforeDestroy() {
      if (this.chart) {
        this.chart.destroy();
      }
    }
  };
  </script>
  
  <style scoped>
  .chart-container {
    position: relative;
    width: 100%;
  }
  </style>