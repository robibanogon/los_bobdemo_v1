const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { authenticate, authorize } = require('../middleware/auth');
const auditService = require('../services/auditService');

// Get policy configuration
router.get('/policy', authenticate, async (req, res) => {
  try {
    const policyPath = path.join(__dirname, '../config/policy.json');
    const policyData = await fs.readFile(policyPath, 'utf8');
    const policy = JSON.parse(policyData);
    res.json(policy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update policy configuration (Admin only)
router.put('/policy', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const policyPath = path.join(__dirname, '../config/policy.json');
    
    // Read current policy
    const currentData = await fs.readFile(policyPath, 'utf8');
    const currentPolicy = JSON.parse(currentData);
    
    // Update policy
    const updatedPolicy = {
      ...currentPolicy,
      ...req.body
    };
    
    // Write updated policy
    await fs.writeFile(policyPath, JSON.stringify(updatedPolicy, null, 2), 'utf8');
    
    // Log the update
    await auditService.log({
      actor_id: req.user.id,
      actor_name: req.user.name,
      action: auditService.ACTIONS.UPDATE_POLICY,
      entity_type: 'Policy',
      entity_id: 'policy',
      before: currentPolicy,
      after: updatedPolicy
    });
    
    res.json(updatedPolicy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Made with Bob
