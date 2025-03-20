const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

// Firebase初期化（まだ初期化されていない場合）
if (!admin.apps.length) {
  admin.initializeApp();
  console.log('Firebase Admin SDK 初期化完了');
} else {
  console.log('Firebase Admin SDK は既に初期化されています');
}

// 価格変動のパラメータ
const PRICE_CONFIG = {
  kuzellium: {
    initialPrice: 500,   // 初期価格
    volatility: 0.8,     // ±80%の変動幅
    minPrice: 100,       // 最小価格
    updateInterval: '* * * * *'  // 1分ごとに実行（基本スケジュール）
  },
  gold: {
    initialPrice: 8000,  // 初期価格
    volatility: 0.1,     // ±10%の緩やかな変動
    minPrice: 4000,      // 最小価格
    updateInterval: '* * * * *', // 1分ごとに実行（基本スケジュール）
    baseUptrend: 0.05,   // 基本上昇率（5%）
    uptrendVariation: 0.03 // 上昇率の変動幅（±3%）
  }
};

// クーゼリアム用の価格変動アルゴリズム - 初期価格から純粋にランダム変動
function calculateKuzelliumPrice(config) {
  console.log('クーゼリアム価格計算開始:', config);
  
  // ボラティリティに基づくランダムな変動
  const randomVariation = (Math.random() * 2 * config.volatility) - config.volatility;
  
  // 初期価格から新しい価格を計算
  let newPrice = config.initialPrice * (1 + randomVariation);
  
  // 最小価格を下回らないように調整
  newPrice = Math.max(config.minPrice, newPrice);
  
  // 初期価格からの変動率を計算
  const changeFromInitialPercent = ((newPrice - config.initialPrice) / config.initialPrice) * 100;
  
  console.log(`クーゼリアム計算結果: 初期価格=${config.initialPrice}円, ランダム変動=${(randomVariation * 100).toFixed(2)}%, 新価格=${newPrice.toFixed(2)}円, 初期価格からの変動=${changeFromInitialPercent.toFixed(2)}%`);
  
  return {
    price: newPrice,
    changePercent: changeFromInitialPercent
  };
}

// 金用の価格変動アルゴリズム - 右肩上がり傾向を追加
function calculateGoldPrice(config) {
  console.log('ゴールド価格計算開始:', config);
  
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
  
  console.log(`金計算結果: 初期価格=${config.initialPrice}円, 基本上昇=${(effectiveUptrend * 100).toFixed(2)}%, ランダム変動=${(randomVariation * 100).toFixed(2)}%, 総合変動=${(totalVariation * 100).toFixed(2)}%, 新価格=${newPrice.toFixed(2)}円, 初期価格からの変動=${changeFromInitialPercent.toFixed(2)}%`);
  
  return {
    price: newPrice,
    changePercent: changeFromInitialPercent
  };
}

// 価格更新トリガーノードを1分ごとに更新（RTDBトリガーのために使用）
exports.scheduleUpdateTrigger = functions.pubsub
  .schedule('every 1 minutes')
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    console.log('===== スケジューラートリガー関数が実行されました =====');
    console.log('context:', JSON.stringify(context));
    
    const rtdb = admin.database();
    
    try {
      const timestamp = Date.now();
      const now = new Date();
      const minute = now.getMinutes();
      
      // 秒数を常に0に設定
      const second = 0;
      
      console.log(`現在時刻: ${now.toISOString()} (分: ${minute}, 秒: ${now.getSeconds()})`);
      console.log(`トリガー秒数を0に設定します`);
      
      // 現在のトリガー値を確認
      const currentTriggerSnapshot = await rtdb.ref('triggers/priceUpdate').once('value');
      console.log('現在のトリガー値:', JSON.stringify(currentTriggerSnapshot.val()));
      
      // カウンターを更新して、RTDBトリガーを発火させる
      console.log('triggers/priceUpdate に書き込み中...');
      await rtdb.ref('triggers/priceUpdate').set({
        timestamp: timestamp,
        minute: minute,
        second: second, // 常に0秒に設定
        source: 'scheduler'
      });
      
      console.log(`Price update trigger set at ${new Date(timestamp).toISOString()} with second=0`);
      
      return null;
    } catch (error) {
      console.error('スケジューラートリガー関数のエラー:', error);
      return null;
    }
  });

