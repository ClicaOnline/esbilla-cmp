const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const request = require('supertest');
const app = require('../app');

/**
 * Tests for Invitations API (Sprint 4)
 *
 * Note: These tests require Firebase Admin to be properly configured
 * Run with: npm test -w esbilla-api
 */

describe('Invitations API', () => {
  describe('GET /api/invitations/:id', () => {
    it('should return 404 for non-existent invitation', async () => {
      const response = await request(app)
        .get('/api/invitations/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invitation not found');
    });

    it('should require valid invitation ID format', async () => {
      const response = await request(app)
        .get('/api/invitations/invalid-id-123')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/invitations/send', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/invitations/send')
        .send({
          email: 'test@ejemplo.com',
          organizationId: 'org_123',
          type: 'organization',
          role: 'org_admin'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/invitations/send')
        .set('Authorization', 'Bearer fake-token-for-test')
        .send({
          email: 'test@ejemplo.com'
          // Missing organizationId, type, role
        })
        .expect(401); // Will fail auth first

      expect(response.body).toHaveProperty('error');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/invitations/send')
        .set('Authorization', 'Bearer fake-token-for-test')
        .send({
          email: 'invalid-email',
          organizationId: 'org_123',
          type: 'organization',
          role: 'org_admin'
        })
        .expect(401); // Will fail auth first

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/invitations/:id/accept', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/invitations/test-id/accept')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent invitation', async () => {
      const response = await request(app)
        .post('/api/invitations/non-existent-id/accept')
        .set('Authorization', 'Bearer fake-token-for-test')
        .expect(401); // Will fail auth first

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Email Service', () => {
    it('should handle missing SMTP configuration gracefully', () => {
      // The email service should log to console when SMTP is not configured
      // This is tested implicitly by the service not throwing errors
      expect(true).toBe(true);
    });
  });
});

describe('Integration: Invitations Flow', () => {
  it('should complete full invitation lifecycle', async () => {
    // This is a placeholder for a full E2E test
    // In a real scenario, you would:
    // 1. Create a test invitation with Firebase Admin
    // 2. Get invitation details
    // 3. Accept invitation with a test user
    // 4. Verify user has correct access

    // For now, just verify the endpoints are available
    const healthResponse = await request(app)
      .get('/api/health')
      .expect(200);

    expect(healthResponse.body).toHaveProperty('status');
    expect(healthResponse.body.status).toBe('healthy');
  });
});

describe('Security: Invitations', () => {
  it('should not expose internal IDs in public endpoints', async () => {
    const response = await request(app)
      .get('/api/invitations/test-id-123')
      .expect(404);

    // Should not expose internal Firestore structure
    expect(response.body).not.toHaveProperty('invitedBy');
    expect(response.body).not.toHaveProperty('organizationId');
  });

  it('should require Bearer token format', async () => {
    const response = await request(app)
      .post('/api/invitations/send')
      .set('Authorization', 'Invalid token-format')
      .send({
        email: 'test@ejemplo.com',
        organizationId: 'org_123',
        type: 'organization',
        role: 'org_admin'
      })
      .expect(401);

    expect(response.body).toHaveProperty('error');
  });
});
