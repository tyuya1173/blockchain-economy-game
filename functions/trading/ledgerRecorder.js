// functions/trading/ledgerRecorder.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const db = admin.firestore();
const crypto = require('crypto');

// 🔵 recordToLedger: 任意のタイミングで呼び出す関数
async function recordToLedger(transactionId, transactionData) {
  const blockRef = db.collection('blocks').doc();

  const block = {
    index: transactionId,
    timestamp: admin.firestore.Timestamp.now(),
    transactions: [transactionData],
    previousHash: 'TODO: Retrieve last block hash', // 実装予定
    nonce: Math.floor(Math.random() * 1000000)
  };

  block.hash = crypto.createHash('sha256').update(JSON.stringify(block)).digest('hex');

  await blockRef.set(block);

  console.log(`Transaction ${transactionId} added to blockchain`);
}

// 🔵 Firestore Trigger: 自動処理
const onTradeComplete = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    try {
      const transaction = snap.data();
      await recordToLedger(context.params.transactionId, transaction);
    } catch (error) {
      console.error('Error recording trade to ledger (trigger):', error);
    }
  });

// ✅ 両方エクスポートする
module.exports = {
  onTradeComplete,
  recordToLedger
};