import { db } from '@/firebase/firestore';
import { doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // UUID生成ライブラリ
import Asset from './Asset'; // 資産更新に使う

export default class Transaction {
  constructor(fromUser, toUser, assetType, amount) {
    this.transactionId = uuidv4();
    this.fromUser = fromUser;
    this.toUser = toUser;
    this.assetType = assetType;
    this.amount = amount;
    this.timestamp = new Date();
  }

  /**
   * 実際の取引処理を行う
   * - fromUserの資産を減らす
   * - toUserの資産を増やす
   * - 取引をFirestoreに記録
   */
  static async executeTrade(fromUserId, toUserId, assetType, amount) {
    if (!fromUserId || !toUserId || !assetType || amount <= 0) {
      throw new Error('無効な取引情報です');
    }

    try {
      // 資産の更新（送信者：減らす、受信者：増やす）
      await Asset.updateAsset(fromUserId, assetType, -amount);
      await Asset.updateAsset(toUserId, assetType, amount);

      // 取引データを作成し記録
      const transaction = new Transaction(fromUserId, toUserId, assetType, amount);
      await Transaction.recordTransaction(transaction);

      return transaction;
    } catch (error) {
      console.error('取引に失敗しました:', error);
      throw error;
    }
  }

  /**
   * Firestore に取引データを保存する
   */
  static async recordTransaction(transaction) {
    try {
      const transactionRef = collection(db, 'transactions');
      await addDoc(transactionRef, {
        from: transaction.fromUser,
        to: transaction.toUser,
        assetType: transaction.assetType,
        amount: transaction.amount,
        timestamp: Timestamp.fromDate(transaction.timestamp),
        blockId: '', // 後でブロック記録時に更新
      });
    } catch (error) {
      console.error('取引記録に失敗しました:', error);
      throw error;
    }
  }
}