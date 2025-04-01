const admin = require('firebase-admin');
const { transferAsset } = require('./assetTransfer');
const { recordToLedger } = require('./ledgerRecorder');
const { v4: uuidv4 } = require('uuid');

const db = admin.firestore();

exports.processTransaction = async (fromUserId, toUserId, assetType, amount) => {
  console.log('[バリデーションチェック]', { fromUserId, toUserId, assetType, amount });
  if (!fromUserId || !toUserId || !assetType || amount <= 0) {
    console.error('[バリデーションエラー]', { fromUserId, toUserId, assetType, amount });
    throw new Error('無効な取引データです');
  }

  try {
    console.log('[STEP1] 資産移転開始:', { fromUserId, toUserId, assetType, amount });
    await transferAsset(fromUserId, toUserId, assetType, amount);

    const transactionId = uuidv4();
    const transactionData = {
      from: fromUserId,
      to: toUserId,
      assetType,
      amount,
      timestamp: admin.firestore.Timestamp.now(),
      blockId: '',
    };

    console.log('[STEP2] Firestoreに取引記録:', transactionData);
    const transactionRef = await db.collection('transactions').add(transactionData);
    const transactionDocId = transactionRef.id;

    console.log('[STEP3] Ledger記録:', transactionDocId);
    await recordToLedger(transactionDocId, transactionData);

    console.log('[成功] 取引完了:', transactionDocId);
    return { success: true, transactionId: transactionDocId };
  } catch (error) {
    console.error('[processTransaction] 内部エラー:', error);
    throw new Error('取引処理中にエラーが発生しました');
  }
};