require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cloudinary = require('./config/cloudinary');

console.log('Testing Cloudinary connection...\n');
console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API key:', process.env.CLOUDINARY_API_KEY);
console.log('API secret set:', !!process.env.CLOUDINARY_API_SECRET, '(length:', (process.env.CLOUDINARY_API_SECRET || '').length, 'chars)');

const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const testFilePath = path.join(__dirname, 'test-upload.png');

async function runTests() {
  console.log('\n1) Ping test...');
  const pingRes = await cloudinary.api.ping();
  console.log('   ✅', pingRes.status);

  console.log('\n2) Local file upload — printing FULL raw error this time...');
  fs.writeFileSync(testFilePath, Buffer.from(tinyPngBase64, 'base64'));

  try {
    const uploadRes = await cloudinary.uploader.upload(testFilePath, { folder: 'nova-market/test' });
    console.log('   ✅ Upload succeeded:', uploadRes.secure_url);
    await cloudinary.uploader.destroy(uploadRes.public_id);
  } catch (err) {
    console.log('\n   ==== FULL ERROR OBJECT ====');
    console.log(JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    console.log('   ==== END ====\n');
    console.log('   err.message:', err.message);
    console.log('   err.error?.message:', err.error?.message);
    console.log('   err.http_code:', err.http_code);
  } finally {
    fs.unlinkSync(testFilePath);
    process.exit(0);
  }
}

runTests();