// RTDBトリガーを使用してクーゼリアム価格を10秒間隔で更新
exports.updateKuzelliumPriceOnTrigger = functions.database
  .ref('triggers/priceUpdate')
  .onWrite(async (change, context) => {
    console.log('===== クーゼリアム価格更新関数が実行されました =====');
    console.log('context:', JSON.stringify(context));
    
    const rtdb = admin.database();
    
    try {
      // トリガーデータが存在するか確認
      if (!change.after.exists()) {
        console.error('トリガーデータが存在しません');
        return null;
      }
      
      // トリガー時刻を取得
      const triggerData = change.after.val();
      console.log('トリガーデータ:', JSON.stringify(triggerData));
      
      // 現在の秒数に基づいて更新頻度を制御
      const currentSecond = triggerData.second || 0;
      
      if (currentSecond % 10 !== 0) {
        console.log(`秒数条件不一致のためスキップ: ${currentSecond} (10の倍数である必要があります)`);
        return null;
      }
      
      // 現在の価格を確認
      const currentPriceSnapshot = await rtdb.ref('prices/kuzellium').once('value');
      console.log('prices/kuzellium ノードが存在するか:', currentPriceSnapshot.exists());
      const currentPriceData = currentPriceSnapshot.val();
      console.log('現在のクーゼリアム価格データ:', JSON.stringify(currentPriceData));
      
      // 価格計算
      const priceResult = calculateKuzelliumPrice(PRICE_CONFIG.kuzellium);
      console.log('計算された新価格:', JSON.stringify(priceResult));
      
      const timestamp = Date.now();
      
      // 現在の価格を更新
      console.log('prices/kuzellium に書き込み中...');
      try {
        await rtdb.ref('prices/kuzellium').set({
          price: priceResult.price,
          initialPrice: PRICE_CONFIG.kuzellium.initialPrice,
          changePercent: priceResult.changePercent,
          updatedAt: timestamp
        });
        console.log('prices/kuzellium への書き込み成功');
      } catch (writeError) {
        console.error('prices/kuzellium への書き込みエラー:', writeError);
        throw writeError;
      }
      
      // 価格履歴に追加
      console.log(`priceHistory/kuzellium/${timestamp} に書き込み中...`);
      try {
        await rtdb.ref(`priceHistory/kuzellium/${timestamp}`).set({
          price: priceResult.price,
          timestamp: timestamp
        });
        console.log('価格履歴への書き込み成功');
      } catch (historyError) {
        console.error('価格履歴への書き込みエラー:', historyError);
        // 履歴書き込みエラーは処理を中断しない
      }
      
      // 履歴データを制限
      try {
        const historySnapshot = await rtdb.ref('priceHistory/kuzellium')
          .orderByKey()
          .limitToLast(31)
          .once('value');
        
        const historyData = historySnapshot.val() || {};
        const historyKeys = Object.keys(historyData).sort();
        console.log(`履歴データ: ${historyKeys.length}件`);
        
        if (historyKeys.length > 30) {
          const oldestKey = historyKeys[0];
          console.log(`最古の履歴データを削除: ${oldestKey}`);
          await rtdb.ref(`priceHistory/kuzellium/${oldestKey}`).remove();
        }
      } catch (cleanupError) {
        console.error('履歴クリーンアップエラー:', cleanupError);
        // クリーンアップエラーは処理を中断しない
      }
      
      console.log(`クーゼリアム価格更新完了: ¥${priceResult.price.toFixed(2)} (${priceResult.changePercent.toFixed(2)}%) at second ${currentSecond}`);
      return null;
    } catch (error) {
      console.error('クーゼリアム価格更新関数の実行エラー:', error);
      return null;
    }
  });

