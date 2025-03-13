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
