import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { User } from '../models/user.model.js';
import { connectTestDB, disconnectTestDB } from './setupTestDB.js';

let token;
let userId;
let noteId;

beforeAll(async () => {
  await connectTestDB();

  const user = await User.create({
    name: 'NoteUser',
    email: 'note@example.com',
    password: 'pass123'
  });

  userId = user._id;
  const jwtToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret');
  token = `token=${jwtToken}`;
});

afterAll(disconnectTestDB);

describe('Notes Routes', () => {
  it('should create a note', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Cookie', token)
      .send({
        title: 'Test Note',
        content: 'Sample content',
        tags: ['unit', 'test']
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.note.title).toBe('Test Note');
    noteId = res.body.note._id;
  });

  it('should fetch all notes', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Cookie', token);

    expect(res.statusCode).toBe(200);
    // getAccessibleNotes returns an array or object with notes property
    expect(Array.isArray(res.body) || Array.isArray(res.body.notes)).toBe(true);
  });

  it('should fetch a single note by ID', async () => {
    const res = await request(app)
      .get(`/api/notes/${noteId}`)
      .set('Cookie', token);

    expect(res.statusCode).toBe(200);
    expect(res.body._id || res.body.note?._id).toBeDefined();
  });

  it('should update a note', async () => {
    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Cookie', token)
      .send({ title: 'Updated Note' });

    expect(res.body.note.title).toBe('Updated Note');
  });

  it('should filter notes by tag', async () => {
    const res = await request(app)
      .get('/api/notes/filter?tags=unit')
      .set('Cookie', token);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body) || Array.isArray(res.body.notes)).toBe(true);
  });

  it('should delete a note', async () => {
    const res = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Cookie', token);

    expect(res.statusCode).toBe(200);
  });
});
