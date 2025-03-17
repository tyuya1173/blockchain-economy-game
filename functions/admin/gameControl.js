// functions/admin/gameControl.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const db = admin.firestore();

module.exports = {
  startGame: functions.https.onRequest(async (req, res) => {
    try {
      await db.collection('gameState').doc('status').set({
        status: 'active',
        currentPhase: 1,
        startTime: admin.firestore.Timestamp.now(),
        phaseEndTimes: {
          phase1: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24時間後
          phase2: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
          phase3: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
          phase4: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000))
        }
      });

      res.json({ message: 'Game started successfully' });
    } catch (error) {
      console.error('Error starting game:', error);
      res.status(500).json({ error: 'Failed to start game' });
    }
  }),

  endGame: functions.https.onRequest(async (req, res) => {
    try {
      await db.collection('gameState').doc('status').update({
        status: 'finished',
        endTime: admin.firestore.Timestamp.now()
      });

      // Optional: Calculate and record final rankings
      const usersSnapshot = await db.collection('users').get();
      const rankings = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const totalAssetValue = 
          (userData.assets.labDollar || 0) * 100 + 
          (userData.assets.kuzellium || 0) * 500 + 
          (userData.assets.gold || 0) * 8000;
        
        rankings.push({
          userId: doc.id,
          username: userData.username,
          totalAssetValue
        });
      });

      // Sort rankings and store top performers
      rankings.sort((a, b) => b.totalAssetValue - a.totalAssetValue);
      await db.collection('gameResults').doc('finalRankings').set({
        rankings: rankings.slice(0, 10),
        timestamp: admin.firestore.Timestamp.now()
      });

      res.json({ message: 'Game ended successfully', topRankings: rankings.slice(0, 10) });
    } catch (error) {
      console.error('Error ending game:', error);
      res.status(500).json({ error: 'Failed to end game' });
    }
  }),

  advancePhase: functions.https.onRequest(async (req, res) => {
    try {
      const gameRef = db.collection('gameState').doc('status');
      const doc = await gameRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const currentData = doc.data();
      const currentPhase = currentData.currentPhase;

      if (currentPhase >= 5) {
        return res.json({ message: 'Game already in final phase' });
      }

      await gameRef.update({ 
        currentPhase: currentPhase + 1,
        currentPhaseStartTime: admin.firestore.Timestamp.now()
      });

      res.json({ 
        message: `Phase advanced to ${currentPhase + 1}`,
        newPhase: currentPhase + 1
      });
    } catch (error) {
      console.error('Error advancing phase:', error);
      res.status(500).json({ error: 'Failed to advance phase' });
    }
  })
};
