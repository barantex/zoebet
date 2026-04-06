require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
require('./seed'); // Ensure default admin exists
// TODO: add finance and dragon routes

const BRAND_NAME = 'ZoeBet';
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/finance', require('./routes/finance'));
app.use('/api/dragon', require('./routes/dragon'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin-finance', require('./routes/finance-admin'));
app.use('/api/wheel', require('./routes/wheel'));

// PRODUCTION: Serve static files AFTER API routes
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Server] ZoeBet API is running on port ${PORT}`);
});
