const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const applicationService = require('../services/applicationService');
const documentService = require('../services/documentService');
const analysisService = require('../services/analysisService');
const agentReviewService = require('../services/agentReviewService');
const decisionService = require('../services/decisionService');
const memoService = require('../services/memoService');
const auditService = require('../services/auditService');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../data/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png|docx|doc/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, JPG, PNG, and DOCX files are allowed'));
  }
});

// Validation middleware
const validateApplication = [
  body('applicant.legal_name').notEmpty().withMessage('Legal name is required'),
  body('applicant.business_type').notEmpty().withMessage('Business type is required'),
  body('applicant.industry').notEmpty().withMessage('Industry is required'),
  body('applicant.years_in_business').isNumeric().withMessage('Years in business must be a number'),
  body('loan_request.amount').isNumeric().withMessage('Loan amount must be a number'),
  body('loan_request.tenor_months').isNumeric().withMessage('Tenor must be a number'),
  body('loan_request.purpose').notEmpty().withMessage('Loan purpose is required'),
  body('financial_snapshot.monthly_revenue').isNumeric().withMessage('Monthly revenue must be a number'),
  body('financial_snapshot.monthly_expenses').isNumeric().withMessage('Monthly expenses must be a number'),
  body('collateral.estimated_value').isNumeric().withMessage('Collateral value must be a number'),
  body('owner_info.credit_score').isNumeric().withMessage('Credit score must be a number')
];

// Get all applications
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      owner_user_id: req.query.owner_user_id,
      search: req.query.search
    };

    const applications = await applicationService.getAll(filters);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get application statistics
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const stats = await applicationService.getStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single application
router.get('/:id', authenticate, async (req, res) => {
  try {
    const application = await applicationService.getById(req.params.id);
    res.json(application);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Create application
router.post('/', authenticate, authorize('RM', 'Admin'), validateApplication, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await applicationService.create(
      req.body,
      req.user.id,
      req.user.name
    );
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application
router.put('/:id', authenticate, async (req, res) => {
  try {
    const application = await applicationService.update(
      req.params.id,
      req.body,
      req.user.id,
      req.user.name
    );
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete application
router.delete('/:id', authenticate, authorize('RM', 'Admin'), async (req, res) => {
  try {
    await applicationService.delete(req.params.id, req.user.id, req.user.name);
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit application
router.post('/:id/submit', authenticate, authorize('RM', 'Admin'), async (req, res) => {
  try {
    const application = await applicationService.submit(
      req.params.id,
      req.user.id,
      req.user.name
    );
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Complete application
router.post('/:id/complete', authenticate, authorize('Approver', 'Admin'), async (req, res) => {
  try {
    const application = await applicationService.complete(
      req.params.id,
      req.user.id,
      req.user.name
    );
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get documents for application
router.get('/:id/documents', authenticate, async (req, res) => {
  try {
    const documents = await documentService.getByApplication(req.params.id);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document checklist
router.get('/:id/documents/checklist', authenticate, async (req, res) => {
  try {
    const checklist = await documentService.getDocumentChecklist(req.params.id);
    res.json(checklist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload document
router.post('/:id/documents', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { doc_type } = req.body;
    
    if (!doc_type) {
      return res.status(400).json({ error: 'Document type is required' });
    }

    // Mock extract fields
    const extractedFields = documentService.mockExtractFields(doc_type, req.file.originalname);

    const document = await documentService.create(
      {
        application_id: req.params.id,
        doc_type,
        filename: req.file.filename,
        original_filename: req.file.originalname,
        storage_path: req.file.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        extracted_fields: extractedFields
      },
      req.user.id,
      req.user.name
    );

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run agent review
router.post('/:id/agent-review', authenticate, async (req, res) => {
  try {
    const review = await agentReviewService.runReview(
      req.params.id,
      req.user.id,
      req.user.name
    );
    
    // Move application to "In Review" status
    await applicationService.moveToReview(req.params.id, req.user.id, req.user.name);
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analysis
router.get('/:id/analysis', authenticate, async (req, res) => {
  try {
    const analysis = await analysisService.getByApplication(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or recalculate analysis
router.post('/:id/analysis', authenticate, async (req, res) => {
  try {
    const analysis = await analysisService.recalculate(
      req.params.id,
      req.user.id,
      req.user.name
    );
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update analysis assumptions
router.put('/:id/analysis/assumptions', authenticate, authorize('Credit Analyst', 'Admin'), async (req, res) => {
  try {
    const analysis = await analysisService.getByApplication(req.params.id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const { assumptions, notes } = req.body;
    
    const updated = await analysisService.updateAssumptions(
      analysis.id,
      assumptions,
      notes,
      req.user.id,
      req.user.name
    );
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get decision
router.get('/:id/decision', authenticate, async (req, res) => {
  try {
    const decision = await decisionService.getByApplication(req.params.id);
    
    if (!decision) {
      return res.status(404).json({ error: 'Decision not found' });
    }
    
    res.json(decision);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit recommendation
router.post('/:id/decision/recommend', authenticate, authorize('Credit Analyst', 'Admin'), async (req, res) => {
  try {
    const { recommended_decision, recommendation_notes } = req.body;
    
    if (!recommended_decision) {
      return res.status(400).json({ error: 'Recommended decision is required' });
    }

    const decision = await decisionService.submitRecommendation(
      req.params.id,
      { recommended_decision, recommendation_notes },
      req.user.id,
      req.user.name
    );
    
    res.json(decision);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Finalize decision (approve/reject)
router.post('/:id/decision/finalize', authenticate, authorize('Approver', 'Admin'), async (req, res) => {
  try {
    const { final_decision, conditions, rejection_reason } = req.body;
    
    if (!final_decision) {
      return res.status(400).json({ error: 'Final decision is required' });
    }

    const decision = await decisionService.finalizeDecision(
      req.params.id,
      { final_decision, conditions, rejection_reason },
      req.user.id,
      req.user.name
    );
    
    res.json(decision);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate credit memo
router.get('/:id/memo', authenticate, async (req, res) => {
  try {
    const memo = await memoService.generateMemo(
      req.params.id,
      req.user.id,
      req.user.name
    );
    
    res.json(memo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit log for application
router.get('/:id/audit', authenticate, async (req, res) => {
  try {
    const logs = await auditService.getByApplication(req.params.id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Made with Bob
