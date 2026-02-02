import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app';

describe('Esbilla API - Pruebes de Gobernanza', () => {
  
  it('Debería devolver la configuración correuta pol ID', async () => {
    const response = await request(app).get('/api/config/sevares-001');
    expect(response.status).toBe(200);
    expect(response.body.id).toBe('sevares-001');
    expect(response.body.theme.primary).toBe('#FFBF00'); // El color del maíz
  });

  it('Debería rexistrar el log de consentimientu', async () => {
    const payload = {
      cmpId: 'test-web',
      choices: { analytics: true, marketing: false }
    };
    const response = await request(app)
      .post('/api/consent/log')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('esbilláu');
  });

  it('Debería rexazar peticiones sin cmpId', async () => {
    const response = await request(app)
      .post('/api/consent/log')
      .send({ choices: { analytics: true } });

    expect(response.status).toBe(400);
  });

  it('Debería devolver health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });

});