// RTDBトリガーを使用して金価格を30秒間隔で更新
exports.updateGoldPriceOnTrigger = functions.database
  .ref('triggers/priceUpdate')
  .onWrite(async (change, context) => {
    console.log('===== ゴールド価格更新関数が実行されました =====');
    console.log('context:', JSON.stringify(context));
    
    const rtdb = admin.database();
    
    try {
      // トリガーデータが存在するか確認
      if (!change.after.exists()) {
        console.error('トリガーデータが存在しません');
        return null;
      }
      
      // トリガー時刻を取得
      const triggerData = change.after.val();
      console.log('トリガーデータ:', JSON.stringify(triggerData));
      
      // 現在の秒数に基づいて更新頻度を制御
      const currentSecond = triggerData.second || 0;
      
      if (currentSecond % 30 !== 0) {
        console.log(`秒数条件不一致のためスキップ: ${currentSecond} (30の倍数である必要があります)`);
        return null;
      }
      
      // 現在の価格を確認
      const currentPriceSnapshot = await rtdb.ref('prices/gold').once('value');
      console.log('prices/gold ノードが存在するか:', currentPriceSnapshot.exists());
      const currentPriceData = currentPriceSnapshot.val();
      console.log('現在のゴールド価格データ:', JSON.stringify(currentPriceData));
      
      // 価格計算
      const priceResult = calculateGoldPrice(PRICE_CONFIG.gold);
      console.log('計算された新価格:', JSON.stringify(priceResult));
      
      const timestamp = Date.now();
      
      // 現在の価格を更新
      console.log('prices/gold に書き込み中...');
      try {
        await rtdb.ref('prices/gold').set({
          price: priceResult.price,
          initialPrice: PRICE_CONFIG.gold.initialPrice,
          changePercent: priceResult.changePercent,
          updatedAt: timestamp
        });
        console.log('prices/gold への書き込み成功');
      } catch (writeError) {
        console.error('prices/gold への書き込みエラー:', writeError);
        throw writeError;
      }
      
      // 価格履歴に追加
      console.log(`priceHistory/gold/${timestamp} に書き込み中...`);
      try {
        await rtdb.ref(`priceHistory/gold/${timestamp}`).set({
          price: priceResult.price,
          timestamp: timestamp
        });
        console.log('価格履歴への書き込み成功');
      } catch (historyError) {
        console.error('価格履歴への書き込みエラー:', historyError);
        // 履歴書き込みエラーは処理を中断しない
      }
      
      // 履歴データを制限
      try {
        const historySnapshot = await rtdb.ref('priceHistory/gold')
          .orderByKey()
          .limitToLast(31)
          .once('value');
        
        const historyData = historySnapshot.val() || {};
        const historyKeys = Object.keys(historyData).sort();
        console.log(`履歴データ: ${historyKeys.length}件`);
        
        if (historyKeys.length > 30) {
          const oldestKey = historyKeys[0];
          console.log(`最古の履歴データを削除: ${oldestKey}`);
          await rtdb.ref(`priceHistory/gold/${oldestKey}`).remove();
        }
      } catch (cleanupError) {
        console.error('履歴クリーンアップエラー:', cleanupError);
        // クリーンアップエラーは処理を中断しない
      }
      
      console.log(`ゴールド価格更新完了: ¥${priceResult.price.toFixed(2)} (${priceResult.changePercent.toFixed(2)}%) at second ${currentSecond}`);
      return null;
    } catch (error) {
      console.error('ゴールド価格更新関数の実行エラー:', error);
      return null;
    }
  });

// 初期価格設定関数（ゲーム開始時やリセット時に使用）
exports.initializeMarketPrices = functions.https.onRequest(async (req, res) => {
  console.log('===== 市場価格初期化関数が実行されました =====');
  console.log('リクエストヘッダー:', req.headers);
  console.log('リクエストメソッド:', req.method);
  console.log('リクエストクエリ:', req.query);
  
  try {
    // Realtime Databaseインスタンス
    const rtdb = admin.database();
    
    // 価格をリセットする前に確認（オプション）
    const confirmReset = req.query.confirm === 'true';
    if (!confirmReset) {
      console.log('確認パラメータなしでリクエストされました');
      res.status(400).json({ 
        error: '確認が必要です', 
        message: '価格をリセットするには、?confirm=true パラメータを追加してください' 
      });
      return;
    }
    
    const timestamp = Date.now();
    
    // データベースの接続をテスト
    try {
      const testSnapshot = await rtdb.ref('.info/connected').once('value');
      console.log('データベース接続状態:', testSnapshot.val());
    } catch (connError) {
      console.error('データベース接続テストエラー:', connError);
    }
    
    // 既存の価格履歴をクリア
    console.log('既存の価格履歴をクリア中...');
    try {
      await rtdb.ref('priceHistory').remove();
      console.log('既存の価格履歴をクリア完了');
    } catch (removeError) {
      console.error('価格履歴クリアエラー:', removeError);
    }
    
    // クーゼリアムの初期価格
    const kuzelliumPrice = PRICE_CONFIG.kuzellium.initialPrice;
    
    // 金の初期価格
    const goldPrice = PRICE_CONFIG.gold.initialPrice;
    
    // 現在の価格を初期化
    console.log('クーゼリアム価格を初期化中...');
    try {
      await rtdb.ref('prices/kuzellium').set({
        price: kuzelliumPrice,
        initialPrice: kuzelliumPrice,
        changePercent: 0,
        updatedAt: timestamp
      });
      console.log('クーゼリアム価格の初期化完了');
    } catch (kuzelliumError) {
      console.error('クーゼリアム価格初期化エラー:', kuzelliumError);
      throw kuzelliumError;
    }
    
    console.log('ゴールド価格を初期化中...');
    try {
      await rtdb.ref('prices/gold').set({
        price: goldPrice,
        initialPrice: goldPrice,
        changePercent: 0,
        updatedAt: timestamp
      });
      console.log('ゴールド価格の初期化完了');
    } catch (goldError) {
      console.error('ゴールド価格初期化エラー:', goldError);
      throw goldError;
    }
    
    // 価格履歴の初期データ作成
    console.log('クーゼリアム価格履歴を初期化中...');
    try {
      await rtdb.ref(`priceHistory/kuzellium/${timestamp}`).set({
        price: kuzelliumPrice,
        timestamp: timestamp
      });
      console.log('クーゼリアム価格履歴の初期化完了');
    } catch (kuzelliumHistError) {
      console.error('クーゼリアム価格履歴初期化エラー:', kuzelliumHistError);
    }
    
    console.log('ゴールド価格履歴を初期化中...');
    try {
      await rtdb.ref(`priceHistory/gold/${timestamp}`).set({
        price: goldPrice,
        timestamp: timestamp
      });
      console.log('ゴールド価格履歴の初期化完了');
    } catch (goldHistError) {
      console.error('ゴールド価格履歴初期化エラー:', goldHistError);
    }
    
    // 更新トリガーもリセット
    console.log('更新トリガーをリセット中...');
    try {
      await rtdb.ref('triggers/priceUpdate').set({
        timestamp: timestamp,
        minute: new Date().getMinutes(),
        second: new Date().getSeconds(),
        reset: true
      });
      console.log('更新トリガーのリセット完了');
    } catch (triggerError) {
      console.error('更新トリガーリセットエラー:', triggerError);
    }
    
    // 初期化後の検証
    try {
      const kuzelliumVerify = await rtdb.ref('prices/kuzellium').once('value');
      const goldVerify = await rtdb.ref('prices/gold').once('value');
      console.log('初期化後の検証:');
      console.log('クーゼリアム:', kuzelliumVerify.val());
      console.log('ゴールド:', goldVerify.val());
    } catch (verifyError) {
      console.error('初期化検証エラー:', verifyError);
    }
    
    // 成功レスポンス
    res.json({ 
      message: '市場価格を初期化しました',
      timestamp: new Date(timestamp).toISOString(),
      initialPrices: {
        kuzellium: kuzelliumPrice,
        gold: goldPrice
      }
    });
  } catch (error) {
    console.error('市場価格初期化エラー:', error);
    res.status(500).json({ error: '市場価格の初期化に失敗しました', details: error.message });
  }
});

