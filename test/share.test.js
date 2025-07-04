import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { User } from '../models/user.model.js';
import { Note } from '../models/note.model.js';
import { connectTestDB, disconnectTestDB } from './setupTestDB.js';

let ownerToken, noteId, shareUserId;

beforeAll(async () => {
  await connectTestDB();

  const owner = await User.create({ name: 'Owner', email: 'own@example.com', password: '123' });
  const user = await User.create({ name: 'ShareUser', email: 'share@example.com', password: '456' });

  shareUserId = user._id;
  const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET || 'testsecret');
  ownerToken = `token=${token}`;

  const note = await Note.create({
    title: 'Shared Note',
    content: 'Read this',
    tags: ['team'],
    userId: owner._id
  });

  noteId = note._id;
});

afterAll(disconnectTestDB);

describe('Note Sharing', () => {
  it('should share a note with another user', async () => {
    const res = await request(app)
      .post(`/api/notes/${noteId}/share`)
      .set('Cookie', ownerToken)
      .send({
        userId: shareUserId,
        access: 'read'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.note.sharedWith[0].access).toBe('read');
  });

  it('should unshare a note from a user', async () => {
    // First, share the note to ensure the user is in sharedWith
    await request(app)
      .post(`/api/notes/${noteId}/share`)
      .set('Cookie', ownerToken)
      .send({
        userId: shareUserId,
        access: 'read'
      });

    // Now, unshare
    const res = await request(app)
      .post(`/api/notes/${noteId}/unshare`)
      .set('Cookie', ownerToken)
      .send({ userId: shareUserId });

    expect(res.statusCode).toBe(200);
    expect(res.body.note.sharedWith.find(e => e.user === String(shareUserId))).toBeUndefined();
  });

  it('should change access level for a shared user', async () => {
    // First, share the note
    await request(app)
      .post(`/api/notes/${noteId}/share`)
      .set('Cookie', ownerToken)
      .send({
        userId: shareUserId,
        access: 'read'
      });

    // Change access
    const res = await request(app)
      .post(`/api/notes/${noteId}/change-access`)
      .set('Cookie', ownerToken)
      .send({
        userId: shareUserId,
        access: 'write'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.note.sharedWith.find(e => e.user === String(shareUserId)).access).toBe('write');
  });
});
