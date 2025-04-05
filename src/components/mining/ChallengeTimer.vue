<template>
  <div>
    <div v-if="cooldownActive">
      クールダウン中です。{{ remainingTime }}秒お待ちください。
    </div>
    <div v-else>
      <button @click="startMiningChallenge">マイニングチャレンジを開始</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      cooldownActive: false,
      cooldownTime: 60, // クールダウンタイム（秒）
      remainingTime: 0,
      timer: null
    };
  },
  methods: {
    startMiningChallenge() {
      // 成功報酬をもらったかどうかに関係なくクールダウンを開始
      this.startCooldown();
    },
    startCooldown() {
      this.cooldownActive = true;
      this.remainingTime = this.cooldownTime;
      this.timer = setInterval(() => {
        this.remainingTime--;
        if (this.remainingTime <= 0) {
          clearInterval(this.timer);
          this.cooldownActive = false;
        }
      }, 1000);
    }
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
};
</script>

<style scoped>
/* スタイルをここに追加 */
</style>