// 手動トリガーを実行するHTTP関数（デバッグ用）
exports.manualTrigger = functions.https.onRequest(async (req, res) => {
  console.log('===== 手動トリガー関数が実行されました =====');
  
  try {
    const rtdb = admin.database();
    const timestamp = Date.now();
    const now = new Date();
    
    // 手動でトリガーを実行
    await rtdb.ref('triggers/priceUpdate').set({
      timestamp: timestamp,
      minute: now.getMinutes(),
      second: now.getSeconds(),
      source: 'manual'
    });
    
    console.log(`手動トリガー更新実行: ${now.toISOString()}`);
    
    // データベース上の現在の値を取得して表示
    const kuzelliumSnapshot = await rtdb.ref('prices/kuzellium').once('value');
    const goldSnapshot = await rtdb.ref('prices/gold').once('value');
    
    res.json({
      message: '手動トリガーを実行しました',
      timestamp: now.toISOString(),
      currentPrices: {
        kuzellium: kuzelliumSnapshot.val(),
        gold: goldSnapshot.val()
      }
    });
  } catch (error) {
    console.error('手動トリガーエラー:', error);
    res.status(500).json({ error: '手動トリガー実行に失敗しました', details: error.message });
  }
});

// イベントによる市場価格変動関数（ゲーム管理者用）
exports.triggerMarketEvent = functions.https.onRequest(async (req, res) => {
  console.log('===== イベント実行関数が呼び出されました =====');
  console.log('リクエストメソッド:', req.method);
  console.log('リクエストボディ:', req.body);
  
  try {
    // POSTメソッドのみ許可
    if (req.method !== 'POST') {
      console.log('不正なメソッド:', req.method);
      res.status(405).json({ error: 'POST method required' });
      return;
    }
    
    // リクエストボディからイベント情報を取得
    const { eventType, assetType, effectPercent, adminKey } = req.body;
    
    // 簡易的な認証（本番環境ではより堅牢な認証を使用すべき）
    const validAdminKey = functions.config().admin?.key || 'default-admin-key';
    if (adminKey !== validAdminKey) {
      console.log('不正な管理者キー');
      res.status(403).json({ error: '管理者権限が必要です' });
      return;
    }
    
    // パラメータ検証
    if (!eventType || !assetType || effectPercent === undefined) {
      console.log('必須パラメータ不足:', { eventType, assetType, effectPercent });
      res.status(400).json({ error: '必須パラメータが不足しています' });
      return;
    }
    
    if (assetType !== 'kuzellium' && assetType !== 'gold') {
      console.log('無効な資産タイプ:', assetType);
      res.status(400).json({ error: '無効な資産タイプです' });
      return;
    }
    
    const rtdb = admin.database();
    
    // 現在の価格を取得
    console.log(`現在の${assetType}価格を取得中...`);
    const priceSnapshot = await rtdb.ref(`prices/${assetType}`).once('value');
    
    if (!priceSnapshot.exists()) {
      console.log(`prices/${assetType}ノードが存在しません`);
      res.status(404).json({ error: '価格データが見つかりません' });
      return;
    }
    
    const currentPriceData = priceSnapshot.val();
    console.log('現在の価格データ:', currentPriceData);
    
    // 効果を適用した新しい価格を計算
    const currentPrice = currentPriceData.price;
    const initialPrice = currentPriceData.initialPrice;
    const newPrice = currentPrice * (1 + (effectPercent / 100));
    
    // 初期価格からの変動率を計算
    const newChangePercent = ((newPrice - initialPrice) / initialPrice) * 100;
    
    console.log(`イベント効果の計算結果 - 現在価格:${currentPrice}, 新価格:${newPrice}, 変動率:${newChangePercent}%`);
    
    const timestamp = Date.now();
    
    // 価格を更新
    console.log(`新しい価格を更新中: prices/${assetType}`);
    await rtdb.ref(`prices/${assetType}`).set({
      price: newPrice,
      initialPrice: initialPrice,
      changePercent: newChangePercent,
      updatedAt: timestamp,
      affectedBy: {
        eventType,
        effectPercent,
        timestamp
      }
    });
    console.log('価格の更新完了');
    
    // 価格履歴に追加
    console.log(`価格履歴に追加中: priceHistory/${assetType}/${timestamp}`);
    await rtdb.ref(`priceHistory/${assetType}/${timestamp}`).set({
      price: newPrice,
      timestamp: timestamp,
      eventDriven: true,
      eventType: eventType
    });
    console.log('価格履歴への追加完了');
    
    // イベント履歴に記録
    console.log(`イベント履歴に記録中: events/${timestamp}`);
    await rtdb.ref(`events/${timestamp}`).set({
      type: eventType,
      assetType: assetType,
      effectPercent: effectPercent,
      previousPrice: currentPrice,
      newPrice: newPrice,
      timestamp: timestamp
    });
    console.log('イベント履歴への記録完了');
    
    // 成功レスポンス
    res.json({
      message: 'イベントによる価格変動を実行しました',
      eventType,
      assetType,
      previousPrice: currentPrice,
      newPrice: newPrice,
      changePercent: effectPercent,
      timestamp: new Date(timestamp).toISOString()
    });
    
  } catch (error) {
    console.error('イベント実行エラー:', error);
    res.status(500).json({ error: 'イベント実行に失敗しました', details: error.message });
  }
});

