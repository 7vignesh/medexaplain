const express = require('express');
const authenticate = require('../middleware/authenticate');
const {
  analyze,
  getResult,
  getMetrics,
  getHistory,
  askFollowUp,
} = require('../controllers/analysis.controller');

const router = express.Router();

router.use(authenticate);

/**
 * @route   POST /api/v2/analyze
 * @desc    Create explainable AI analysis job
 * @access  Private
 */
router.post('/analyze', analyze);

/**
 * @route   POST /api/v2/follow-up
 * @desc    Ask follow-up question using previous analysis context
 * @access  Private
 */
router.post('/follow-up', askFollowUp);

/**
 * @route   GET /api/v2/result/:id
 * @desc    Get analysis result by id
 * @access  Private
 */
router.get('/result/:id', getResult);

/**
 * @route   GET /api/v2/history
 * @desc    Get recent analysis history for current user
 * @access  Private
 */
router.get('/history', getHistory);

/**
 * @route   GET /api/v2/metrics
 * @desc    Get analysis metrics snapshot
 * @access  Private
 */
router.get('/metrics', getMetrics);

module.exports = router;
