const mongoose = require('mongoose');
const { encryptData, decryptData } = require('../utils/encryption');

/**
 * Report Schema
 * Stores medical report uploads and analysis results
 */
const reportSchema = new mongoose.Schema({
  // Reference to user who uploaded the report
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  
  // Original file information
  fileName: {
    type: String,
    required: true,
  },
  
  fileType: {
    type: String,
    enum: ['pdf', 'image'],
    required: true,
  },
  
  fileSize: {
    type: Number, // in bytes
  },
  
  // OCR extracted text (encrypted)
  extractedText: {
    type: String,
    set: encryptData,
    get: decryptData,
  },
  
  // Parsed parameters from the report
  parameters: [{
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    unit: String,
    normalRange: String,
    category: String,
    status: {
      type: String,
      enum: ['normal', 'slightly_high', 'slightly_low', 'high', 'low', 'critical'],
      default: 'normal',
    },
    // AI-generated explanation for this parameter
    explanation: String,
  }],
  
  // Overall AI-generated health summary
  healthSummary: {
    type: String,
  },
  
  // Health Risk Assessment
  riskAssessment: {
    seriousnessLevel: {
      type: Number,
      min: 1,
      max: 10,
    },
    diseaseRisks: [{
      disease: String,
      riskPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
      keyIndicators: [String],
      explanation: String,
    }],
    topInfluencingParameters: [{
      name: String,
      impactScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      reason: String,
    }],
    visualJustification: String,
    recommendedActions: [String],
    analysisDate: Date,
    version: {
      type: String,
      default: '1.0',
    },
  },
  
  riskAssessmentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  
  riskAssessmentError: String,
  
  // Report metadata
  reportDate: {
    type: Date,
    default: Date.now,
  },
  
  labName: String,
  
  // Processing status
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  
  processingError: String,
  
  // Insights and alerts
  abnormalParameters: {
    type: Number,
    default: 0,
  },
  
  criticalParameters: {
    type: Number,
    default: 0,
  },
  
  // Tags for categorization
  tags: [String],
  
  // Notes added by user
  userNotes: String,
}, {
  timestamps: true,
  toJSON: { getters: true }, // Enable getters for decryption
  toObject: { getters: true },
});

// Indexes for faster queries
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ reportDate: -1 });
reportSchema.index({ processingStatus: 1 });

// Virtual for getting abnormal parameters
reportSchema.virtual('hasAbnormalValues').get(function() {
  return this.abnormalParameters > 0 || this.criticalParameters > 0;
});

// Method to calculate abnormal counts
reportSchema.methods.calculateAbnormalCounts = function() {
  this.abnormalParameters = this.parameters.filter(p => 
    ['slightly_high', 'slightly_low', 'high', 'low'].includes(p.status)
  ).length;
  
  this.criticalParameters = this.parameters.filter(p => 
    p.status === 'critical'
  ).length;
};

// Pre-save middleware to calculate abnormal counts
reportSchema.pre('save', function(next) {
  if (this.isModified('parameters')) {
    this.calculateAbnormalCounts();
  }
  next();
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
