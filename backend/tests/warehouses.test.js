const request = require('supertest');
const { authHeader, registerAndLogin } = require('./helpers');

describe('Warehouses & Locations', () => {
  test('create warehouse -> create location -> list locations', async () => {
    const { app, token } = await registerAndLogin();

    const whRes = await request(app)
      .post('/api/warehouses')
      .set(authHeader(token))
      .send({ name: 'Main WH', short_code: 'WH', location: 'Pune', address: 'Test address' });

    expect(whRes.statusCode).toBe(201);
    const warehouseId = whRes.body.id;

    const locRes = await request(app)
      .post('/api/warehouses/locations')
      .set(authHeader(token))
      .send({ warehouse_id: warehouseId, location_name: 'Stock1', short_code: 'STK1' });

    expect(locRes.statusCode).toBe(201);

    const listRes = await request(app)
      .get(`/api/warehouses/${warehouseId}/locations`)
      .set(authHeader(token));

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].location_name).toBe('Stock1');
  });
});

