import request from 'supertest';
import app from '../index.js';
import { connectTestDB, disconnectTestDB } from './setupTestDB.js';

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

describe('Auth Routes', () => {
  it('should register a user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'test123'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe('alice@example.com');
  });

  it('should login a user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'test123'
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/token=/);

    // Logout test
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', res.headers['set-cookie']);
    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.body.message).toMatch(/logged out/i);
  });

  it('should promote a user to admin', async () => {
    // Register admin
    await request(app).post('/api/auth/register').send({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'adminpass'
    });

    // Manually update role
    const { User } = await import('../models/user.model.js');
    await User.findOneAndUpdate({ email: 'admin@example.com' }, { role: 'admin' });

    // Login admin to get token
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'adminpass'
    });
    const adminCookie = adminLogin.headers['set-cookie'];

    // Register normal user
    await request(app).post('/api/auth/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'bobpass'
    });

    // Fetch Bob's _id directly from DB
    const bob = await User.findOne({ email: 'bob@example.com' });
    const userId = bob._id.toString();

    // Promote Bob to admin
    const promoteRes = await request(app)
      .put(`/api/auth/admin/promote/${userId}`)
      .set('Cookie', adminCookie);

    console.log("Promote Response:", promoteRes.body);

    expect(promoteRes.statusCode).toBe(200);
    expect(promoteRes.body.message).toMatch(/promoted/i);
  });
});
