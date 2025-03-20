// Realtime Database操作のためのユーティリティ
import { ref, onValue, off, get, set, push, remove } from 'firebase/database';
import { rtdb } from './index'; // rtdbはindex.jsからエクスポートされるRealtimeDatabaseインスタンス

/**
 * 価格データのリアルタイムリスナーを設定
 * @param {string} assetType - 資産タイプ（'kuzellium' または 'gold'）
 * @param {function} callback - 価格データを受け取るコールバック関数
 * @returns {function} - リスナーの解除関数
 */
export const subscribeToPriceUpdates = (assetType, callback) => {
  console.log(`${assetType} の価格更新リスナーを設定中...`);
  const priceRef = ref(rtdb, `prices/${assetType}`);
  
  onValue(priceRef, (snapshot) => {
    console.log(`${assetType} 価格データ受信 - データ存在: ${snapshot.exists()}`);
    const data = snapshot.val();
    console.log(`${assetType} データ内容:`, data);
    
    if (data && data.price !== undefined) {
      // データが存在し、price属性も存在する場合
      const result = {
        price: data.price,
        changePercent: data.changePercent || 0
      };
      console.log(`${assetType} コールバックに渡すデータ:`, result);
      callback(result);
    } else {
      console.warn(`${assetType} データが存在しないか、不完全です。初期値を使用します。`);
      // デフォルト値をコールバックに渡す
      const defaultData = {
        price: assetType === 'kuzellium' ? 500 : 8000,
        changePercent: 0
      };
      console.log(`${assetType} デフォルトデータをコールバックに渡します:`, defaultData);
      callback(defaultData);
      
      // データベースに初期値を書き込むことも検討
      try {
        const timestamp = Date.now();
        console.log(`${assetType} のデータベース初期値を設定します`);
        set(priceRef, {
          price: defaultData.price,
          initialPrice: defaultData.price,
          changePercent: 0,
          updatedAt: timestamp,
          source: 'client-init'
        });
      } catch (error) {
        console.error(`${assetType} 初期値設定エラー:`, error);
      }
    }
  }, (error) => {
    console.error(`${assetType} データ取得エラー:`, error);
    // エラー時もデフォルト値を提供
    callback({
      price: assetType === 'kuzellium' ? 500 : 8000,
      changePercent: 0
    });
  });
  
  console.log(`${assetType} の価格更新リスナーが設定されました`);
  // リスナー解除関数を返す
  return () => {
    console.log(`${assetType} の価格更新リスナーを解除します`);
    off(priceRef);
  };
};

/**
 * 価格履歴データのリアルタイムリスナーを設定
 * @param {string} assetType - 資産タイプ（'kuzellium' または 'gold'）
 * @param {function} callback - 履歴データを受け取るコールバック関数
 * @param {number} limit - 取得する履歴データの数（デフォルト：30）
 * @returns {function} - リスナーの解除関数
 */
export const subscribeToPriceHistory = (assetType, callback, limit = 30) => {
  console.log(`${assetType} の価格履歴リスナーを設定中...`);
  const historyRef = ref(rtdb, `priceHistory/${assetType}`);
  
  onValue(historyRef, (snapshot) => {
    console.log(`${assetType} 履歴データ受信 - データ存在: ${snapshot.exists()}`);
    
    try {
      const data = snapshot.val() || {};
      const historyKeys = Object.keys(data);
      console.log(`${assetType} 履歴データのキー数: ${historyKeys.length}`);
      
      if (historyKeys.length === 0) {
        console.warn(`${assetType} の履歴データが存在しません`);
        callback([]);
        return;
      }
      
      const historyItems = historyKeys
        // トリガーノードを除外（念のため）
        .filter(key => key !== 'triggers' && key !== 'priceUpdate')
        .map(key => {
          try {
            // キーがタイムスタンプの数値文字列であることを前提に変換
            const timestamp = parseInt(key);
            if (isNaN(timestamp)) {
              console.warn(`${assetType} 履歴データに無効なキー: ${key}`);
              return null;
            }
            
            const item = data[key];
            if (!item || item.price === undefined) {
              console.warn(`${assetType} 履歴データに不完全なアイテム: ${key}`, item);
              return null;
            }
            
            return {
              price: item.price,
              id: key,
              time: new Date(timestamp).toLocaleTimeString(),
              timestamp: item.timestamp || timestamp
            };
          } catch (itemError) {
            console.error(`${assetType} 履歴アイテム処理エラー (${key}):`, itemError);
            return null;
          }
        })
        .filter(item => item !== null) // 無効なアイテムを除外
        .sort((a, b) => a.timestamp - b.timestamp);
      
      console.log(`${assetType} 有効な履歴アイテム: ${historyItems.length}件`);
      
      // 指定された数だけの最新データに制限
      const limitedHistory = historyItems.slice(-limit);
      console.log(`${assetType} コールバックに渡す履歴アイテム: ${limitedHistory.length}件`);
      
      callback(limitedHistory);
    } catch (error) {
      console.error(`${assetType} 履歴データ処理エラー:`, error);
      callback([]);
    }
  }, (error) => {
    console.error(`${assetType} 履歴データ取得エラー:`, error);
    callback([]);
  });
  
  console.log(`${assetType} の価格履歴リスナーが設定されました`);
  // リスナー解除関数を返す
  return () => {
    console.log(`${assetType} の価格履歴リスナーを解除します`);
    off(historyRef);
  };
};

