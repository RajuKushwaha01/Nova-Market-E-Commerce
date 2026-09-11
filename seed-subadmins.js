require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const accounts = [
  { name: 'Product Manager', email: 'product@gmail.com', role: 'product_manager' },
  { name: 'Order Manager', email: 'order@gmail.com', role: 'order_manager' },
  { name: 'Finance Manager', email: 'finance@gmail.com', role: 'finance_manager' },
  { name: 'Support Manager', email: 'support@gmail.com', role: 'support_manager' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  for (const acc of accounts) {
    const existing = await User.findOne({ email: acc.email });
    if (existing) { existing.role = acc.role; await existing.save(); }
    else await User.create({ name: acc.name, email: acc.email, password: '123456789', role: acc.role, isVerified: true });
    console.log(`✅ ${acc.role}: ${acc.email} / 123456789`);
  }

  process.exit();
}

seed();