// 手動で価格を更新するためのHTTP関数（デバッグとテスト用）
exports.manualUpdatePrice = functions.https.onRequest(async (req, res) => {
  console.log('===== 手動価格更新関数が呼び出されました =====');
  console.log('リクエストメソッド:', req.method);
  console.log('リクエストボディ:', req.body);
  
  try {
    // POSTメソッドのみ許可
    if (req.method !== 'POST') {
      console.log('不正なメソッド:', req.method);
      res.status(405).json({ error: 'POST method required' });
      return;
    }
    
    // リクエストボディからパラメータを取得
    const { assetType, adminKey } = req.body;
    
    // 簡易的な認証
    const validAdminKey = functions.config().admin?.key || 'default-admin-key';
    if (adminKey !== validAdminKey) {
      console.log('不正な管理者キー');
      res.status(403).json({ error: '管理者権限が必要です' });
      return;
    }
    
    // パラメータ検証
    if (!assetType) {
      console.log('資産タイプが指定されていません');
      res.status(400).json({ error: '資産タイプが必要です' });
      return;
    }
    
    if (assetType !== 'kuzellium' && assetType !== 'gold') {
      console.log('無効な資産タイプ:', assetType);
      res.status(400).json({ error: '無効な資産タイプです' });
      return;
    }
    
    const rtdb = admin.database();
    const timestamp = Date.now();
    
    let newPrice, changePercent;
    
    console.log(`${assetType}の新しい価格を計算中...`);
    if (assetType === 'kuzellium') {
      const result = calculateKuzelliumPrice(PRICE_CONFIG.kuzellium);
      newPrice = result.price;
      changePercent = result.changePercent;
    } else {
      const result = calculateGoldPrice(PRICE_CONFIG.gold);
      newPrice = result.price;
      changePercent = result.changePercent;
    }
    
    // 現在の価格を更新
    console.log(`新しい価格でprices/${assetType}を更新中...`);
    try {
      await rtdb.ref(`prices/${assetType}`).set({
        price: newPrice,
        initialPrice: PRICE_CONFIG[assetType].initialPrice,
        changePercent: changePercent,
        updatedAt: timestamp,
        manualUpdate: true
      });
      console.log(`${assetType}価格の更新完了`);
    } catch (updateError) {
      console.error(`${assetType}価格更新エラー:`, updateError);
      throw updateError;
    }
    
    // 価格履歴に追加
    console.log(`価格履歴に追加中: priceHistory/${assetType}/${timestamp}`);
    try {
      await rtdb.ref(`priceHistory/${assetType}/${timestamp}`).set({
        price: newPrice,
        timestamp: timestamp,
        manualUpdate: true
      });
      console.log('価格履歴への追加完了');
    } catch (historyError) {
      console.error('価格履歴追加エラー:', historyError);
      // 履歴エラーは処理を中断しない
    }
    
    // 成功を確認
    const verifySnapshot = await rtdb.ref(`prices/${assetType}`).once('value');
    console.log('更新後の価格データ:', verifySnapshot.val());
    
    res.json({
      message: `${assetType} の価格を手動で更新しました`,
      newPrice: newPrice,
      changePercent: changePercent,
      timestamp: new Date(timestamp).toISOString()
    });
    
  } catch (error) {
    console.error('手動価格更新エラー:', error);
    res.status(500).json({ error: '価格更新に失敗しました', details: error.message });
  }
});

