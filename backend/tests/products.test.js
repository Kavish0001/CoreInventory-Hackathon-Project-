const request = require('supertest');
const { createApp, authHeader, registerAndLogin } = require('./helpers');

describe('Products', () => {
  test('requires auth', async () => {
    const app = createApp();
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(401);
  });

  test('create -> list -> update -> get', async () => {
    const { app, token } = await registerAndLogin();

    const createRes = await request(app)
      .post('/api/products')
      .set(authHeader(token))
      .send({
        name: 'Desk',
        sku: 'DESK001',
        category: 'Furniture',
        unit: 'Units',
        per_unit_cost: 3000,
        reorder_level: 10,
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body?.id).toBeTruthy();
    expect(Number(createRes.body?.per_unit_cost)).toBe(3000);

    const listRes = await request(app).get('/api/products').set(authHeader(token));
    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);

    const id = createRes.body.id;

    const updateRes = await request(app)
      .put(`/api/products/${id}`)
      .set(authHeader(token))
      .send({
        name: 'Desk',
        sku: 'DESK001',
        category: 'Furniture',
        unit: 'Units',
        per_unit_cost: 3500,
        reorder_level: 12,
      });

    expect(updateRes.statusCode).toBe(200);
    expect(Number(updateRes.body?.per_unit_cost)).toBe(3500);

    const getRes = await request(app).get(`/api/products/${id}`).set(authHeader(token));
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body?.sku).toBe('DESK001');
  });
});

