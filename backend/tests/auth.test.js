const request = require('supertest');
const { createApp } = require('../app');

describe('Auth', () => {
  test('register -> login (email) works', async () => {
    const app = createApp();

    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Kavish',
      email: 'kavish_test@example.com',
      password: 'Aa1!aaaa',
    });

    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.body?.token).toBeTruthy();
    expect(registerRes.body?.user?.email).toBe('kavish_test@example.com');

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'kavish_test@example.com',
      password: 'Aa1!aaaa',
    });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body?.token).toBeTruthy();
    expect(loginRes.body?.user?.email).toBe('kavish_test@example.com');
  });

  test('forgot-password -> verify-otp -> reset-password', async () => {
    const app = createApp();

    await request(app).post('/api/auth/register').send({
      name: 'Reset User',
      email: 'reset_user@example.com',
      password: 'Aa1!aaaa',
    });

    const forgotRes = await request(app).post('/api/auth/forgot-password').send({ email: 'reset_user@example.com' });
    expect(forgotRes.statusCode).toBe(200);
    expect(forgotRes.body?.message).toBeTruthy();
    // In non-production, backend returns reset_code
    expect(forgotRes.body?.reset_code).toBeTruthy();

    const code = forgotRes.body.reset_code;

    const verifyRes = await request(app).post('/api/auth/verify-otp').send({ email: 'reset_user@example.com', code });
    expect(verifyRes.statusCode).toBe(200);

    const resetRes = await request(app).post('/api/auth/reset-password').send({
      email: 'reset_user@example.com',
      code,
      new_password: 'Bb2@bbbb',
    });
    expect(resetRes.statusCode).toBe(200);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'reset_user@example.com',
      password: 'Bb2@bbbb',
    });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body?.token).toBeTruthy();
  });
});

