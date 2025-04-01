const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * ユーザーの資産を更新する関数
 * @param {string} userId - 対象ユーザーID
 * @param {string} assetType - 資産タイプ（labDollar, kuzellium, gold）
 * @param {number} amountDelta - 増減値（負の値で減少）
 */
async function updateUserAsset(userId, assetType, amountDelta) {
  const userRef = db.collection('users').doc(userId);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new Error(`ユーザーが存在しません: ${userId}`);
    }

    const currentAssets = userDoc.data().assets || {};
    const currentValue = currentAssets[assetType] || 0;
    const newValue = currentValue + amountDelta;

    if (newValue < 0) {
      throw new Error(`ユーザー ${userId} の ${assetType} が不足しています`);
    }

    // 資産の更新
    transaction.update(userRef, {
      [`assets.${assetType}`]: newValue
    });
  });
}

/**
 * 資産をユーザー間で移転する関数
 * @param {string} fromUserId - 送信者ID
 * @param {string} toUserId - 受信者ID
 * @param {string} assetType - 資産タイプ
 * @param {number} amount - 移転量（正の数のみ）
 */
async function transferAsset(fromUserId, toUserId, assetType, amount) {
  console.log('[transferAsset] 資産移転開始:', { fromUserId, toUserId, assetType, amount });
  if (amount <= 0) {
    throw new Error('資産移転量は正の数である必要があります');
  }

  // トランザクション内で資産を移転
  await db.runTransaction(async (transaction) => {
    // 送信者の資産を減らす
    const fromUserRef = db.collection('users').doc(fromUserId);
    const fromUserDoc = await transaction.get(fromUserRef);
    if (!fromUserDoc.exists) throw new Error('送信者が存在しません');
    const fromAssets = fromUserDoc.data().assets || {};
    const fromCurrent = fromAssets[assetType] || 0;
    if (fromCurrent < amount) throw new Error('送信者の資産が不足しています');
    transaction.update(fromUserRef, {
      [`assets.${assetType}`]: fromCurrent - amount
    });

    // 受信者の資産を増やす
    const toUserRef = db.collection('users').doc(toUserId);
    const toUserDoc = await transaction.get(toUserRef);
    if (!toUserDoc.exists) throw new Error('受信者が存在しません');
    const toAssets = toUserDoc.data().assets || {};
    const toCurrent = toAssets[assetType] || 0;
    transaction.update(toUserRef, {
      [`assets.${assetType}`]: toCurrent + amount
    });
  });
}

module.exports = {
  transferAsset,
  updateUserAsset, // 必要であれば個別更新用として使用可能
};