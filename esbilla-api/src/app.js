const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use('/', express.static(path.join(__dirname, '../public')));

app.get('/api/config/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id: id,
    theme: { primary: '#FFBF00', secondary: '#3D2B1F' },
    texts: { title: "¿Esbillamos les cookies?" }
  });
});

app.post('/api/consent/log', (req, res) => {
  res.status(201).send({ status: 'Log guardáu nel hórreu' });
});

module.exports = app; // Allá va la clave pa los tests