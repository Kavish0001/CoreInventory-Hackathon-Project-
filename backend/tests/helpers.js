const request = require('supertest');
const { createApp } = require('../app');

function uniqueEmail() {
  return `user_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function registerAndLogin({ password = 'Aa1!aaaa', loginId } = {}) {
  const app = createApp();
  const email = uniqueEmail();

  const payload = {
    name: 'Test User',
    email,
    password,
    ...(loginId ? { login_id: loginId } : {}),
  };

  const registerRes = await request(app).post('/api/auth/register').send(payload);
  if (registerRes.statusCode !== 201) {
    throw new Error(`Register failed: ${registerRes.statusCode} ${JSON.stringify(registerRes.body)}`);
  }

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (loginRes.statusCode !== 200) {
    throw new Error(`Login failed: ${loginRes.statusCode} ${JSON.stringify(loginRes.body)}`);
  }

  return {
    app,
    email,
    password,
    token: loginRes.body.token,
    user: loginRes.body.user,
  };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  createApp,
  authHeader,
  registerAndLogin,
};

