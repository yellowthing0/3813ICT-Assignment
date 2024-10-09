import { expect } from 'chai';
import request from 'supertest';
import app from '../index';  // Make sure your server file exports the app

describe('Server API Tests', () => {

  describe('POST /api/login', () => {
    it('should log in successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ username: '1', password: '1' });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ username: 'wrongUser', password: 'wrongPassword' });

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message').that.equals('Invalid credentials');
    });
  });
});
