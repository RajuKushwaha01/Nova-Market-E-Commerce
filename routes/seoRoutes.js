const router = require('express').Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// SEO-friendly product URL: /p/apple-iphone-16-128gb-a1b2c3
router.get('/p/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: 'approved' });
  if (!product) return res.status(404).render('404');
  res.redirect(`/product/${product._id}`); // reuses the existing details controller/view
});

// robots.txt
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /cart
Disallow: /checkout
Disallow: /admin
Disallow: /seller
Disallow: /profile
Disallow: /orders

Sitemap: ${process.env.CLIENT_URL}/sitemap.xml`);
});

// Dynamic sitemap.xml — lists all live products + top categories
router.get('/sitemap.xml', async (req, res) => {
  const [products, categories] = await Promise.all([
    Product.find({ status: 'approved' }).select('slug updatedAt').limit(5000),
    Category.find({ isActive: true, level: 0 }).select('slug updatedAt'),
  ]);

  const base = process.env.CLIENT_URL;
  let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  xml += `<url><loc>${base}/</loc><changefreq>daily</changefreq></url>`;
  xml += `<url><loc>${base}/products</loc><changefreq>daily</changefreq></url>`;

  categories.forEach((c) => {
    xml += `<url><loc>${base}/products?category=${c.slug}</loc><lastmod>${c.updatedAt.toISOString()}</lastmod></url>`;
  });
  products.forEach((p) => {
    if (p.slug) xml += `<url><loc>${base}/p/${p.slug}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod></url>`;
  });

  xml += `</urlset>`;
  res.type('application/xml');
  res.send(xml);
});

module.exports = router;