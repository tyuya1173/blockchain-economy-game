// Firebase v9+ のモジュラー構文
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getDatabase } from 'firebase/database';

// Firebaseの設定
// 実際のFirebaseプロジェクト設定に置き換えてください
const firebaseConfig = {
  apiKey: "AIzaSyBpE5rXr1y09fQt8j7El0Lf-zLtgi0Lj_Y",
  authDomain: "blockchain-economy-game.firebaseapp.com",
  projectId: "blockchain-economy-game",
  storageBucket: "blockchain-economy-game.firebasestorage.app",
  messagingSenderId: "23000555792",
  appId: "1:23000555792:web:ccce6582b18780fd55c595"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// 各サービスのエクスポート
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const rtdb = getDatabase(app);
export default app;