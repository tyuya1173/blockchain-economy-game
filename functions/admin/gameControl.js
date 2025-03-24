const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const db = admin.firestore();

module.exports = {
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
      await db.collection('gameState').doc('current').set({
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
      
      // 参加者の資産を取得
      const usersSnapshot = await db.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', participantIds)
        .get();
      
      const rankings = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        // 各資産を円換算
        const labDollarValue = (userData.assets.labDollar || 0) * 100; // 1LD = 100円
        
        // 市場価格を取得（実際には別の方法で現在の価格を取得する必要あり）
        const kuzelliumPrice = 500; // 仮の価格
        const goldPrice = 8000; // 仮の価格
        
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
        timestamp: now
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
  })
};