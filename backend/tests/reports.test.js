const request = require('supertest');
const { authHeader, registerAndLogin } = require('./helpers');

describe('Reports', () => {
  test('dashboard, stock snapshot, ledger, move-history respond', async () => {
    const { app, token } = await registerAndLogin();

    const dashboard = await request(app).get('/api/reports/dashboard').set(authHeader(token));
    expect(dashboard.statusCode).toBe(200);
    expect(typeof dashboard.body.total_products).toBe('number');

    const stock = await request(app).get('/api/reports/stock').set(authHeader(token));
    expect(stock.statusCode).toBe(200);
    expect(Array.isArray(stock.body)).toBe(true);

    const ledger = await request(app).get('/api/reports/ledger').set(authHeader(token));
    expect(ledger.statusCode).toBe(200);
    expect(Array.isArray(ledger.body)).toBe(true);

    const history = await request(app).get('/api/inventory/move-history').set(authHeader(token));
    expect(history.statusCode).toBe(200);
    expect(Array.isArray(history.body)).toBe(true);
  });
});

