require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);

  const sellers = await User.find({ role: 'seller' }).select('name email sellerProfile.status');
  console.log('\n===== ALL SELLERS =====');
  sellers.forEach((s) => console.log(`- ${s.name} (${s.email}) — status: ${s.sellerProfile?.status}`));

  const allProducts = await Product.find().populate('seller', 'email').select('name status seller createdAt').sort({ createdAt: -1 }).limit(20);
  console.log('\n===== LAST 20 PRODUCTS IN DATABASE =====');
  if (allProducts.length === 0) {
    console.log('❌ ZERO products exist in the database.');
  } else {
    allProducts.forEach((p) => {
      console.log(`- "${p.name}" | status: ${p.status} | seller: ${p.seller?.email || 'MISSING'} | created: ${p.createdAt}`);
    });
  }
  process.exit();
}

check().catch((err) => { console.error('Script error:', err.message); process.exit(1); });