require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Commission = require('./models/Commission');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Category.deleteMany({});

  const mobiles = await Category.create({ name: 'Mobiles', level: 0, order: 1, filters: ['Brand', 'RAM', 'Storage', 'Color'] });
  await Category.create({ name: 'Smartphones', parent: mobiles._id, level: 1 });
  await Category.create({ name: 'Accessories', parent: mobiles._id, level: 1 });

  await Category.create({ name: 'Electronics', level: 0, order: 2, filters: ['Brand', 'Screen Size'] });
  await Category.create({ name: 'Fashion', level: 0, order: 3, filters: ['Size', 'Color', 'Material'] });
  await Category.create({ name: 'Home', level: 0, order: 4 });
  await Category.create({ name: 'Appliances', level: 0, order: 5 });
  await Category.create({ name: 'Beauty', level: 0, order: 6 });
  await Category.create({ name: 'Sports', level: 0, order: 7 });
  await Category.create({ name: 'Books', level: 0, order: 8 });

  console.log('✅ Categories seeded');

  const allCats = await Category.find({ level: 0 });
  await Commission.deleteMany({});
  for (const cat of allCats) {
    await Commission.create({ category: cat._id, commissionPercent: 10, fixedFee: 5, shippingFee: 20, paymentFee: 2 });
  }
  console.log('✅ Commission rules seeded');

  process.exit();
}

seed();