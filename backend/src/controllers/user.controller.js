const User = require('../models/User');
const Report = require('../models/Report');

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { displayName, photoURL, preferences } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (displayName) user.displayName = displayName;
    if (photoURL) user.photoURL = photoURL;
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user statistics
 */
const getStats = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments({ userId: req.user._id });
    const reportsThisMonth = await Report.countDocuments({
      userId: req.user._id,
      createdAt: {
        $gte: new Date(new Date().setDate(1)), // First day of current month
      },
    });
    
    const abnormalReports = await Report.countDocuments({
      userId: req.user._id,
      abnormalParameters: { $gt: 0 },
    });
    
    res.json({
      success: true,
      data: {
        totalReports,
        reportsThisMonth,
        abnormalReports,
        memberSince: req.user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getStats,
};
