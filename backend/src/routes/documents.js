const express = require('express');
const router = express.Router();
const path = require('path');
const documentService = require('../services/documentService');
const { authenticate } = require('../middleware/auth');

// Get document by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const document = await documentService.getById(req.params.id);
    res.json(document);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Download document file
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const document = await documentService.getById(req.params.id);
    res.download(document.storage_path, document.original_filename);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Delete document
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await documentService.delete(req.params.id, req.user.id, req.user.name);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

// Made with Bob