// 価格ヒストリーをクエリするためのHTTP関数
exports.getPriceHistory = functions.https.onRequest(async (req, res) => {
  console.log('===== 価格履歴取得関数が呼び出されました =====');
  console.log('リクエストメソッド:', req.method);
  console.log('リクエストクエリ:', req.query);
  
  try {
    // GETメソッドのみ許可
    if (req.method !== 'GET') {
      console.log('不正なメソッド:', req.method);
      res.status(405).json({ error: 'GET method required' });
      return;
    }
    
    // リクエストパラメータを取得
    const { assetType, limit = '30' } = req.query;
    
    // パラメータ検証
    if (!assetType) {
      console.log('資産タイプが指定されていません');
      res.status(400).json({ error: '資産タイプが必要です' });
      return;
    }
    
    if (assetType !== 'kuzellium' && assetType !== 'gold') {
      console.log('無効な資産タイプ:', assetType);
      res.status(400).json({ error: '無効な資産タイプです' });
      return;
    }
    
    // 履歴件数を整数に変換
    const limitNum = parseInt(limit, 10);
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      console.log('無効な履歴件数:', limit);
      res.status(400).json({ error: '履歴件数は1〜100の範囲で指定してください' });
      return;
    }
    
    const rtdb = admin.database();
    
    // 価格履歴を取得
    console.log(`${assetType}の価格履歴を取得中 (最大${limitNum}件)...`);
    try {
      const historySnapshot = await rtdb.ref(`priceHistory/${assetType}`)
        .orderByKey()
        .limitToLast(limitNum)
        .once('value');
      
      const historyData = historySnapshot.val() || {};
      
      // 配列形式に変換してソート
      const historyArray = Object.keys(historyData).map(key => ({
        timestamp: parseInt(key),
        time: new Date(parseInt(key)).toISOString(),
        ...historyData[key]
      })).sort((a, b) => a.timestamp - b.timestamp);
      
      console.log(`${historyArray.length}件の履歴データを取得`);
      
      res.json({
        assetType,
        count: historyArray.length,
        history: historyArray
      });
    } catch (error) {
      console.error('価格履歴取得エラー:', error);
      res.status(500).json({ error: '価格履歴の取得に失敗しました', details: error.message });
    }
  } catch (error) {
    console.error('価格履歴取得関数のエラー:', error);
    res.status(500).json({ error: '予期せぬエラーが発生しました', details: error.message });
  }
});

