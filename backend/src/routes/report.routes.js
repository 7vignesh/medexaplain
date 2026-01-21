const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const {
  uploadReport,
  getReports,
  getReportById,
  deleteReport,
  getParameterTrend,
  addNotes,
  regenerateInsights,
  generateRiskAssessment,
} = require('../controllers/report.controller');

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   POST /api/reports/upload
 * @desc    Upload and process a medical report
 * @access  Private
 */
router.post('/upload', uploadReport);

/**
 * @route   GET /api/reports
 * @desc    Get all reports for current user
 * @access  Private
 */
router.get('/', getReports);

/**
 * @route   GET /api/reports/trend/:parameterName
 * @desc    Get parameter trends over time
 * @access  Private
 */
router.get('/trend/:parameterName', getParameterTrend);

/**
 * @route   POST /api/reports/:id/regenerate
 * @desc    Regenerate AI insights for a report
 * @access  Private
 */
router.post('/:id/regenerate', regenerateInsights);

/**
 * @route   POST /api/reports/:id/risk-assessment
 * @desc    Generate health risk assessment for a report
 * @access  Private
 */
router.post('/:id/risk-assessment', generateRiskAssessment);

/**
 * @route   PUT /api/reports/:id/notes
 * @desc    Add notes to a report
 * @access  Private
 */
router.put('/:id/notes', addNotes);

/**
 * @route   GET /api/reports/:id
 * @desc    Get a single report by ID
 * @access  Private
 */
router.get('/:id', getReportById);

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete a report
 * @access  Private
 */
router.delete('/:id', deleteReport);

module.exports = router;
