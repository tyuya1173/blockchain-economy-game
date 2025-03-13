const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
// const auth = admin.auth();

exports.updateKuzelliumPrice =
functions.pubsub.schedule("every 5 minutes")
    .onRun(async (context) => {
      const ref = db.collection("marketData").doc("currentPrices");
      const doc = await ref.get();

      if (!doc.exists) return;

      const kuzelliumPrice = doc.data().kuzellium.price;
      const changePercent = (Math.random() * 0.6 - 0.3); // ±30%変動
      const newPrice = Math.max(1, kuzelliumPrice * (1 + changePercent));

      await ref.update({
        "kuzellium.price": newPrice,
        "kuzellium.changePercent": changePercent * 100,
        "kuzellium.updatedAt": admin.firestore.Timestamp.now(),
      });

      console.log(`Kuzellium price updated: ${newPrice}`);
    });

exports.updateGoldPrice =
functions
    .pubsub
    .schedule("every 15 minutes").onRun(async (context) => {
      const ref = db.collection("marketData").doc("currentPrices");
      const doc = await ref.get();

      if (!doc.exists) return;

      const goldPrice = doc.data().gold.price;
      const newPrice = goldPrice * 1.10; // 10%増加

      await ref.update({
        "gold.price": newPrice,
        "gold.updatedAt": admin.firestore.Timestamp.now(),
      });

      console.log(`Gold price updated: ${newPrice}`);
    });

exports.startGame = functions.https.onRequest(async (req, res) => {
  await db.collection("gameState").doc("status").set({
    status: "active",
    currentPhase: 1,
    startTime: admin.firestore.Timestamp.now(),
  });

  res.json({message: "Game started"});
});

exports.endGame = functions.https.onRequest(async (req, res) => {
  await db.collection("gameState").doc("status").update({
    status: "finished",
    endTime: admin.firestore.Timestamp.now(),
  });

  res.json({message: "Game ended"});
});

exports.advancePhase = functions.https.onRequest(async (req, res) => {
  const gameRef = db.collection("gameState").doc("status");
  const doc = await gameRef.get();

  if (!doc.exists) return res.status(404).json({error: "Game not found"});

  const currentPhase = doc.data().currentPhase;

  if (currentPhase >= 5) {
    return res.json(
        {message: "Game already in final phase"},
    );
  }

  await gameRef.update({currentPhase: currentPhase + 1});

  res.json({message: `Phase advanced to ${currentPhase + 1}`});
});

exports.onNewUser = functions.auth.user().onCreate(async (user) => {
  await db.collection("users").doc(user.uid).set({
    username: user.displayName || "Anonymous",
    role: "player",
    assets: {
      labDollar: 1000,
      kuzellium: 5,
      gold: 1,
    },
    createdAt: admin.firestore.Timestamp.now(),
  });

  console.log(`New user ${user.uid} created with initial assets`);
});

exports.onTradeComplete =
functions
    .firestore
    .document("transactions/{transactionId}")
    .onCreate(async (snap, context) => {
      const transaction = snap.data();
      const blockRef = db.collection("blocks").doc();

      await blockRef.set({
        index: context.params.transactionId,
        timestamp: admin.firestore.Timestamp.now(),
        transactions: [transaction],
        previousHash: "TODO: Calculate previous block hash",
        hash: "TODO: Calculate block hash",
        nonce: 0,
      });

      console.log(
          `Transaction ${context.params.transactionId} 
        added to blockchain`);
    });

exports.onMiningSuccess =
functions
    .firestore
    .document("miningChallenges/{challengeId}/submissions/{submissionId}")
    .onCreate(async (snap, context) => {
      const submission = snap.data();
      const userRef = db.collection("users").doc(submission.userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) return;

      const newBalance =
      (userDoc.data().assets.kuzellium || 0) +
      submission.reward;

      await userRef.update({
        "assets.kuzellium": newBalance,
      });

      console.log(
          `User ${submission.userId} 
        mined successfully, reward: ${submission.reward}`,
      );
    });
