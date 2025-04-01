// functions/trading/functionExports.js
const functions = require('firebase-functions/v1');
const { processTransaction } = require('./transactionProcessor');

exports.processTransaction = functions.https.onCall(async (data, context) => {
  const { fromUserId, toUserId, assetType, amount } = data;
  return await processTransaction(fromUserId, toUserId, assetType, amount);
});