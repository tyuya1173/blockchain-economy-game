// functions/admin/userManagement.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const db = admin.firestore();

module.exports = {
  onNewUser: functions.auth.user().onCreate(async (user) => {
    try {
      await db.collection('users').doc(user.uid).set({
        username: user.displayName || `User_${Math.random().toString(36).substr(2, 9)}`,
        email: user.email,
        role: 'player',
        assets: {
          labDollar: 1000,
          kuzellium: 5,
          gold: 1,
        },
        createdAt: admin.firestore.Timestamp.now(),
        lastLogin: admin.firestore.Timestamp.now(),
        totalGameParticipation: 0
      });

      console.log(`New user ${user.uid} created with initial assets`);

      // Optional: Send welcome notification or trigger initial game onboarding
      // This could be implemented via Cloud Messaging or other notification services
    } catch (error) {
      console.error('Error creating new user:', error);
    }
  })
};