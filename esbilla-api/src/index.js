// esbilla-api/src/index.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 1. Sirvir el Tracker SDK como estáticu
// Esto permite que se cargue dende api.mio.com/sdk.js
app.use('/', express.static(path.join(__dirname, '../public')));

// 2. Endpoint de Configuración (La collecha)
app.get('/api/config/:id', (req, res) => {
  const { id } = req.params;
  // Equí llamaríamos a la DB nel futuru. Por agora, devolvemos config base.
  res.json({
    id: id,
    theme: { primary: '#FFBF00', secondary: '#3D2B1F' },
    texts: { title: "¿Esbillamos les cookies?" }
  });
});

// 3. Endpoint pa guardar Logs de Consentimientu (Preba llegal)
app.post('/api/consent/log', (req, res) => {
  console.log('Log de consentimientu recibíu:', req.body);
  res.status(201).send({ status: 'Log guardáu nel hórreu' });
});

app.listen(PORT, () => {
  console.log(`Esbilla-API llevantada nel puertu ${PORT}`);
});