// 価格監視HTTP関数 - 価格が更新されているか確認し、必要に応じて修復
exports.monitorPrices = functions.https.onRequest(async (req, res) => {
  console.log('===== 価格監視関数が実行されました =====');
  
  try {
    const rtdb = admin.database();
    const now = new Date();
    const timestamp = now.getTime();
    
    // 最新の価格データを取得
    const kuzelliumSnapshot = await rtdb.ref('prices/kuzellium').once('value');
    const goldSnapshot = await rtdb.ref('prices/gold').once('value');
    
    const kuzelliumData = kuzelliumSnapshot.val();
    const goldData = goldSnapshot.val();
    
    console.log('現在の価格データ:');
    console.log('クーゼリアム:', kuzelliumData);
    console.log('ゴールド:', goldData);
    
    const results = {
      checked: timestamp,
      time: now.toISOString(),
      kuzellium: { status: 'ok', action: 'none' },
      gold: { status: 'ok', action: 'none' }
    };
    
    // クーゼリアムの価格をチェック
    if (!kuzelliumData || !kuzelliumData.updatedAt) {
      console.log('クーゼリアムの価格データが存在しないか不完全です。初期化します。');
      results.kuzellium.status = 'missing';
      results.kuzellium.action = 'initialized';
      
      // 初期値で設定
      await rtdb.ref('prices/kuzellium').set({
        price: PRICE_CONFIG.kuzellium.initialPrice,
        initialPrice: PRICE_CONFIG.kuzellium.initialPrice,
        changePercent: 0,
        updatedAt: timestamp
      });
      
      // 履歴にも追加
      await rtdb.ref(`priceHistory/kuzellium/${timestamp}`).set({
        price: PRICE_CONFIG.kuzellium.initialPrice,
        timestamp: timestamp,
        autoRepair: true
      });
    } else {
      // 最終更新からの経過時間（分）
      const minutesSinceUpdate = (timestamp - kuzelliumData.updatedAt) / (1000 * 60);
      results.kuzellium.lastUpdated = new Date(kuzelliumData.updatedAt).toISOString();
      results.kuzellium.minutesSinceUpdate = Math.round(minutesSinceUpdate);
      
      // 5分以上更新がない場合は手動で更新
      if (minutesSinceUpdate >= 5) {
        console.log(`クーゼリアム価格が${minutesSinceUpdate.toFixed(1)}分間更新されていません。手動で更新します。`);
        results.kuzellium.status = 'stale';
        results.kuzellium.action = 'updated';
        
        // 新しい価格を計算して更新
        const priceResult = calculateKuzelliumPrice(PRICE_CONFIG.kuzellium);
        
        await rtdb.ref('prices/kuzellium').set({
          price: priceResult.price,
          initialPrice: PRICE_CONFIG.kuzellium.initialPrice,
          changePercent: priceResult.changePercent,
          updatedAt: timestamp,
          autoRepair: true
        });
        
        // 履歴にも追加
        await rtdb.ref(`priceHistory/kuzellium/${timestamp}`).set({
          price: priceResult.price,
          timestamp: timestamp,
          autoRepair: true
        });
        
        results.kuzellium.newPrice = priceResult.price;
      }
    }
    
    // ゴールドの価格をチェック
    if (!goldData || !goldData.updatedAt) {
      console.log('ゴールドの価格データが存在しないか不完全です。初期化します。');
      results.gold.status = 'missing';
      results.gold.action = 'initialized';
      
      // 初期値で設定
      await rtdb.ref('prices/gold').set({
        price: PRICE_CONFIG.gold.initialPrice,
        initialPrice: PRICE_CONFIG.gold.initialPrice,
        changePercent: 0,
        updatedAt: timestamp
      });
      
      // 履歴にも追加
      await rtdb.ref(`priceHistory/gold/${timestamp}`).set({
        price: PRICE_CONFIG.gold.initialPrice,
        timestamp: timestamp,
        autoRepair: true
      });
    } else {
      // 最終更新からの経過時間（分）
      const minutesSinceUpdate = (timestamp - goldData.updatedAt) / (1000 * 60);
      results.gold.lastUpdated = new Date(goldData.updatedAt).toISOString();
      results.gold.minutesSinceUpdate = Math.round(minutesSinceUpdate);
      
      // 15分以上更新がない場合は手動で更新
      if (minutesSinceUpdate >= 15) {
        console.log(`ゴールド価格が${minutesSinceUpdate.toFixed(1)}分間更新されていません。手動で更新します。`);
        results.gold.status = 'stale';
        results.gold.action = 'updated';
        
        // 新しい価格を計算して更新
        const priceResult = calculateGoldPrice(PRICE_CONFIG.gold);
        
        await rtdb.ref('prices/gold').set({
          price: priceResult.price,
          initialPrice: PRICE_CONFIG.gold.initialPrice,
          changePercent: priceResult.changePercent,
          updatedAt: timestamp,
          autoRepair: true
        });
        
        // 履歴にも追加
        await rtdb.ref(`priceHistory/gold/${timestamp}`).set({
          price: priceResult.price,
          timestamp: timestamp,
          autoRepair: true
        });
        
        results.gold.newPrice = priceResult.price;
      }
    }
    
    // トリガーの更新状態も確認
    const triggerSnapshot = await rtdb.ref('triggers/priceUpdate').once('value');
    const triggerData = triggerSnapshot.val();
    
    results.trigger = {
      exists: !!triggerData,
      lastUpdated: triggerData ? new Date(triggerData.timestamp).toISOString() : null
    };
    
    // トリガーが存在しないか、30分以上更新されていない場合は更新
    if (!triggerData || (timestamp - triggerData.timestamp) > (30 * 60 * 1000)) {
      console.log('トリガーが存在しないか、古くなっています。更新します。');
      results.trigger.status = 'stale';
      results.trigger.action = 'updated';
      
      await rtdb.ref('triggers/priceUpdate').set({
        timestamp: timestamp,
        minute: now.getMinutes(),
        second: now.getSeconds(),
        source: 'monitor'
      });
    } else {
      results.trigger.status = 'ok';
      results.trigger.action = 'none';
    }
    
    // 監視実行をログに記録
    await rtdb.ref(`monitorLogs/${timestamp}`).set({
      timestamp: timestamp,
      results: results
    });
    
    // 古いログを削除（最新の20件のみ保持）
    const logsSnapshot = await rtdb.ref('monitorLogs')
      .orderByKey()
      .limitToLast(21)
      .once('value');
    
    const logsData = logsSnapshot.val() || {};
    const logsKeys = Object.keys(logsData).sort();
    
    if (logsKeys.length > 20) {
      await rtdb.ref(`monitorLogs/${logsKeys[0]}`).remove();
    }
    
    // 結果を返す
    res.json(results);
  } catch (error) {
    console.error('価格監視関数のエラー:', error);
    res.status(500).json({ error: '価格監視に失敗しました', details: error.message });
  }
});

