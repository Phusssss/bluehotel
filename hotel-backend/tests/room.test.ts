import request from 'supertest';
import app from '../src/app';

describe('Room API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@hotel.com',
        password: 'admin123'
      });
    
    authToken = loginResponse.body.data.accessToken;
  });

  describe('GET /api/rooms', () => {
    it('should get all rooms with auth token', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/rooms');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/rooms/search', () => {
    it('should search rooms', async () => {
      const response = await request(app)
        .get('/api/rooms/search?q=101')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});