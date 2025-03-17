const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

// Firebase初期化（まだ初期化されていない場合）
if (!admin.apps.length) {
  admin.initializeApp();
}

// 価格変動のパラメータ
const PRICE_CONFIG = {
  kuzellium: {
    initialPrice: 500,   // 初期価格
    volatility: 0.8,     // ±80%の変動幅
    minPrice: 100,       // 最小価格
    updateInterval: '* * * * *'  // 1分ごとに実行（Firestoreトリガーと組み合わせて10秒更新を実現）
  },
  gold: {
    initialPrice: 8000,  // 初期価格
    volatility: 0.1,     // ±10%の緩やかな変動
    minPrice: 4000,      // 最小価格
    updateInterval: '* * * * *', // 1分ごとに実行（Firestoreトリガーと組み合わせて30秒更新を実現）
    baseUptrend: 0.05,   // 基本上昇率（5%）
    uptrendVariation: 0.03 // 上昇率の変動幅（±3%）
  }
};

// クーゼリアム用の価格変動アルゴリズム - 初期価格から純粋にランダム変動
function calculateKuzelliumPrice(config) {
  // ボラティリティに基づくランダムな変動
  const randomVariation = (Math.random() * 2 * config.volatility) - config.volatility;
  
  // 初期価格から新しい価格を計算
  let newPrice = config.initialPrice * (1 + randomVariation);
  
  // 最小価格を下回らないように調整
  newPrice = Math.max(config.minPrice, newPrice);
  
  // 初期価格からの変動率を計算
  const changeFromInitialPercent = ((newPrice - config.initialPrice) / config.initialPrice) * 100;
  
  console.log(`クーゼリアム計算: 初期価格=${config.initialPrice}円, ランダム変動=${(randomVariation * 100).toFixed(2)}%, 新価格=${newPrice.toFixed(2)}円, 初期価格からの変動=${changeFromInitialPercent.toFixed(2)}%`);
  
  return {
    price: newPrice,
    changePercent: changeFromInitialPercent
  };
}

// 金用の価格変動アルゴリズム - 右肩上がり傾向を追加
function calculateGoldPrice(config) {
  // 基本上昇率に変動を加える
  const uptrendVariation = (Math.random() * 2 * config.uptrendVariation) - config.uptrendVariation;
  const effectiveUptrend = config.baseUptrend + uptrendVariation;
  
  // ボラティリティに基づくランダムな変動
  const randomVariation = (Math.random() * 2 * config.volatility) - config.volatility;
  
  // 基本的な上昇とランダム変動を組み合わせる
  const totalVariation = effectiveUptrend + randomVariation;
  
  // 初期価格から新しい価格を計算
  let newPrice = config.initialPrice * (1 + totalVariation);
  
  // 最小価格を下回らないように調整
  newPrice = Math.max(config.minPrice, newPrice);
  
  // 初期価格からの変動率を計算
  const changeFromInitialPercent = ((newPrice - config.initialPrice) / config.initialPrice) * 100;
  
  console.log(`金計算: 初期価格=${config.initialPrice}円, 基本上昇=${(effectiveUptrend * 100).toFixed(2)}%, ランダム変動=${(randomVariation * 100).toFixed(2)}%, 総合変動=${(totalVariation * 100).toFixed(2)}%, 新価格=${newPrice.toFixed(2)}円, 初期価格からの変動=${changeFromInitialPercent.toFixed(2)}%`);
  
  return {
    price: newPrice,
    changePercent: changeFromInitialPercent
  };
}

// タイムスタンプ管理関数
async function updateTimestamp(assetType) {
  const db = admin.firestore();
  const timestampRef = db.collection('marketData').doc('updateTimers');
  
  try {
    // 現在のタイムスタンプを取得
    const timestampDoc = await timestampRef.get();
    const now = admin.firestore.Timestamp.now();
    
    if (!timestampDoc.exists) {
      // 初期設定
      const initialData = {
        lastUpdate: now,
        kuzelliumCounter: 0,
        goldCounter: 0
      };
      await timestampRef.set(initialData);
      return {
        shouldUpdateKuzellium: assetType === 'kuzellium',
        shouldUpdateGold: assetType === 'gold',
        counter: 0
      };
    } else {
      const data = timestampDoc.data();
      let kuzelliumCounter = data.kuzelliumCounter || 0;
      let goldCounter = data.goldCounter || 0;
      
      // カウンターを更新
      if (assetType === 'kuzellium') {
        kuzelliumCounter = (kuzelliumCounter + 1) % 6; // 10秒間隔 (60秒 ÷ 10秒 = 6回)
      } else if (assetType === 'gold') {
        goldCounter = (goldCounter + 1) % 2; // 30秒間隔 (60秒 ÷ 30秒 = 2回)
      }
      
      // 更新データ
      const updateData = {
        lastUpdate: now
      };
      
      if (assetType === 'kuzellium') {
        updateData.kuzelliumCounter = kuzelliumCounter;
      } else if (assetType === 'gold') {
        updateData.goldCounter = goldCounter;
      }
      
      await timestampRef.update(updateData);
      
      return {
        shouldUpdateKuzellium: assetType === 'kuzellium' ? kuzelliumCounter === 0 : false,
        shouldUpdateGold: assetType === 'gold' ? goldCounter === 0 : false,
        counter: assetType === 'kuzellium' ? kuzelliumCounter : goldCounter
      };
    }
  } catch (error) {
    console.error('タイムスタンプ更新エラー:', error);
    return {
      shouldUpdateKuzellium: false,
      shouldUpdateGold: false,
      counter: -1
    };
  }
}

