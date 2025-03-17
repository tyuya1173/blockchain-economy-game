// functions/mining/rewardDistributor.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const db = admin.firestore();

module.exports = {
  onMiningSuccess: functions.firestore
    .document('miningChallenges/{challengeId}/submissions/{submissionId}')
    .onCreate(async (snap, context) => {
      try {
        const submission = snap.data();
        const userRef = db.collection('users').doc(submission.userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) return;

        const currentKuzellium = userDoc.data().assets?.kuzellium || 0;
        const newBalance = currentKuzellium + submission.reward;

        await userRef.update({
          'assets.kuzellium': newBalance,
        });

        // Optional: Log mining history
        await db.collection('users').doc(submission.userId)
          .collection('miningHistory')
          .add({
            challengeId: context.params.challengeId,
            reward: submission.reward,
            timestamp: admin.firestore.Timestamp.now()
          });

        console.log(
          `User ${submission.userId} mined successfully, reward: ${submission.reward}`
        );
      } catch (error) {
        console.error('Error processing mining success:', error);
      }
    })
};