// システム状態を取得するHTTP関数
exports.getSystemStatus = functions.https.onRequest(async (req, res) => {
  console.log('===== システム状態取得関数が実行されました =====');
  
  try {
    const rtdb = admin.database();
    const now = new Date();
    const timestamp = now.getTime();
    
    // システム状態を収集
    const status = {
      timestamp: timestamp,
      time: now.toISOString(),
      database: {},
      prices: {},
      config: PRICE_CONFIG
    };
    
    // データベース接続状態を確認
    try {
      const connectedSnapshot = await rtdb.ref('.info/connected').once('value');
      status.database.connected = connectedSnapshot.val() === true;
    } catch (connError) {
      status.database.connected = false;
      status.database.connectionError = connError.message;
    }
    
    // データベースのルート構造を取得
    try {
      const rootSnapshot = await rtdb.ref('/').once('value');
      const rootData = rootSnapshot.val() || {};
      status.database.rootNodes = Object.keys(rootData);
    } catch (rootError) {
      status.database.rootError = rootError.message;
    }
    
    // 価格データを取得
    try {
      const pricesSnapshot = await rtdb.ref('prices').once('value');
      const pricesData = pricesSnapshot.val() || {};
      
      status.prices.data = pricesData;
      
      // 各資産の最終更新時刻とそこからの経過時間
      for (const assetType of ['kuzellium', 'gold']) {
        if (pricesData[assetType] && pricesData[assetType].updatedAt) {
          const lastUpdate = pricesData[assetType].updatedAt;
          const minutesAgo = (timestamp - lastUpdate) / (1000 * 60);
          
          status.prices[assetType] = {
            lastUpdated: new Date(lastUpdate).toISOString(),
            minutesAgo: Math.round(minutesAgo * 10) / 10,
            fresh: minutesAgo < (assetType === 'kuzellium' ? 5 : 15)
          };
        } else {
          status.prices[assetType] = {
            exists: false,
            fresh: false
          };
        }
      }
    } catch (pricesError) {
      status.prices.error = pricesError.message;
    }
    
    // 履歴データの件数を取得
    try {
      const kuzelliumHistorySnapshot = await rtdb.ref('priceHistory/kuzellium').once('value');
      const goldHistorySnapshot = await rtdb.ref('priceHistory/gold').once('value');
      
      status.priceHistory = {
        kuzellium: Object.keys(kuzelliumHistorySnapshot.val() || {}).length,
        gold: Object.keys(goldHistorySnapshot.val() || {}).length
      };
    } catch (historyError) {
      status.priceHistory = { error: historyError.message };
    }
    
    // トリガーの状態を取得
    try {
      const triggerSnapshot = await rtdb.ref('triggers/priceUpdate').once('value');
      const triggerData = triggerSnapshot.val();
      
      if (triggerData) {
        const lastUpdate = triggerData.timestamp;
        const minutesAgo = (timestamp - lastUpdate) / (1000 * 60);
        
        status.trigger = {
          exists: true,
          lastUpdated: new Date(lastUpdate).toISOString(),
          minutesAgo: Math.round(minutesAgo * 10) / 10,
          fresh: minutesAgo < 5,
          data: triggerData
        };
      } else {
        status.trigger = {
          exists: false,
          fresh: false
        };
      }
    } catch (triggerError) {
      status.trigger = { error: triggerError.message };
    }
    
    // Cloud Functionsの一般情報
    status.functions = {
      region: process.env.FUNCTION_REGION || 'unknown',
      memory: process.env.FUNCTION_MEMORY_MB || 'unknown',
      timeoutSeconds: process.env.FUNCTION_TIMEOUT_SECONDS || 'unknown'
    };
    
    res.json(status);
  } catch (error) {
    console.error('システム状態取得エラー:', error);
    res.status(500).json({ error: 'システム状態の取得に失敗しました', details: error.message });
  }
});