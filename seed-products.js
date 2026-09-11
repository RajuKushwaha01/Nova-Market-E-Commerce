require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

const catalog = {
  mobiles: [
    { name: 'Apple iPhone 15 (128GB)', brand: 'Apple', mrp: 79999, price: 71999, stock: 25, keywords: 'iphone smartphone' },
    { name: 'Samsung Galaxy S24', brand: 'Samsung', mrp: 74999, price: 67999, stock: 30, keywords: 'samsung smartphone' },
    { name: 'OnePlus 12 5G', brand: 'OnePlus', mrp: 64999, price: 57999, stock: 20, keywords: 'android smartphone black' },
    { name: 'Google Pixel 8', brand: 'Google', mrp: 59999, price: 52999, stock: 18, keywords: 'pixel smartphone' },
    { name: 'Xiaomi 14 Pro', brand: 'Xiaomi', mrp: 49999, price: 43999, stock: 22, keywords: 'smartphone mobile phone' },
    { name: 'Apple iPhone 14 (128GB)', brand: 'Apple', mrp: 69999, price: 61999, stock: 20, keywords: 'iphone mobile' },
    { name: 'Samsung Galaxy A55', brand: 'Samsung', mrp: 34999, price: 29999, stock: 35, keywords: 'smartphone mobile phone hand' },
    { name: 'OnePlus Nord CE 4', brand: 'OnePlus', mrp: 24999, price: 21999, stock: 28, keywords: 'smartphone screen' },
  ],
  electronics: [
    { name: 'Sony WH-1000XM5 Headphones', brand: 'Sony', mrp: 29999, price: 24999, stock: 40, keywords: 'wireless headphones' },
    { name: 'Dell Inspiron 15 Laptop', brand: 'Dell', mrp: 62999, price: 54999, stock: 15, keywords: 'laptop notebook computer' },
    { name: 'Apple Watch Series 9', brand: 'Apple', mrp: 41999, price: 37999, stock: 20, keywords: 'smartwatch apple watch' },
    { name: 'JBL Flip 6 Bluetooth Speaker', brand: 'JBL', mrp: 11999, price: 8999, stock: 50, keywords: 'bluetooth speaker portable' },
    { name: 'Canon EOS 1500D DSLR Camera', brand: 'Canon', mrp: 37999, price: 32999, stock: 12, keywords: 'dslr camera' },
    { name: 'Sony PlayStation 5 Console', brand: 'Sony', mrp: 54999, price: 49999, stock: 10, keywords: 'gaming console' },
    { name: 'Dell 27" Full HD Monitor', brand: 'Dell', mrp: 18999, price: 14999, stock: 25, keywords: 'computer monitor desktop screen' },
    { name: 'JBL Tune 760NC Headphones', brand: 'JBL', mrp: 6999, price: 4999, stock: 45, keywords: 'headphones earphones' },
  ],
  fashion: [
    { name: "Men's Bomber Jacket", brand: 'NOVA Wear', mrp: 3499, price: 1999, stock: 60, keywords: 'bomber jacket mens fashion' },
    { name: "Women's Floral Summer Dress", brand: 'NOVA Wear', mrp: 2799, price: 1599, stock: 55, keywords: 'summer dress womens fashion' },
    { name: 'Unisex Running Sneakers', brand: 'SprintX', mrp: 4499, price: 2999, stock: 70, keywords: 'running shoes sneakers' },
    { name: "Men's Slim Fit Denim Jeans", brand: 'Denimo', mrp: 2299, price: 1399, stock: 65, keywords: 'denim jeans mens' },
    { name: "Women's Leather Handbag", brand: 'Vogueline', mrp: 3999, price: 2499, stock: 40, keywords: 'leather handbag purse' },
    { name: "Women's Denim Jacket", brand: 'Denimo', mrp: 2999, price: 1899, stock: 42, keywords: 'denim jacket womens' },
    { name: 'Unisex Canvas Backpack', brand: 'Vogueline', mrp: 1999, price: 1299, stock: 50, keywords: 'canvas backpack' },
    { name: "Men's Sports Track Jacket", brand: 'SprintX', mrp: 2499, price: 1699, stock: 48, keywords: 'track jacket sportswear' },
  ],
  home: [
    { name: '3-Seater Fabric Sofa', brand: 'HomeCraft', mrp: 34999, price: 27999, stock: 10, keywords: 'sofa living room couch' },
    { name: 'Solid Wood Dining Table (6-seater)', brand: 'HomeCraft', mrp: 28999, price: 22999, stock: 8, keywords: 'dining table wood furniture' },
    { name: 'Queen Size Bed Frame', brand: 'HomeCraft', mrp: 19999, price: 15999, stock: 14, keywords: 'bed frame bedroom' },
    { name: 'Modern LED Table Lamp', brand: 'Lumina', mrp: 1899, price: 1199, stock: 45, keywords: 'table lamp led' },
    { name: 'Abstract Canvas Wall Art Set', brand: 'ArtHouse', mrp: 2499, price: 1699, stock: 30, keywords: 'wall art canvas painting' },
    { name: 'Ceiling Pendant Light', brand: 'Lumina', mrp: 3299, price: 2499, stock: 22, keywords: 'pendant light ceiling lamp' },
    { name: 'Framed Botanical Print Set', brand: 'ArtHouse', mrp: 1799, price: 1199, stock: 35, keywords: 'botanical print wall frame' },
    { name: '2-Seater Wooden Bookshelf', brand: 'HomeCraft', mrp: 8999, price: 6999, stock: 18, keywords: 'bookshelf wooden shelf' },
  ],
  appliances: [
    { name: 'Double Door Refrigerator 260L', brand: 'CoolTech', mrp: 32999, price: 27999, stock: 12, keywords: 'refrigerator fridge kitchen' },
    { name: 'Front Load Washing Machine 7kg', brand: 'CoolTech', mrp: 28999, price: 23999, stock: 10, keywords: 'washing machine laundry' },
    { name: 'Convection Microwave Oven 25L', brand: 'HeatPro', mrp: 9999, price: 7499, stock: 25, keywords: 'microwave oven kitchen' },
    { name: 'Split AC 1.5 Ton 5-Star', brand: 'CoolTech', mrp: 42999, price: 34999, stock: 15, keywords: 'air conditioner unit' },
    { name: 'Robotic Vacuum Cleaner', brand: 'CleanBot', mrp: 21999, price: 16999, stock: 20, keywords: 'robot vacuum cleaner' },
    { name: 'Induction Cooktop', brand: 'HeatPro', mrp: 3499, price: 2599, stock: 40, keywords: 'induction cooktop stove' },
    { name: 'Cordless Handheld Vacuum', brand: 'CleanBot', mrp: 6999, price: 5299, stock: 30, keywords: 'handheld vacuum cleaner' },
    { name: 'Mini Refrigerator 45L', brand: 'CoolTech', mrp: 9999, price: 7999, stock: 22, keywords: 'mini fridge' },
  ],
  beauty: [
    { name: 'Vitamin C Face Serum 30ml', brand: 'GlowLab', mrp: 899, price: 649, stock: 100, keywords: 'face serum skincare bottle' },
    { name: 'Matte Lipstick Combo (5 pcs)', brand: 'ColorPop', mrp: 1299, price: 799, stock: 80, keywords: 'lipstick makeup' },
    { name: 'Eau de Parfum 100ml', brand: 'Essence', mrp: 2499, price: 1799, stock: 50, keywords: 'perfume bottle fragrance' },
    { name: 'Ionic Hair Dryer 2200W', brand: 'StyleTech', mrp: 1999, price: 1399, stock: 40, keywords: 'hair dryer' },
    { name: 'Professional Makeup Kit', brand: 'ColorPop', mrp: 2999, price: 2099, stock: 35, keywords: 'makeup kit cosmetics' },
    { name: 'Hyaluronic Acid Moisturizer', brand: 'GlowLab', mrp: 1099, price: 799, stock: 70, keywords: 'moisturizer skincare cream' },
    { name: 'Rollerball Perfume Oil Set', brand: 'Essence', mrp: 1499, price: 999, stock: 55, keywords: 'perfume oil fragrance' },
    { name: 'Hair Straightener Ceramic Plate', brand: 'StyleTech', mrp: 2299, price: 1599, stock: 38, keywords: 'hair straightener' },
  ],
  sports: [
    { name: 'English Willow Cricket Bat', brand: 'ProSport', mrp: 3499, price: 2599, stock: 30, keywords: 'cricket bat' },
    { name: 'Non-Slip Yoga Mat', brand: 'FitLife', mrp: 999, price: 649, stock: 90, keywords: 'yoga mat' },
    { name: 'Adjustable Dumbbells Set (20kg)', brand: 'FitLife', mrp: 4999, price: 3799, stock: 25, keywords: 'dumbbells gym equipment' },
    { name: 'Size 5 Football', brand: 'ProSport', mrp: 1299, price: 899, stock: 60, keywords: 'football soccer ball' },
    { name: 'Cycling Helmet with Visor', brand: 'RideSafe', mrp: 1799, price: 1249, stock: 45, keywords: 'cycling helmet bike' },
    { name: 'Resistance Bands Set', brand: 'FitLife', mrp: 799, price: 549, stock: 85, keywords: 'resistance bands fitness' },
    { name: 'Badminton Racket Pro', brand: 'ProSport', mrp: 2199, price: 1599, stock: 40, keywords: 'badminton racket' },
    { name: 'Knee & Elbow Guard Set', brand: 'RideSafe', mrp: 1099, price: 749, stock: 50, keywords: 'knee guard sports gear' },
  ],
  books: [
    { name: 'The Silent Horizon — Fiction Novel', brand: 'NOVA Press', mrp: 499, price: 349, stock: 100, keywords: 'novel fiction book' },
    { name: 'Atomic Focus — Self-Help Guide', brand: 'NOVA Press', mrp: 599, price: 399, stock: 90, keywords: 'self help book' },
    { name: 'The Home Kitchen — Cookbook', brand: 'NOVA Press', mrp: 799, price: 549, stock: 70, keywords: 'cookbook recipe book' },
    { name: 'Life in Motion — Biography', brand: 'NOVA Press', mrp: 649, price: 449, stock: 60, keywords: 'biography book' },
    { name: "The Little Explorer — Children's Storybook", brand: 'NOVA Press', mrp: 349, price: 229, stock: 120, keywords: 'childrens book storybook' },
    { name: 'Beyond the Ledger — Business Strategy', brand: 'NOVA Press', mrp: 699, price: 479, stock: 65, keywords: 'business book stack' },
    { name: 'Mapping the Mind — Psychology', brand: 'NOVA Press', mrp: 749, price: 519, stock: 55, keywords: 'psychology book' },
    { name: 'The Garden Almanac — Reference', brand: 'NOVA Press', mrp: 549, price: 379, stock: 75, keywords: 'reference book gardening' },
  ],
};

