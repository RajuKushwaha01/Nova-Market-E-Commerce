const request = require('supertest');

// Lightweight smoke tests — no live DB required for these two;
// they check the routes respond and enforce basic rules.
describe('Auth routes', () => {
  const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

  test('GET /register returns 200', async () => {
    const res = await request(BASE_URL).get('/register');
    expect(res.statusCode).toBe(200);
  });

  test('GET /login returns 200', async () => {
    const res = await request(BASE_URL).get('/login');
    expect(res.statusCode).toBe(200);
  });

  test('POST /login with missing password is rejected', async () => {
    const res = await request(BASE_URL).post('/login').send({ email: 'test@test.com' });
    expect([422, 403]).toContain(res.statusCode); // 403 if CSRF blocks it first, 422 if validation catches it
  });
});