// functions/index.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

// Import function modules
const marketFunctions = require('./market/priceUpdater');
const adminFunctions = require('./admin/gameControl');
const miningFunctions = require('./mining/rewardDistributor');
const tradingFunctions = require('./trading/ledgerRecorder');
const userFunctions = require('./admin/userManagement');
const tradingCallable = require('./trading/functionExports');
const transferAsset  = require('./trading/assetTransfer');
const recordToLedger = require('./trading/ledgerRecorder');

// Export all functions
module.exports = {
  ...marketFunctions,
  ...adminFunctions,
  ...miningFunctions,
  ...tradingFunctions,
  ...userFunctions,
  ...tradingCallable,
  ...transferAsset,
  ...recordToLedger
};