<template>
  <div class="mining-history">
    <h2>Mining History</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Challenge</th>
          <th>Answer</th>
          <th>Reward</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(entry, index) in miningHistory" :key="index">
          <td>{{ index + 1 }}</td>
          <td>{{ entry.challenge }}</td>
          <td>{{ entry.answer }}</td>
          <td>{{ entry.reward }}</td>
          <td>{{ entry.date }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "MiningHistory",
  data() {
    return {
      miningHistory: [
        // サンプルデータ
        {
          challenge: "Challenge 1",
          answer: "Answer A",
          reward: "10 Coins",
          date: "2023-10-01",
        },
        {
          challenge: "Challenge 2",
          answer: "Answer B",
          reward: "15 Coins",
          date: "2023-10-02",
        },
        {
          challenge: "Challenge 3",
          answer: "Answer C",
          reward: "20 Coins",
          date: "2023-10-03",
        },
      ],
    };
  },
};
</script>

<style scoped>
.mining-history {
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f4f4f4;
}
</style>