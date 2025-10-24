const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyJwt } = require('../middleware/auth');
const User = require('../../data/users-model.js'); // <-- Mongo User model

const router = express.Router();

// Helper to generate JWT
function signToken(payload) {
  const secret = 'dev_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign(payload, secret, { expiresIn });
}

// ================= REGISTER =================
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    // Kiểm tra user tồn tại
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(String(password), 10);

    // Tạo user mới
    const user = await User.create({
      email: String(email).toLowerCase(),
      name: name || '',
      passwordHash
    });

    // Tạo token
    const token = signToken({ id: user._id, email: user.email });
    user.tokens = token;
    user.save();
    return res.status(201).json({
      message: 'Registered successfully',
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

// ================= LOGIN =================
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ id: user._id, email: user.email });

    return res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// ================= PROFILE =================
router.get('/me', verifyJwt, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}); 

// ================= VERIFY TOKEN =================
router.post('/verify-token', (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token is required' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    return res.json({ valid: true, payload });
  } catch (err) {
    return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

// ================= PROTECTED EXAMPLE =================
router.get('/protected', verifyJwt, (req, res) => {
  return res.json({ secret: 'This is protected data', user: req.user });
});

module.exports = router;
