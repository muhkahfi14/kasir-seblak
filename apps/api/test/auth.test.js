import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Auth & Session API', () => {
  let authCookie;

  it('POST /api/v1/auth/login should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@seblak.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/login should succeed with demo owner credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'owner@seblak.com', password: 'owner123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('OWNER');
    expect(res.headers['set-cookie']).toBeDefined();
    authCookie = res.headers['set-cookie'];
  });

  it('GET /api/v1/auth/me should return current user with valid session', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('owner@seblak.com');
  });

  it('POST /api/v1/auth/logout should invalidate session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
