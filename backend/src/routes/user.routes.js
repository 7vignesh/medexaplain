const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const {
  getProfile,
  updateProfile,
  getStats,
} = require('../controllers/user.controller');

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', updateProfile);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', getStats);

module.exports = router;
