/**
 * migrate-remove-single-from-names.js
 *
 * One-time script: removes the word "Single " (with trailing space) from the
 * beginning of any product name.
 *
 * Examples:
 *   "Single Panch Mukhi Rudraksh" → "Panch Mukhi Rudraksh"
 *   "Single Ganesh Rudraksh"      → "Ganesh Rudraksh"
 *
 * Products without "Single " at the start are untouched.
 *
 * Also patches the stored item names inside existing Order documents so the
 * order history reflects the corrected names.
 *
 * Run once on production:
 *   node backend/src/scripts/migrate-remove-single-from-names.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Order = require('../models/Order');

async function migrate() {
  await connectDB();

  // ── 1. Products ─────────────────────────────────────────────────────────────
  const singleProducts = await Product.find({ name: /^Single\s+/i }).select('_id name');

  if (singleProducts.length === 0) {
    console.log('✓ No products with "Single" prefix found — nothing to update.');
  } else {
    console.log(`Found ${singleProducts.length} product(s) with "Single" prefix:\n`);

    for (const product of singleProducts) {
      const oldName = product.name;
      const newName = oldName.replace(/^Single\s+/i, '').trim();

      await Product.findByIdAndUpdate(product._id, { name: newName });
      console.log(`  ✓ Product: "${oldName}" → "${newName}"`);
    }
  }

  // ── 2. Existing Order items ──────────────────────────────────────────────────
  // Find orders that contain at least one item whose name starts with "Single "
  const affectedOrders = await Order.find({ 'items.name': /^Single\s+/i })
    .select('_id orderId items');

  if (affectedOrders.length === 0) {
    console.log('\n✓ No orders with "Single" prefix in item names — nothing to patch.');
  } else {
    console.log(`\nPatching item names in ${affectedOrders.length} order(s):`);

    for (const order of affectedOrders) {
      let changed = false;

      const updatedItems = order.items.map(item => {
        if (/^Single\s+/i.test(item.name)) {
          const newName = item.name.replace(/^Single\s+/i, '').trim();
          console.log(`  Order #${order.orderId}: "${item.name}" → "${newName}"`);
          changed = true;
          item.name = newName;
        }
        return item;
      });

      if (changed) {
        await Order.findByIdAndUpdate(order._id, { items: updatedItems });
      }
    }
  }

  await mongoose.disconnect();
  console.log('\nDone. MongoDB disconnected.');
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
