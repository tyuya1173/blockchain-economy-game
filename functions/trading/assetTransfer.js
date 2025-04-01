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

  await db.runTransaction(async (transaction) => {
    const fromUserRef = db.collection('users').doc(fromUserId);
    const toUserRef = db.collection('users').doc(toUserId);

    // ✅ すべての読み取りを先に行う
    const [fromUserDoc, toUserDoc] = await Promise.all([
      transaction.get(fromUserRef),
      transaction.get(toUserRef)
    ]);

    if (!fromUserDoc.exists) throw new Error('送信者が存在しません');
    if (!toUserDoc.exists) throw new Error('受信者が存在しません');

    const fromAssets = fromUserDoc.data().assets || {};
    const toAssets = toUserDoc.data().assets || {};

    const fromCurrent = fromAssets[assetType] || 0;
    const toCurrent = toAssets[assetType] || 0;

    if (fromCurrent < amount) throw new Error('送信者の資産が不足しています');

    // ✅ 書き込み処理は読み取りの後に実行
    transaction.update(fromUserRef, {
      [`assets.${assetType}`]: fromCurrent - amount
    });

    transaction.update(toUserRef, {
      [`assets.${assetType}`]: toCurrent + amount
    });
  });
}

module.exports = {
  transferAsset,
  updateUserAsset, // 必要であれば個別更新用として使用可能
};