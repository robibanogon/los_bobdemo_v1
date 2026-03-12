const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('=== LOGIN REQUEST RECEIVED ===');
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.get('content-type'));
    
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('Missing credentials - username:', !!username, 'password:', !!password);
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log('Attempting login for username:', username);

    const metadata = {
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    };

    const result = await authService.login(username, password, metadata);
    console.log('Login successful for:', username);
    res.json(result);
  } catch (error) {
    console.log('Login failed:', error.message);
    res.status(401).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout (client-side token removal, but log the action)
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Just return success - token removal happens client-side
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (for demo purposes)
router.get('/users', authenticate, async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Made with Bob