// クーゼリアム価格更新関数 (Pub/Sub - 1分に1回起動)
exports.updateKuzelliumPrice = functions.pubsub
  .schedule(PRICE_CONFIG.kuzellium.updateInterval)
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    const db = admin.firestore();
    const marketDataRef = db.collection('marketData').doc('currentPrices');
    
    try {
      // 常に更新 (基準点となる更新)
      const { price: newPrice, changePercent } = calculateKuzelliumPrice(
        PRICE_CONFIG.kuzellium
      );
      
      // Firestoreに価格を更新
      await marketDataRef.set({
        kuzellium: {
          price: newPrice,
          initialPrice: PRICE_CONFIG.kuzellium.initialPrice,
          changePercent: changePercent,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });
      
      // 価格履歴を保存
      await db.collection('marketData')
        .doc('priceHistory')
        .collection('kuzellium')
        .add({
          price: newPrice,
          initialPrice: PRICE_CONFIG.kuzellium.initialPrice,
          changePercent: changePercent,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      
      console.log(`Kuzellium price updated by scheduler: ${newPrice.toFixed(2)} (初期価格から${changePercent.toFixed(2)}% 変動)`);
      
      // トリガー用にカウンターをリセット
      await db.collection('marketData').doc('updateTimers').update({
        kuzelliumCounter: 0,
        kuzelliumTrigger: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    } catch (error) {
      console.error('Kuzellium価格更新エラー:', error);
      return null;
    }
  });

// 金価格更新関数 (Pub/Sub - 1分に1回起動)
exports.updateGoldPrice = functions.pubsub
  .schedule(PRICE_CONFIG.gold.updateInterval)
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    const db = admin.firestore();
    const marketDataRef = db.collection('marketData').doc('currentPrices');
    
    try {
      // 常に更新 (基準点となる更新)
      const { price: newPrice, changePercent } = calculateGoldPrice(
        PRICE_CONFIG.gold
      );
      
      // Firestoreに価格を更新
      await marketDataRef.set({
        gold: {
          price: newPrice,
          initialPrice: PRICE_CONFIG.gold.initialPrice,
          changePercent: changePercent,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });
      
      // 価格履歴を保存
      await db.collection('marketData')
        .doc('priceHistory')
        .collection('gold')
        .add({
          price: newPrice,
          initialPrice: PRICE_CONFIG.gold.initialPrice,
          changePercent: changePercent,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      
      console.log(`Gold price updated by scheduler: ${newPrice.toFixed(2)} (初期価格から${changePercent.toFixed(2)}% 変動)`);
      
      // トリガー用にカウンターをリセット
      await db.collection('marketData').doc('updateTimers').update({
        goldCounter: 0,
        goldTrigger: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    } catch (error) {
      console.error('Gold価格更新エラー:', error);
      return null;
    }
  });

// クーゼリアム価格更新トリガー (10秒間隔)
exports.triggerKuzelliumUpdate = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();
  const marketDataRef = db.collection('marketData').doc('currentPrices');
  const timestampRef = db.collection('marketData').doc('updateTimers');
  
  try {
    // 現在のカウンター値を取得
    const timestampDoc = await timestampRef.get();
    if (!timestampDoc.exists) {
      res.status(400).json({ error: 'タイマードキュメントが存在しません。初期化が必要です。' });
      return;
    }
    
    const data = timestampDoc.data();
    let kuzelliumCounter = (data.kuzelliumCounter || 0) + 1;
    
    // カウンターを更新 (10秒ごとなので1分間に6回)
    if (kuzelliumCounter >= 6) {
      kuzelliumCounter = 0; // 1分経過でリセット (この更新はschedulerが行うため実際には使われない)
    }
    
    // カウンターを更新
    await timestampRef.update({
      kuzelliumCounter: kuzelliumCounter,
      lastKuzelliumUpdate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // 価格を更新 (スケジューラ以外の更新)
    if (kuzelliumCounter !== 0) {
      const { price: newPrice, changePercent } = calculateKuzelliumPrice(
        PRICE_CONFIG.kuzellium
      );
      
      // Firestoreに価格を更新
      await marketDataRef.set({
        kuzellium: {
          price: newPrice,
          initialPrice: PRICE_CONFIG.kuzellium.initialPrice,
          changePercent: changePercent,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });
      
      // 価格履歴を保存
      await db.collection('marketData')
        .doc('priceHistory')
        .collection('kuzellium')
        .add({
          price: newPrice,
          initialPrice: PRICE_CONFIG.kuzellium.initialPrice,
          changePercent: changePercent,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      
      console.log(`Kuzellium price updated by HTTP trigger: ${newPrice.toFixed(2)} (初期価格から${changePercent.toFixed(2)}% 変動)`);
    }
    
    res.json({
      success: true,
      message: `クーゼリアムの価格を更新しました。カウンター: ${kuzelliumCounter}/6`
    });
  } catch (error) {
    console.error('Kuzellium価格トリガー更新エラー:', error);
    res.status(500).json({ error: '価格更新に失敗しました', details: error.message });
  }
});

// 金価格更新トリガー (30秒間隔)
exports.triggerGoldUpdate = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();
  const marketDataRef = db.collection('marketData').doc('currentPrices');
  const timestampRef = db.collection('marketData').doc('updateTimers');
  
  try {
    // 現在のカウンター値を取得
    const timestampDoc = await timestampRef.get();
    if (!timestampDoc.exists) {
      res.status(400).json({ error: 'タイマードキュメントが存在しません。初期化が必要です。' });
      return;
    }
    
    const data = timestampDoc.data();
    let goldCounter = (data.goldCounter || 0) + 1;
    
    // カウンターを更新 (30秒ごとなので1分間に2回)
    if (goldCounter >= 2) {
      goldCounter = 0; // 1分経過でリセット (この更新はschedulerが行うため実際には使われない)
    }
    
    // カウンターを更新
    await timestampRef.update({
      goldCounter: goldCounter,
      lastGoldUpdate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // 価格を更新 (スケジューラ以外の更新)
    if (goldCounter !== 0) {
      const { price: newPrice, changePercent } = calculateGoldPrice(
        PRICE_CONFIG.gold
      );
      
      // Firestoreに価格を更新
      await marketDataRef.set({
        gold: {
          price: newPrice,
          initialPrice: PRICE_CONFIG.gold.initialPrice,
          changePercent: changePercent,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });
      
      // 価格履歴を保存
      await db.collection('marketData')
        .doc('priceHistory')
        .collection('gold')
        .add({
          price: newPrice,
          initialPrice: PRICE_CONFIG.gold.initialPrice,
          changePercent: changePercent,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      
      console.log(`Gold price updated by HTTP trigger: ${newPrice.toFixed(2)} (初期価格から${changePercent.toFixed(2)}% 変動)`);
    }
    
    res.json({
      success: true,
      message: `金の価格を更新しました。カウンター: ${goldCounter}/2`
    });
  } catch (error) {
    console.error('Gold価格トリガー更新エラー:', error);
    res.status(500).json({ error: '価格更新に失敗しました', details: error.message });
  }
});

// 初期価格設定関数（オプション - 必要なければ削除可能）
exports.initializeMarketPrices = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();
  const marketDataRef = db.collection('marketData').doc('currentPrices');
  const timestampRef = db.collection('marketData').doc('updateTimers');
  
  try {
    // クーゼリアムの初期価格から変動
    const kuzelliumResult = calculateKuzelliumPrice(PRICE_CONFIG.kuzellium);
    
    // 金の初期価格から変動（右肩上がり傾向あり）
    const goldResult = calculateGoldPrice(PRICE_CONFIG.gold);
    
    // 価格を設定
    await marketDataRef.set({
      kuzellium: {
        price: kuzelliumResult.price,
        initialPrice: PRICE_CONFIG.kuzellium.initialPrice,
        changePercent: kuzelliumResult.changePercent,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      gold: {
        price: goldResult.price,
        initialPrice: PRICE_CONFIG.gold.initialPrice,
        changePercent: goldResult.changePercent,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });
    
    // タイマー用ドキュメントも初期化
    await timestampRef.set({
      lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      kuzelliumCounter: 0,
      goldCounter: 0,
      kuzelliumTrigger: admin.firestore.FieldValue.serverTimestamp(),
      goldTrigger: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // 価格履歴の初期データも作成
    await db.collection('marketData')
      .doc('priceHistory')
      .collection('kuzellium')
      .add({
        price: kuzelliumResult.price,
        initialPrice: PRICE_CONFIG.kuzellium.initialPrice,
        changePercent: kuzelliumResult.changePercent,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
    await db.collection('marketData')
      .doc('priceHistory')
      .collection('gold')
      .add({
        price: goldResult.price,
        initialPrice: PRICE_CONFIG.gold.initialPrice,
        changePercent: goldResult.changePercent,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    
    res.json({ 
      message: '市場価格を初期化しました',
      kuzellium: {
        initialPrice: PRICE_CONFIG.kuzellium.initialPrice,
        currentPrice: kuzelliumResult.price,
        changePercent: kuzelliumResult.changePercent.toFixed(2) + '%'
      },
      gold: {
        initialPrice: PRICE_CONFIG.gold.initialPrice,
        currentPrice: goldResult.price,
        changePercent: goldResult.changePercent.toFixed(2) + '%',
        trend: '上昇傾向'
      }
    });
  } catch (error) {
    console.error('市場価格初期化エラー:', error);
    res.status(500).json({ error: '市場価格の初期化に失敗しました' });
  }
});