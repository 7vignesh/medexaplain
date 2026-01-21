const multer = require('multer');
const reportService = require('../services/report.service');
const healthRiskService = require('../services/healthRisk.service');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  },
}).single('file');

/**
 * Upload and process a medical report
 */
const uploadReport = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }
      
      // For images, OCR text should be sent from frontend
      const extractedText = req.body.extractedText || null;
      
      const report = await reportService.processReport(
        req.file,
        req.user._id,
        extractedText
      );
      
      res.status(201).json({
        success: true,
        message: 'Report uploaded successfully. Processing...',
        data: report,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });
};

/**
 * Get all reports for the current user
 */
const getReports = async (req, res) => {
  try {
    const { limit, skip, sortBy, sortOrder } = req.query;
    
    const reports = await reportService.getUserReports(req.user._id, {
      limit: parseInt(limit) || 10,
      skip: parseInt(skip) || 0,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    });
    
    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get a single report by ID
 */
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await reportService.getReportById(id, req.user._id);
    
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete a report
 */
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    await reportService.deleteReport(id, req.user._id);
    
    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get parameter trends
 */
const getParameterTrend = async (req, res) => {
  try {
    const { parameterName } = req.params;
    
    const trendData = await reportService.getParameterTrend(
      req.user._id,
      parameterName
    );
    
    res.json({
      success: true,
      data: trendData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Add notes to a report
 */
const addNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const report = await reportService.addNotes(id, req.user._id, notes);
    
    res.json({
      success: true,
      message: 'Notes added successfully',
      data: report,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Regenerate AI insights for a report
 */
const regenerateInsights = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    await reportService.getReportById(id, req.user._id);
    
    // Trigger regeneration
    reportService.generateAIInsights(id).catch(console.error);
    
    res.json({
      success: true,
      message: 'Regenerating AI insights...',
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Generate health risk assessment for a report
 */
const generateRiskAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Get report
    const report = await reportService.getReportById(id, userId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Check if risk assessment exists and is complete
    const isIncomplete = !report.riskAssessment || 
                        !report.riskAssessment.visualJustification ||
                        report.riskAssessment.visualJustification.length < 10 ||
                        !report.riskAssessment.diseaseRisks?.length ||
                        !report.riskAssessment.topInfluencingParameters?.length;

    // If assessment exists but is incomplete, or user wants to regenerate, clear it
    if (report.riskAssessment && (isIncomplete || req.query.force === 'true')) {
      console.log('🔄 Clearing incomplete/existing risk assessment for regeneration');
      report.riskAssessment = undefined;
      report.riskAssessmentStatus = 'pending';
      report.riskAssessmentError = null;
      await report.save();
    }

    // If complete assessment exists and no force regeneration, return cached
    if (report.riskAssessment && report.riskAssessmentStatus === 'completed' && !isIncomplete) {
      console.log('✅ Returning cached risk assessment');
      return res.json({
        success: true,
        message: 'Risk assessment already exists',
        data: report.riskAssessment,
      });
    }

    // Update status to processing
    report.riskAssessmentStatus = 'processing';
    await report.save();
    console.log('⏳ Starting risk assessment generation...');

    // Generate risk assessment
    const riskAssessment = await healthRiskService.generateRiskAssessment(
      report.parameters,
      report.healthSummary
    );

    // Validate that we got meaningful data
    if (!riskAssessment || !riskAssessment.seriousnessLevel) {
      throw new Error('Invalid risk assessment response from AI');
    }

    // Ensure visualJustification is present
    if (!riskAssessment.visualJustification || riskAssessment.visualJustification.length < 10) {
       riskAssessment.visualJustification = "The clinical analysis indicates specific health markers that should be discussed with your doctor. Please review the detailed risk factors and recommended actions below.";
    }

    // Save assessment to report
    report.riskAssessment = riskAssessment;
    report.riskAssessmentStatus = 'completed';
    report.riskAssessmentError = null;
    await report.save();
    console.log('✅ Risk assessment saved successfully');

    res.json({
      success: true,
      message: 'Risk assessment generated successfully',
      data: riskAssessment,
    });
  } catch (error) {
    console.error('❌ Error generating risk assessment:', error);
    
    // Update report with error status
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const report = await reportService.getReportById(id, userId);
      if (report) {
        report.riskAssessmentStatus = 'failed';
        report.riskAssessmentError = error.message;
        await report.save();
      }
    } catch (updateError) {
      console.error('Error updating report status:', updateError);
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate risk assessment',
    });
  }
};

module.exports = {
  uploadReport,
  getReports,
  getReportById,
  deleteReport,
  getParameterTrend,
  addNotes,
  regenerateInsights,
  generateRiskAssessment,
};
