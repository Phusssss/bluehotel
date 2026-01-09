import request from 'supertest';
import app from '../src/app';

describe('Health Check', () => {
  it('should return OK status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  it('should return version info', async () => {
    const response = await request(app)
      .get('/api/version')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('api');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/unknown')
      .expect(404);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('not found');
  });
});