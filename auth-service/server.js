const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/utils/connectdb.js');
dotenv.config();

const authRoutes = require('./src/routes/auth');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
connectDB();
// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Auth service is running' });
});

// Routes
app.use('/', authRoutes);

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT,"0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Auth service running on 0.0.0.0:${PORT}`);
});


