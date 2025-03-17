import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './index';

// ユーザー登録
export const registerUser = async (email, password, username) => {
  try {
    // Firebase Authでユーザーを作成
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // ユーザープロフィールを更新
    await updateProfile(userCredential.user, {
      displayName: username
    });
    
    // ユーザープロフィールをFirestoreに保存
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      userId: userCredential.user.uid,
      username: username,
      displayName: username,
      role: 'player', // デフォルトはプレイヤー
      assets: {
        labDollar: 1000, // 初期値
        kuzellium: 0,
        gold: 0
      },
      createdAt: serverTimestamp()
    });
    
    return userCredential.user;
  } catch (error) {
    console.error("Error in registerUser:", error);
    throw error;
  }
};

// メールとパスワードでログイン
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error in loginWithEmail:", error);
    throw error;
  }
};

// ログアウト
export const logout = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Error in logout:", error);
    throw error;
  }
};

// 現在のユーザーを取得
export const getCurrentUser = () => {
  return auth.currentUser;
};

// 認証状態の監視
export const onAuthStateChanged = (callback) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

// パスワードリセットメールを送信
export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Error in sendPasswordResetEmail:", error);
    throw error;
  }
};

// ユーザーロールを取得
export const getUserRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error("Error in getUserRole:", error);
    throw error;
  }
};