const mongoose = require('mongoose');
const { encryptData, decryptData } = require('../utils/encryption');

/**
 * User Schema
 * Stores user information and authentication details
 */
const userSchema = new mongoose.Schema({
  // User profile information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  
  displayName: {
    type: String,
    trim: true,
  },
  
  photoURL: {
    type: String,
  },
  
  // Password for authentication (hashed with bcrypt)
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  
  // User preferences
  preferences: {
    notifications: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Timestamps
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Index for faster queries
userSchema.index({ email: 1 });

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Transform output (remove sensitive data)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
