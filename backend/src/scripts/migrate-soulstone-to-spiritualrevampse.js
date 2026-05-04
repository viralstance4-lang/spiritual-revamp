require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// One-time DB migration: rename old branding values to new branding.
// NOTE: The old string literals below ('SOULSTONE20', '@soulstone.internal')
// are intentional — they are the exact values stored in the DB that need updating.
async function migrate() {
  await connectDB();

  // 1. Rename coupon code → SPIRITUALREVAMPSE20
  const Coupon = require('../models/Coupon');
  const couponResult = await Coupon.updateOne(
    { code: 'SOULSTONE20' },
    { $set: { code: 'SPIRITUALREVAMPSE20' } }
  );
  if (couponResult.matchedCount > 0) {
    console.log('✅ Coupon renamed to SPIRITUALREVAMPSE20');
  } else {
    console.log('ℹ️  Old coupon not found (may already be renamed or not seeded)');
  }

  // 2. Update phone-only user placeholder emails to new domain
  const User = require('../models/User');
  const users = await User.find({ email: /@soulstone\.internal$/ });
  let updatedUsers = 0;
  for (const user of users) {
    const newEmail = user.email.replace('@soulstone.internal', '@spiritualrevampse.internal');
    await User.findByIdAndUpdate(user._id, { $set: { email: newEmail } });
    updatedUsers++;
  }
  console.log(`✅ Updated ${updatedUsers} user placeholder email(s) to @spiritualrevampse.internal`);

  console.log('\n🎉 Migration complete.');
  mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
