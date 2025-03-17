import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './index';

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