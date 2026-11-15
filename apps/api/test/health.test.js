import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Health Check API', () => {
  it('GET /api/v1/health should return status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'kasir-seblak-api');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET non-existent route should return 404', async () => {
    const res = await request(app).get('/api/v1/not-found-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