/**
 * 現在の価格データを一回だけ取得
 * @param {string} assetType - 資産タイプ（'kuzellium' または 'gold'）
 * @returns {Promise<Object>} - 価格データ
 */
export const getCurrentPrice = async (assetType) => {
  console.log(`${assetType} の現在価格を取得中...`);
  const priceRef = ref(rtdb, `prices/${assetType}`);
  
  try {
    const snapshot = await get(priceRef);
    console.log(`${assetType} 価格データ取得結果 - データ存在: ${snapshot.exists()}`);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log(`${assetType} 価格データ:`, data);
      return data;
    } else {
      console.warn(`${assetType} 価格データが存在しません。デフォルト値を返します。`);
      return {
        price: assetType === 'kuzellium' ? 500 : 8000,
        initialPrice: assetType === 'kuzellium' ? 500 : 8000,
        changePercent: 0,
        updatedAt: Date.now()
      };
    }
  } catch (error) {
    console.error(`${assetType} 価格データ取得エラー:`, error);
    throw error;
  }
};

/**
 * アプリケーション起動時に市場価格を初期化
 * @returns {Promise<void>}
 */
export const initializePricesOnStart = async () => {
  console.log('アプリケーション起動時の価格初期化を実行中...');
  
  try {
    // Firebase Realtime Databaseへの接続を確認
    const connectedRef = ref(rtdb, '.info/connected');
    const connectedSnapshot = await get(connectedRef);
    const isConnected = connectedSnapshot.val();
    
    console.log(`データベース接続状態: ${isConnected ? '接続済み' : '未接続'}`);
    
    if (!isConnected) {
      console.warn('データベースに接続されていません。初期化をスキップします。');
      return;
    }
    
    // クーゼリアムと金の現在価格を確認
    const kuzelliumSnapshot = await get(ref(rtdb, 'prices/kuzellium'));
    const goldSnapshot = await get(ref(rtdb, 'prices/gold'));
    
    const kuzelliumExists = kuzelliumSnapshot.exists();
    const goldExists = goldSnapshot.exists();
    
    console.log(`現在の価格データ存在: クーゼリアム=${kuzelliumExists}, 金=${goldExists}`);
    
    // 価格データが存在しない場合は初期化
    if (!kuzelliumExists || !goldExists) {
      console.log('価格データが不足しているため初期化します');
      
      const timestamp = Date.now();
      
      // クーゼリアムの初期化
      if (!kuzelliumExists) {
        console.log('クーゼリアム価格を初期化中...');
        await set(ref(rtdb, 'prices/kuzellium'), {
          price: 500,
          initialPrice: 500,
          changePercent: 0,
          updatedAt: timestamp,
          source: 'client-init'
        });
        
        // 履歴の初期データも作成
        await set(ref(rtdb, `priceHistory/kuzellium/${timestamp}`), {
          price: 500,
          timestamp: timestamp
        });
        
        console.log('クーゼリアム価格の初期化完了');
      }
      
      // 金の初期化
      if (!goldExists) {
        console.log('ゴールド価格を初期化中...');
        await set(ref(rtdb, 'prices/gold'), {
          price: 8000,
          initialPrice: 8000,
          changePercent: 0,
          updatedAt: timestamp,
          source: 'client-init'
        });
        
        // 履歴の初期データも作成
        await set(ref(rtdb, `priceHistory/gold/${timestamp}`), {
          price: 8000,
          timestamp: timestamp
        });
        
        console.log('ゴールド価格の初期化完了');
      }
      
      // 更新トリガーの初期化
      console.log('更新トリガーを初期化中...');
      await set(ref(rtdb, 'triggers/priceUpdate'), {
        timestamp: timestamp,
        minute: new Date().getMinutes(),
        second: new Date().getSeconds(),
        source: 'client-init'
      });
      
      console.log('更新トリガーの初期化完了');
    } else {
      console.log('価格データは既に存在します。初期化をスキップします。');
    }
    
    console.log('アプリケーション起動時の価格初期化が完了しました');
    
  } catch (error) {
    console.error('価格初期化エラー:', error);
  }
};

/**
 * 現在の価格をRealtimeDatabaseに設定（管理者用）
 * @param {string} assetType - 資産タイプ（'kuzellium' または 'gold'）
 * @param {Object} priceData - 価格データ
 * @returns {Promise<void>}
 */
export const updateCurrentPrice = async (assetType, priceData) => {
  console.log(`${assetType} の価格を手動で更新中...`, priceData);
  const priceRef = ref(rtdb, `prices/${assetType}`);
  
  try {
    await set(priceRef, {
      ...priceData,
      updatedAt: Date.now() // updatedAtを使用（Cloud Functionsと一致）
    });
    console.log(`${assetType} の価格更新完了`);
  } catch (error) {
    console.error(`${assetType} 価格更新エラー:`, error);
    throw error;
  }
};

export default {
  subscribeToPriceUpdates,
  subscribeToPriceHistory,
  getCurrentPrice,
  initializePricesOnStart,
  updateCurrentPrice
};