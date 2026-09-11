const request = require('supertest');

describe('Product routes', () => {
  const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

  test('GET / (homepage) returns 200', async () => {
    const res = await request(BASE_URL).get('/');
    expect(res.statusCode).toBe(200);
  });

  test('GET /products returns 200', async () => {
    const res = await request(BASE_URL).get('/products');
    expect(res.statusCode).toBe(200);
  });

  test('GET /product/:invalidId returns 404 or 500 gracefully, not a crash', async () => {
    const res = await request(BASE_URL).get('/product/000000000000000000000000');
    expect([404, 500]).toContain(res.statusCode);
  });

  test('GET /robots.txt returns 200 with correct content type', async () => {
    const res = await request(BASE_URL).get('/robots.txt');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
  });

  test('GET /sitemap.xml returns 200 with XML content type', async () => {
    const res = await request(BASE_URL).get('/sitemap.xml');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
  });
});