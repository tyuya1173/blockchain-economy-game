// functions/trading/ledgerRecorder.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const db = admin.firestore();

module.exports = {
  onTradeComplete: functions.firestore
    .document('transactions/{transactionId}')
    .onCreate(async (snap, context) => {
      try {
        const transaction = snap.data();
        const blockRef = db.collection('blocks').doc();

        // Generate a simple hash (this is a placeholder - real blockchain would use cryptographic hashing)
        const calculateHash = (block) => {
          return require('crypto')
            .createHash('sha256')
            .update(JSON.stringify(block))
            .digest('hex');
        };

        const block = {
          index: context.params.transactionId,
          timestamp: admin.firestore.Timestamp.now(),
          transactions: [transaction],
          previousHash: 'TODO: Retrieve last block hash', // In a real implementation, you'd track the previous block's hash
          nonce: Math.floor(Math.random() * 1000000)
        };

        block.hash = calculateHash(block);

        await blockRef.set(block);

        console.log(
          `Transaction ${context.params.transactionId} added to blockchain`
        );
      } catch (error) {
        console.error('Error recording trade to ledger:', error);
      }
    })
};