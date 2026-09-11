require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = 'adminraju@gmail.com';   // ← change to your real email
  const password = '123456789';          // ← change to a strong password

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log('✅ Existing user promoted to admin:', email);
  } else {
    await User.create({
      name: 'NOVA Admin',
      email,
      password,
      role: 'admin',
      isVerified: true,
    });
    console.log('✅ Admin account created:', email);
  }

  console.log('   Login at http://localhost:5000/login?portal=admin');
  console.log('   Email:', email, ' Password:', password);
  process.exit();
}

seedAdmin();