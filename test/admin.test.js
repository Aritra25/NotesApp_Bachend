import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { User } from '../models/user.model.js';
import { Note } from '../models/note.model.js';
import { connectTestDB, disconnectTestDB } from './setupTestDB.js';

let adminToken;

beforeAll(async () => {
  await connectTestDB();

  const admin = await User.create({ name: 'Admin', email: 'admin@a.com', password: 'admin123', role: 'admin' });
  const user1 = await User.create({ name: 'UserA', email: 'u1@a.com', password: '123' });
  const user2 = await User.create({ name: 'UserB', email: 'u2@a.com', password: '123' });

  await Note.create([
    { title: 'A', content: '...', tags: ['work'], userId: user1._id },
    { title: 'B', content: '...', tags: ['work', 'urgent'], userId: user1._id },
    { title: 'C', content: '...', tags: ['urgent'], userId: user2._id },
  ]);

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'testsecret');
  adminToken = `token=${token}`;
});

afterAll(disconnectTestDB);

describe('Admin Analytics', () => {
  it('should return most active users', async () => {
    const res = await request(app)
      .get('/api/dashboard/most-active-users')
      .set('Cookie', adminToken);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return most used tags', async () => {
    const res = await request(app)
      .get('/api/dashboard/most-used-tags')
      .set('Cookie', adminToken);

    expect(res.statusCode).toBe(200);
    expect(res.body[0]).toHaveProperty('tag');
  });

  it('should return notes per day', async () => {
    const res = await request(app)
      .get('/api/dashboard/notes-per-day')
      .set('Cookie', adminToken);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
