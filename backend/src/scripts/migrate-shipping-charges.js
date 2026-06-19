/**
 * migrate-shipping-charges.js
 *
 * One-time script: updates the ShippingSettings document to the new flat-rate
 * shipping policy:
 *   - Flat ₹185 for all orders ≤ ₹999 (both prepaid & COD)
 *   - Free shipping for all orders > ₹999 (both prepaid & COD)
 *
 * Run once on production:
 *   node backend/src/scripts/migrate-shipping-charges.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ShippingSettings = require('../models/ShippingSettings');

async function migrate() {
  await connectDB();

  const result = await ShippingSettings.findOneAndUpdate(
    {},
    {
      $set: {
        prepaidFreeThreshold: 999,
        prepaidCharge:        185,
        codEnabled:           true,
        codThreshold:         999,
        codChargeBelow:       185,
        codChargeAbove:       0,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log('✓ ShippingSettings updated:');
  console.log(`  prepaidFreeThreshold : ${result.prepaidFreeThreshold}`);
  console.log(`  prepaidCharge        : ₹${result.prepaidCharge}`);
  console.log(`  codThreshold         : ${result.codThreshold}`);
  console.log(`  codChargeBelow       : ₹${result.codChargeBelow}`);
  console.log(`  codChargeAbove       : ₹${result.codChargeAbove}`);
  console.log(`  codEnabled           : ${result.codEnabled}`);

  await mongoose.disconnect();
  console.log('\nDone. MongoDB disconnected.');
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
