const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const db = admin.firestore();

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
    updateInterval: '* * * * *'  // 1分ごとに実行
  },
  gold: {
    initialPrice: 8000,  // 初期価格
    volatility: 0.1,     // ±10%の緩やかな変動
    minPrice: 4000,      // 最小価格
    updateInterval: '* * * * *', // 1分ごとに実行
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

module.exports = {
  // ゲーム開始関数
  startGame: functions.https.onCall(async (data, context) => {
    try {
      // 管理者権限チェック
      const uid = context.auth.uid;
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          '管理者権限が必要です'
        );
      }
      
      // 参加者リストを取得
      const participantIds = data.participantIds || [];
      
      // 現在時刻
      const now = admin.firestore.Timestamp.now();
      
      // 現在のゲーム状態をチェック
      const currentGameStateRef = db.collection('gameState').doc('current');
      const currentGameState = await currentGameStateRef.get();
      
      if (currentGameState.exists && currentGameState.data().status === 'finished') {
        // 終了したゲームの履歴を保存
        const oldGameData = currentGameState.data();
        await db.collection('gameHistory').doc(oldGameData.endTime.toDate().toISOString()).set({
          ...oldGameData,
          archivedAt: now
        });
        
        console.log('前回のゲーム結果を履歴に保存しました');
      }
      
      // フェーズの持続時間（分）
      const phaseDurations = [0, 10, 15, 15, 10, 10]; // フェーズ0は使用しない
      
      // 各フェーズの終了時間を計算
      const phaseEndTimes = {};
      let accumulatedMinutes = 0;
      
      for (let i = 1; i <= 5; i++) {
        accumulatedMinutes += phaseDurations[i];
        phaseEndTimes[`phase${i}`] = admin.firestore.Timestamp.fromDate(
          new Date(now.toDate().getTime() + accumulatedMinutes * 60 * 1000)
        );
      }
      
      // ゲーム状態を更新
      await currentGameStateRef.set({
        status: 'active',
        currentPhase: 1,
        startTime: now,
        phaseEndTimes: phaseEndTimes,
        participantIds: participantIds,
        totalParticipants: participantIds.length,
        expectedEndTime: phaseEndTimes.phase5 // 最終フェーズの終了時間
      });
      
      // 参加者のステータスを更新
      const batch = db.batch();
      for (const userId of participantIds) {
        const userRef = db.collection('users').doc(userId);
        batch.update(userRef, { 
          gameParticipant: true,
          lastGameJoined: now
        });
      }
      await batch.commit();
      
      // システムログに記録
      await db.collection('systemLogs').add({
        type: 'game',
        title: 'ゲーム開始',
        message: `${participantIds.length}人の参加者でゲームが開始されました`,
        timestamp: now,
        details: {
          participants: participantIds.length,
          phase: 1,
          startTime: now
        }
      });
      
      // 価格初期化処理を直接記述
      const rtdb = admin.database();
      const priceTimestamp = Date.now();

      // クーゼリアムの初期価格設定
      await rtdb.ref('prices/kuzellium').set({
        price: PRICE_CONFIG.kuzellium.initialPrice,
        initialPrice: PRICE_CONFIG.kuzellium.initialPrice,
        changePercent: 0,
        updatedAt: priceTimestamp
      });

      // 金の初期価格設定
      await rtdb.ref('prices/gold').set({
        price: PRICE_CONFIG.gold.initialPrice,
        initialPrice: PRICE_CONFIG.gold.initialPrice,
        changePercent: 0,
        updatedAt: priceTimestamp
      });

      // 価格履歴の初期データ作成
      await rtdb.ref(`priceHistory/kuzellium/${priceTimestamp}`).set({
        price: PRICE_CONFIG.kuzellium.initialPrice,
        timestamp: priceTimestamp
      });

      await rtdb.ref(`priceHistory/gold/${priceTimestamp}`).set({
        price: PRICE_CONFIG.gold.initialPrice,
        timestamp: priceTimestamp
      });

      // 更新トリガーもリセット
      await rtdb.ref('triggers/priceUpdate').set({
        timestamp: priceTimestamp,
        minute: new Date().getMinutes(),
        reset: true
      });
      
      return {
        success: true,
        message: 'ゲームが開始されました',
        gameState: {
          status: 'active',
          currentPhase: 1,
          participants: participantIds.length
        }
      };
      
    } catch (error) {
      console.error('Error starting game:', error);
      throw new functions.https.HttpsError(
        'internal',
        'ゲーム開始に失敗しました',
        error
      );
    }
  }),

  // ゲーム終了関数
  endGame: functions.https.onCall(async (data, context) => {
    try {
      // 管理者権限チェック
      const uid = context.auth.uid;
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          '管理者権限が必要です'
        );
      }
      
      // 現在時刻
      const now = admin.firestore.Timestamp.now();
      
      // ゲーム状態を更新
      await db.collection('gameState').doc('current').update({
        status: 'finished',
        endTime: now
      });
      
      // ゲーム結果を計算
      const gameStateDoc = await db.collection('gameState').doc('current').get();
      const gameState = gameStateDoc.data();
      const participantIds = gameState.participantIds || [];
      
      // 最新の市場価格を取得
      const rtdb = admin.database();
      const kuzelliumSnapshot = await rtdb.ref('prices/kuzellium').once('value');
      const goldSnapshot = await rtdb.ref('prices/gold').once('value');
      
      const kuzelliumPrice = kuzelliumSnapshot.val()?.price || PRICE_CONFIG.kuzellium.initialPrice;
      const goldPrice = goldSnapshot.val()?.price || PRICE_CONFIG.gold.initialPrice;
      
      // 参加者の資産を取得
      const usersSnapshot = await db.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', participantIds)
        .get();
      
      const rankings = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        // 各資産を円換算
        const labDollarValue = (userData.assets.labDollar || 0) * 100; // 1LD = 100円
        
        const kuzelliumValue = (userData.assets.kuzellium || 0) * kuzelliumPrice;
        const goldValue = (userData.assets.gold || 0) * goldPrice;
        
        const totalAssetValue = labDollarValue + kuzelliumValue + goldValue;
        
        rankings.push({
          userId: doc.id,
          username: userData.username,
          displayName: userData.displayName || userData.username,
          assets: {
            labDollar: userData.assets.labDollar || 0,
            kuzellium: userData.assets.kuzellium || 0,
            gold: userData.assets.gold || 0
          },
          assetValues: {
            labDollar: labDollarValue,
            kuzellium: kuzelliumValue,
            gold: goldValue
          },
          totalAssetValue: totalAssetValue
        });
      });
      
      // 資産価値で降順ソート
      rankings.sort((a, b) => b.totalAssetValue - a.totalAssetValue);
      
      // 最終ランキングを保存
      await db.collection('gameResults').doc(now.toDate().toISOString()).set({
        gameId: gameStateDoc.id,
        rankings: rankings,
        participantCount: participantIds.length,
        startTime: gameState.startTime,
        endTime: now,
        timestamp: now,
        finalPrices: {
          kuzellium: kuzelliumPrice,
          gold: goldPrice
        }
      });
      
      // システムログに記録
      await db.collection('systemLogs').add({
        type: 'game',
        title: 'ゲーム終了',
        message: `ゲームが終了し、最終結果が計算されました`,
        timestamp: now,
        details: {
          participants: participantIds.length,
          duration: (now.toDate() - gameState.startTime.toDate()) / (1000 * 60), // 分単位
          winner: rankings.length > 0 ? rankings[0].displayName : '該当者なし',
          topScore: rankings.length > 0 ? rankings[0].totalAssetValue : 0
        }
      });
      
      return {
        success: true,
        message: 'ゲームが終了しました',
        rankings: rankings.slice(0, 10), // 上位10名のみ返す
        totalParticipants: participantIds.length
      };
      
    } catch (error) {
      console.error('Error ending game:', error);
      throw new functions.https.HttpsError(
        'internal',
        'ゲーム終了に失敗しました',
        error
      );
    }
  }),

  // フェーズ進行関数
  advancePhase: functions.https.onCall(async (data, context) => {
    try {
      // 管理者権限チェック
      const uid = context.auth.uid;
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          '管理者権限が必要です'
        );
      }
      
      // ゲーム状態を取得
      const gameRef = db.collection('gameState').doc('current');
      const gameDoc = await gameRef.get();
      
      if (!gameDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'ゲームが見つかりません'
        );
      }
      
      const gameData = gameDoc.data();
      const currentPhase = gameData.currentPhase;
      
      if (gameData.status !== 'active') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'ゲームがアクティブではありません'
        );
      }
      
      if (currentPhase >= 5) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'すでに最終フェーズです'
        );
      }
      
      // 次のフェーズに進む
      const nextPhase = currentPhase + 1;
      const now = admin.firestore.Timestamp.now();
      
      await gameRef.update({
        currentPhase: nextPhase,
        [`phaseStartTimes.phase${nextPhase}`]: now
      });
      
      // システムログに記録
      await db.collection('systemLogs').add({
        type: 'game',
        title: 'フェーズ進行',
        message: `フェーズ${currentPhase}からフェーズ${nextPhase}に進行しました`,
        timestamp: now,
        details: {
          previousPhase: currentPhase,
          newPhase: nextPhase,
          changedAt: now
        }
      });
      
      return {
        success: true,
        message: `フェーズ${nextPhase}に進行しました`,
        newPhase: nextPhase
      };
      
    } catch (error) {
      console.error('Error advancing phase:', error);
      throw new functions.https.HttpsError(
        'internal',
        'フェーズ進行に失敗しました',
        error
      );
    }
  }),

  // 市場価格の初期化関数
  initializeMarketPrices: functions.https.onCall(async (data, context) => {
    try {
      // 管理者権限チェック
      const uid = context.auth.uid;
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          '管理者権限が必要です'
        );
      }
      
      console.log('===== 市場価格初期化関数が実行されました =====');
      
      // Realtime Databaseインスタンス
      const rtdb = admin.database();
      const timestamp = Date.now();
      const now = admin.firestore.Timestamp.now();
      
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
      await rtdb.ref('prices/kuzellium').set({
        price: kuzelliumPrice,
        initialPrice: kuzelliumPrice,
        changePercent: 0,
        updatedAt: timestamp
      });
      
      console.log('ゴールド価格を初期化中...');
      await rtdb.ref('prices/gold').set({
        price: goldPrice,
        initialPrice: goldPrice,
        changePercent: 0,
        updatedAt: timestamp
      });
      
      // 価格履歴の初期データ作成
      console.log('クーゼリアム価格履歴を初期化中...');
      await rtdb.ref(`priceHistory/kuzellium/${timestamp}`).set({
        price: kuzelliumPrice,
        timestamp: timestamp
      });
      
      console.log('ゴールド価格履歴を初期化中...');
      await rtdb.ref(`priceHistory/gold/${timestamp}`).set({
        price: goldPrice,
        timestamp: timestamp
      });
      
      // 更新トリガーもリセット
      console.log('更新トリガーをリセット中...');
      await rtdb.ref('triggers/priceUpdate').set({
        timestamp: timestamp,
        minute: new Date().getMinutes(),
        reset: true
      });
      
      // システムログに記録
      await db.collection('systemLogs').add({
        type: 'market',
        title: '市場価格初期化',
        message: '市場価格が初期値にリセットされました',
        timestamp: now,
        details: {
          kuzelliumPrice,
          goldPrice
        }
      });
      
      return { 
        success: true,
        message: '市場価格を初期化しました',
        timestamp: new Date(timestamp).toISOString(),
        initialPrices: {
          kuzellium: kuzelliumPrice,
          gold: goldPrice
        }
      };
      
    } catch (error) {
      console.error('市場価格初期化エラー:', error);
      throw new functions.https.HttpsError(
        'internal',
        '市場価格の初期化に失敗しました',
        error.message
      );
    }
  }),

  // イベントによる市場価格変動関数 - HTTP関数からCallable関数に変更
  triggerMarketEvent: functions.https.onCall(async (data, context) => {
    try {
      // 管理者権限チェック
      const uid = context.auth.uid;
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          '管理者権限が必要です'
        );
      }
      
      const { eventType, assetType, effectPercent } = data;
      
      // パラメータ検証
      if (!eventType || !assetType || effectPercent === undefined) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          '必須パラメータが不足しています'
        );
      }
      
      if (assetType !== 'kuzellium' && assetType !== 'gold') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          '無効な資産タイプです'
        );
      }
      
      const rtdb = admin.database();
      
      // 現在の価格を取得
      console.log(`現在の${assetType}価格を取得中...`);
      const priceSnapshot = await rtdb.ref(`prices/${assetType}`).once('value');
      
      if (!priceSnapshot.exists()) {
        throw new functions.https.HttpsError(
          'not-found',
          '価格データが見つかりません'
        );
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
      const now = admin.firestore.Timestamp.now();
      
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
      
      // 価格履歴に追加
      console.log(`価格履歴に追加中: priceHistory/${assetType}/${timestamp}`);
      await rtdb.ref(`priceHistory/${assetType}/${timestamp}`).set({
        price: newPrice,
        timestamp: timestamp,
        eventDriven: true,
        eventType: eventType
      });
      
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
      
      // システムログに記録
      await db.collection('systemLogs').add({
        type: 'market',
        title: 'マーケットイベント発生',
        message: `${eventType}イベントにより${assetType}の価格が${effectPercent > 0 ? '上昇' : '下落'}しました`,
        timestamp: now,
        details: {
          eventType,
          assetType,
          effectPercent,
          previousPrice: currentPrice,
          newPrice: newPrice
        }
      });
      
      return {
        success: true,
        message: 'イベントによる価格変動を実行しました',
        eventType,
        assetType,
        previousPrice: currentPrice,
        newPrice: newPrice,
        changePercent: effectPercent
      };
      
    } catch (error) {
      console.error('Error triggering market event:', error);
      throw new functions.https.HttpsError(
        'internal',
        'イベント実行に失敗しました',
        error.message
      );
    }
  }),

  // 手動で価格を更新する関数 - HTTP関数からCallable関数に変更
  manualUpdatePrice: functions.https.onCall(async (data, context) => {
    try {
      // 管理者権限チェック
      const uid = context.auth.uid;
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          '管理者権限が必要です'
        );
      }
      
      const { assetType, price } = data;
      
      // パラメータ検証
      if (!assetType) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          '資産タイプが必要です'
        );
      }
      
      if (assetType !== 'kuzellium' && assetType !== 'gold') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          '無効な資産タイプです'
        );
      }
      
      if (!price || price <= 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          '有効な価格を指定してください'
        );
      }
      
      const rtdb = admin.database();
      const timestamp = Date.now();
      const now = admin.firestore.Timestamp.now();
      
      let newPrice = price;
      
      // 初期価格との変動率を計算
      const changePercent = ((newPrice - PRICE_CONFIG[assetType].initialPrice) / PRICE_CONFIG[assetType].initialPrice) * 100;
      
      // 現在の価格を更新
      console.log(`新しい価格でprices/${assetType}を更新中...`);
      await rtdb.ref(`prices/${assetType}`).set({
        price: newPrice,
        initialPrice: PRICE_CONFIG[assetType].initialPrice,
        changePercent: changePercent,
        updatedAt: timestamp,
        manualUpdate: true
      });
      
      // 価格履歴に追加
      console.log(`価格履歴に追加中: priceHistory/${assetType}/${timestamp}`);
      await rtdb.ref(`priceHistory/${assetType}/${timestamp}`).set({
        price: newPrice,
        timestamp: timestamp,
        manualUpdate: true
      });
      
      // システムログに記録
      await db.collection('systemLogs').add({
        type: 'market',
        title: '手動価格更新',
        message: `${assetType}の価格が手動で更新されました`,
        timestamp: now,
        details: {
          assetType,
          oldPrice: 'N/A', // 以前の価格情報
          newPrice,
          changePercent
        }
      });
      
      return {
        success: true,
        message: `${assetType} の価格を手動で更新しました`,
        newPrice: newPrice,
        changePercent: changePercent
      };
      
    } catch (error) {
      console.error('Error manually updating price:', error);
      throw new functions.https.HttpsError(
        'internal',
        '価格更新に失敗しました',
        error.message
      );
    }
  })
};