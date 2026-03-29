require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth/auth.routes');
const permissionRoutes = require('./routes/permission/permission.routes');
const roleRoutes = require('./routes/role/role.routes');
const shopRoutes = require('./routes/shop/shop.routes');
const userRoutes = require('./routes/user/user.routes');
const repairRoutes = require('./routes/repair/repair.routes');
const billRoutes = require('./routes/bill/bill.routes');
const db = require('./config/db');

const app = express();

// Set up CORS explicitly for both Web (Next.js) and Mobile (Expo React Native)
// React Native uses various internal fetch APIs that require permissible CORS during development
app.use(cors({
  origin: '*', // Allows all origins - update for strict production URLs later
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/users', userRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/bills', billRoutes);

// Database Test Connection
db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Failed to connect to Neon PostgreSQL database:');
    console.error(err.stack);
  } else {
    console.log('✅ Successfully connected to Neon PostgreSQL database at:', res.rows[0].now);
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
// Binding explicitly to '0.0.0.0' allows physical devices and Expo network IPs to successfully hit the server natively
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Workshop Backend running on port ${PORT} (Accessible via Localhost and Wi-Fi IP)`);
});
