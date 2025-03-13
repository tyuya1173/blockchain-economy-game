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
