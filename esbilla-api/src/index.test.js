import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app';

// User-Agent de navegador real para tests (requerido por validación anti-bot)
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

describe('Esbilla API - Pruebes de Gobernanza', () => {

  it('Debería devolver la configuración correuta pol ID', async () => {
    const response = await request(app).get('/api/config/sevares-001');
    expect(response.status).toBe(200);
    expect(response.body.id).toBe('sevares-001');
    expect(response.body.colors.primary).toBe('#FFBF00'); // El color del maíz
    expect(response.body.layout).toBeDefined();
  });

  it('Debería rexistrar el log de consentimientu', async () => {
    const payload = {
      cmpId: 'test-web',
      choices: { analytics: true, marketing: false }
    };
    const response = await request(app)
      .post('/api/consent/log')
      .set('User-Agent', BROWSER_UA)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('esbilláu');
  });

  it('Debería rexazar peticiones sin cmpId', async () => {
    const response = await request(app)
      .post('/api/consent/log')
      .set('User-Agent', BROWSER_UA)
      .send({ choices: { analytics: true } });

    expect(response.status).toBe(400);
  });

  it('Debería devolver health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });

});

describe('Esbilla API - SDK y ficheros estáticos', () => {

  it('Debería servir el SDK (sdk.js)', async () => {
    const response = await request(app).get('/sdk.js');
    expect(response.status).toBe(200);
    expect(response.type).toMatch(/javascript/);
    expect(response.text).toContain('ESBILLA CMP');
  });

  it('El SDK debería contener la función getFootprintId', async () => {
    const response = await request(app).get('/sdk.js');
    expect(response.text).toContain('getFootprintId');
    expect(response.text).toContain('esbilla_footprint');
  });

  it('El SDK debería tener la mosca con footprint', async () => {
    const response = await request(app).get('/sdk.js');
    expect(response.text).toContain('showMosca');
    expect(response.text).toContain('esbilla-mosca-expanded');
    expect(response.text).toContain('esbilla-mosca-footprint');
  });

  it('Debería servir el manifest de configuración', async () => {
    const response = await request(app).get('/config/manifest.json');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('layouts');
    expect(response.body).toHaveProperty('themes');
  });

  it('Debería servir los estilos base', async () => {
    const response = await request(app).get('/styles/base.css');
    expect(response.status).toBe(200);
    expect(response.type).toMatch(/css/);
    expect(response.text).toContain('--esbilla-primary');
  });

  it('Los estilos deberían incluir la mosca expandida', async () => {
    const response = await request(app).get('/styles/base.css');
    expect(response.text).toContain('.esbilla-mosca-expanded');
    expect(response.text).toContain('.esbilla-mosca-footprint');
  });

  it('Debería servir las traducciones i18n', async () => {
    const response = await request(app).get('/i18n/config.json');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('es');
    expect(response.body).toHaveProperty('en');
  });

});

describe('Esbilla API - Consent con footprintId', () => {

  it('Debería aceptar y guardar el footprintId nel log', async () => {
    const payload = {
      cmpId: 'test-footprint',
      footprintId: 'ESB-TEST1234',
      choices: { analytics: true, marketing: false },
      lang: 'ast',
      userAgent: 'TestAgent/1.0'
    };
    const response = await request(app)
      .post('/api/consent/log')
      .set('User-Agent', BROWSER_UA)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('esbilláu');
  });

  it('Debería funcionar sin footprintId (retrocompatibilidad)', async () => {
    const payload = {
      cmpId: 'test-legacy',
      choices: { analytics: false, marketing: false }
    };
    const response = await request(app)
      .post('/api/consent/log')
      .set('User-Agent', BROWSER_UA)
      .send(payload);

    expect(response.status).toBe(201);
  });

});

describe('Esbilla API - Security', () => {

  it('Debería rechazar peticiones sin User-Agent', async () => {
    const payload = {
      cmpId: 'test-no-ua',
      choices: { analytics: true, marketing: false }
    };
    const response = await request(app)
      .post('/api/consent/log')
      .set('User-Agent', '') // Sin User-Agent
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('INVALID_REQUEST');
  });

  it('Debería rechazar peticiones de clientes sospechosos (curl)', async () => {
    const payload = {
      cmpId: 'test-curl',
      choices: { analytics: true, marketing: false }
    };
    const response = await request(app)
      .post('/api/consent/log')
      .set('User-Agent', 'curl/7.68.0')
      .send(payload);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('SUSPICIOUS_CLIENT');
  });

});