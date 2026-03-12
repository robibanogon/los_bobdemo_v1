const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const { authenticate } = require('../middleware/auth');

// Get all audit logs with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      entity_id: req.query.entity_id,
      entity_type: req.query.entity_type,
      actor_id: req.query.actor_id,
      action: req.query.action,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    const logs = await auditService.getAll(filters);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs for specific user
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const logs = await auditService.getByUser(req.params.userId);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Made with Bob
