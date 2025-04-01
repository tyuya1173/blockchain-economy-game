<template>
    <div class="asset-selector">
      <label for="asset-select">資産タイプ</label>
      <select id="asset-select" v-model="selected">
        <option v-for="asset in assets" :key="asset.value" :value="asset.value">
          {{ asset.label }}
          <span v-if="showPrices && prices[asset.value]">
            （{{ prices[asset.value].price }}円）
          </span>
        </option>
      </select>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AssetSelector',
    props: {
      value: {
        type: String,
        default: 'labDollar'
      },
      showPrices: {
        type: Boolean,
        default: false
      },
      prices: {
        type: Object,
        default: () => ({})
      }
    },
    data() {
      return {
        assets: [
          { value: 'labDollar', label: 'ラボドル' },
          { value: 'kuzellium', label: 'クーゼリアム' },
          { value: 'gold', label: '金' }
        ]
      };
    },
    computed: {
      selected: {
        get() {
          return this.value;
        },
        set(newValue) {
          this.$emit('input', newValue);
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .asset-selector {
    margin-bottom: 1rem;
  }
  
  select {
    width: 100%;
    padding: 0.5rem;
  }
  </style>