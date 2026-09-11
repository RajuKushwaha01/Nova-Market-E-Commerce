require('dotenv').config();
const mongoose = require('mongoose');
const Brand = require('./models/Brand');

const brandNames = [
  'Apple', 'ArtHouse', 'Canon', 'CleanBot', 'ColorPop', 'CoolTech', 'Dell', 'Denimo',
  'Essence', 'FitLife', 'GlowLab', 'Google', 'HeatPro', 'HomeCraft', 'JBL', 'Lumina',
  'NOVA Press', 'NOVA Wear', 'OnePlus', 'ProSport', 'RideSafe', 'Samsung', 'Sony',
  'SprintX', 'StyleTech', 'Vogueline', 'Xiaomi',
];

async function seedBrands() {
  await mongoose.connect(process.env.MONGO_URI);

  let created = 0;
  for (const name of brandNames) {
    const exists = await Brand.findOne({ name });
    if (!exists) {
      await Brand.create({ name, isActive: true });
      created++;
    }
  }

  console.log(`✅ Seeded ${created} new brands (${brandNames.length} total in list)`);
  process.exit();
}

seedBrands();