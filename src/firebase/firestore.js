import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './index';
import { setDoc, Timestamp, deleteDoc, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ユーザー情報を取得
export const getUser = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

// ユーザー情報を更新
export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, userData);
    return true;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// ユーザーの資産を取得
export const getUserAssets = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data().assets;
    }
    return null;
  } catch (error) {
    console.error("Error getting user assets:", error);
    throw error;
  }
};

// ユーザーの資産を更新
export const updateUserAssets = async (userId, assets) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { assets });
    return true;
  } catch (error) {
    console.error("Error updating user assets:", error);
    throw error;
  }
};

//取引ルームの作成
export async function createTradeRoom(createdBy) {
  const roomRef = doc(collection(db, 'tradeRooms'));
  await setDoc(roomRef, {
    createdBy,
    createdAt: Timestamp.now(),
    status: 'waiting',
  });
  return roomRef.id;
}

//取引ルームへの参加
export async function joinTradeRoom(roomId) {
  const roomRef = await getDoc(doc(db, 'tradeRooms', roomId));
  return roomRef.exists() ? roomRef.data() : null;
}

//firestoreに保存
export async function submitTradeOffer(roomId, offer) {
  const offerRef = doc(collection(db, 'tradeRooms', roomId, 'offers'));
  await setDoc(offerRef, {
    fromUserId: offer.fromUserId,
    toUserId: offer.toUserId,
    assetType: offer.assetType,
    amount: offer.amount,
    confirmed: false, // 確認済みフラグ
    createdAt: Timestamp.now()
  });
}

//取引の確認
export async function confirmTradeOffer(roomId, offerId) {
  const offerRef = doc(db, 'tradeRooms', roomId, 'offers', offerId);
  await updateDoc(offerRef, {
    confirmed: true
  });
}

//資産移動処理
export async function executeTrade(roomId) {
  console.log("Executing trade for room:", roomId);
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) {
    throw new Error("User not authenticated");
  }

  const offerSnap = await getDocs(collection(db, 'tradeRooms', roomId, 'offers'));
  const offers = [];
  offerSnap.forEach(doc => offers.push({ id: doc.id, ...doc.data() }));

  const allConfirmed = offers.every(o => o.confirmed);
  if (!allConfirmed || offers.length !== 2) return;

  // 自分が関係するオファーのうち、資産を更新すべき部分だけ処理
  for (const offer of offers) {
    const userRef = doc(db, 'users', currentUserId);

    if (offer.toUserId === currentUserId) {
      // 自分が受け取り側 → 資産を増やす
      await updateDoc(userRef, {
        [`assets.${offer.assetType}`]: increment(offer.amount)
      });
    }

    if (offer.fromUserId === currentUserId) {
      // 自分が提供側 → 資産を減らす
      await updateDoc(userRef, {
        [`assets.${offer.assetType}`]: increment(-offer.amount)
      });
    }
  }

  // 状態だけは誰でも更新できるのでOK
  await updateDoc(doc(db, 'tradeRooms', roomId), {
    status: 'completed'
  });
}

//ルーム退出
export async function exitTradeRoom(roomId, userId) {
  // 任意: ルーム削除、または画面遷移でルームから出す
  await deleteDoc(doc(db, 'tradeRooms', roomId));
}