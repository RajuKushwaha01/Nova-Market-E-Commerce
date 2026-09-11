require('dotenv').config();
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME.trim();
const apiKey = process.env.CLOUDINARY_API_KEY.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET.trim();

const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const testFilePath = path.join(__dirname, 'test-upload.png');
fs.writeFileSync(testFilePath, Buffer.from(tinyPngBase64, 'base64'));

const timestamp = Math.floor(Date.now() / 1000);
const paramsToSign = `folder=nova-market/test&timestamp=${timestamp}`;
const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');

const boundary = '----NovaBoundary' + Date.now();
const fileBuffer = fs.readFileSync(testFilePath);

function part(name, value) {
  return `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
}

let body = '';
body += part('api_key', apiKey);
body += part('timestamp', timestamp);
body += part('signature', signature);
body += part('folder', 'nova-market/test');
body += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`;

const bodyStart = Buffer.from(body, 'utf8');
const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
const fullBody = Buffer.concat([bodyStart, fileBuffer, bodyEnd]);

const options = {
  hostname: 'api.cloudinary.com',
  path: `/v1_1/${cloudName}/image/upload`,
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': fullBody.length,
  },
};

console.log('Sending raw multipart upload directly to Cloudinary...\n');

const req = https.request(options, (res) => {
  console.log('STATUS CODE:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));

  let raw = '';
  res.on('data', (chunk) => (raw += chunk));
  res.on('end', () => {
    console.log('\n===== RAW RESPONSE BODY =====');
    console.log(raw);
    console.log('===== END RAW RESPONSE =====');
    fs.unlinkSync(testFilePath);
  });
});

req.on('error', (err) => {
  console.error('REQUEST ERROR (network-level, before reaching Cloudinary):', err.message);
  fs.unlinkSync(testFilePath);
});

req.write(fullBody);
req.end();