// Simple in-memory cache so identical keyword searches (e.g. "smartphone" used 6 times)
// don't burn extra API calls against Unsplash's free-tier rate limit (50/hour)
const searchCache = new Map();

async function fetchUnsplashImages(query, count = 2) {
  if (!UNSPLASH_KEY) return null;

  const cacheKey = `${query}::${count}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=squarish`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    });

    if (!res.ok) {
      console.warn(`⚠️  Unsplash API error for "${query}": ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    // regular = ~1080px wide, good balance of HD quality and load speed
    const urls = data.results.slice(0, count).map((r) => r.urls.regular);
    searchCache.set(cacheKey, urls);
    return urls;
  } catch (err) {
    console.warn(`⚠️  Unsplash fetch failed for "${query}":`, err.message);
    return null;
  }
}

async function seedProducts() {
  await mongoose.connect(process.env.MONGO_URI);

  if (!UNSPLASH_KEY) {
    console.warn('⚠️  UNSPLASH_ACCESS_KEY not set in .env — products will be seeded with no images. Add your key and re-run.');
  }

  let seller = await User.findOne({ email: 'demo-seller@novamarket.com' });
  if (!seller) {
    seller = await User.create({
      name: 'NOVA Demo Seller',
      email: 'demo-seller@novamarket.com',
      password: 'Seller@12345',
      role: 'seller',
      sellerProfile: {
        businessName: 'NOVA Official Store',
        status: 'approved',
        gstNumber: 'DEMO-GST-0001',
        panNumber: 'DEMO-PAN-0001',
        businessAddress: 'NOVA Warehouse, Bengaluru, India',
      },
    });
    console.log('✅ Demo seller created: demo-seller@novamarket.com / Seller@12345');
  }

  let totalInserted = 0;

  for (const [slug, products] of Object.entries(catalog)) {
    const category = await Category.findOne({ slug });
    if (!category) {
      console.warn(`⚠️  Category "${slug}" not found — run seed.js first.`);
      continue;
    }

    for (const p of products) {
      const exists = await Product.findOne({ name: p.name, seller: seller._id });
      if (exists) continue;

      console.log(`   fetching photo: ${p.name} ("${p.keywords}")...`);
      const images = (await fetchUnsplashImages(p.keywords, 2)) || [];

      await Product.create({
        name: p.name,
        brand: p.brand,
        category: category._id,
        description: `${p.name} — premium quality, backed by NOVA MARKET's buyer protection and easy returns.`,
        highlights: ['Premium build quality', 'Fast delivery available', 'Easy 7-day returns', '1 Year Warranty'],
        specifications: { Brand: p.brand, Category: category.name, Warranty: '1 Year' },
        images,
        mrp: p.mrp,
        price: p.price,
        stock: p.stock,
        warranty: '1 Year Manufacturer Warranty',
        returnPolicy: '7 Days Replacement',
        seller: seller._id,
        status: 'approved',
        rating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 400) + 10,
        soldCount: Math.floor(Math.random() * 200),
      });
      totalInserted++;

      // Unsplash free tier = 50 req/hour; small delay keeps us well under that
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  console.log(`✅ Seeded ${totalInserted} products with real Unsplash photos across ${Object.keys(catalog).length} categories`);
  process.exit();
}

seedProducts();