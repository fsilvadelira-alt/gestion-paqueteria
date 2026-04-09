require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');

const app = express();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Configuración de CORS: en producción solo acepta peticiones del dominio del frontend
const corsOptions = {
  origin: IS_PRODUCTION
    ? process.env.FRONTEND_URL || '*'
    : '*',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Main Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/carriers', require('./routes/carrierRoutes'));
app.use('/api/recipients', require('./routes/recipientRoutes'));
app.use('/api/packages', require('./routes/packageRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/exports', require('./routes/exportRoutes'));
app.use('/api/logistics', require('./routes/logisticsRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/zones', require('./routes/zoneRoutes'));
app.use('/api/quotes', require('./routes/quoteRoutes'));

const PORT = process.env.PORT || 5000;

sequelize.sync().then(() => {
  console.log('Database connected and synced with ' + process.env.DB_DIALECT);

  if (IS_PRODUCTION) {
    // En producción (HostGator), cPanel Node.js maneja HTTPS externamente.
    // El backend corre en HTTP simple en el puerto asignado.
    app.listen(PORT, () => {
      console.log(`[PRODUCTION] Server running on HTTP port ${PORT}`);
    });
  } else {
    // En desarrollo local, usamos HTTPS con certificados autofirmados.
    const https = require('https');
    const fs = require('fs');
    const sslOptions = {
      key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')),
    };
    https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
      console.log(`[DEVELOPMENT] Server running on https://localhost:${PORT}`);
    });
  }
}).catch(err => {
  console.error('Failed to sync db: ', err.message);
});
