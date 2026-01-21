const Report = require('../models/Report');
const aiService = require('./ai.service');
const healthRiskService = require('./healthRisk.service');
const { 
  parseParameters, 
  determineParameterStatus, 
  cleanExtractedText 
} = require('../utils/parameterParser');
const { 
  extractTextFromPDF, 
  validateFileType, 
  validateFileSize 
} = require('../utils/fileProcessor');

/**
 * Report Service
 * Handles report creation, processing, and retrieval
 */
class ReportService {
  /**
   * Process uploaded file and create report
   * @param {Object} file - Multer file object
   * @param {string} userId - User ID
   * @param {string} extractedText - Text extracted from OCR (for images)
   * @returns {Promise<Object>} - Created report
   */
  async processReport(file, userId, extractedText = null) {
    try {
      // Validate file
      validateFileSize(file.size);
      const fileType = validateFileType(file.mimetype);
      
      // Extract text based on file type
      let rawText;
      if (fileType === 'pdf') {
        rawText = await extractTextFromPDF(file.buffer);
      } else {
        // For images, text should be provided from frontend OCR
        if (!extractedText) {
          throw new Error('OCR text not provided for image file');
        }
        rawText = extractedText;
      }
      
      // Clean extracted text
      const cleanedText = cleanExtractedText(rawText);
      
      // Parse parameters from text
      const parsedParameters = parseParameters(cleanedText);
      
      if (parsedParameters.length === 0) {
        throw new Error('No medical parameters found in the document');
      }
      
      // Determine status for each parameter
      const parametersWithStatus = parsedParameters.map(param => ({
        ...param,
        status: determineParameterStatus(param.value, param.normalRange),
      }));
      
      // Create report in database (without AI explanations first)
      const report = new Report({
        userId,
        fileName: file.originalname,
        fileType,
        fileSize: file.size,
        extractedText: cleanedText,
        parameters: parametersWithStatus,
        processingStatus: 'processing',
      });
      
      await report.save();
      
      // Generate AI explanations asynchronously
      this.generateAIInsights(report._id).catch(error => {
        console.error('AI insights generation failed:', error);
      });
      
      return report;
    } catch (error) {
      console.error('Report processing error:', error);
      throw error;
    }
  }

  /**
   * Generate AI explanations and summary for a report
   * @param {string} reportId - Report ID
   */
  async generateAIInsights(reportId) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }
      
      // Generate explanations for each parameter
      const parametersWithExplanations = await aiService.generateAllExplanations(
        report.parameters
      );
      
      // Generate overall health summary
      const healthSummary = await aiService.generateHealthSummary(
        parametersWithExplanations
      );
      
      // Generate Health Risk Assessment
      let riskAssessment = null;
      try {
        console.log(`Generating risk assessment for report ${reportId}...`);
        riskAssessment = await healthRiskService.generateRiskAssessment(
          parametersWithExplanations,
          healthSummary
        );
        console.log('Risk assessment generated successfully');
      } catch (riskError) {
        console.error('Failed to generate risk assessment:', riskError);
        // Don't fail the whole report if risk assessment fails
      }

      // Update report with AI insights using findByIdAndUpdate to avoid version conflicts
      const updateData = {
        parameters: parametersWithExplanations,
        healthSummary: healthSummary,
        processingStatus: 'completed'
      };

      if (riskAssessment) {
        updateData.riskAssessment = riskAssessment;
        updateData.riskAssessmentStatus = 'completed';
      }

      await Report.findByIdAndUpdate(reportId, { $set: updateData });
      
      console.log(`✅ AI insights generated for report ${reportId}`);
    } catch (error) {
      // Update report status to failed
      await Report.findByIdAndUpdate(reportId, {
        processingStatus: 'failed',
        processingError: error.message,
      });
      
      throw error;
    }
  }

  /**
   * Get all reports for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Promise<Array>} - User's reports
   */
  async getUserReports(userId, options = {}) {
    const {
      limit = 10,
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;
    
    const reports = await Report.find({ userId })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit)
      .skip(skip)
      .select('-extractedText'); // Exclude large text field
    
    return reports;
  }

  /**
   * Get a single report by ID
   * @param {string} reportId - Report ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} - Report
   */
  async getReportById(reportId, userId) {
    const report = await Report.findOne({ _id: reportId, userId });
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    return report;
  }

  /**
   * Delete a report
   * @param {string} reportId - Report ID
   * @param {string} userId - User ID (for authorization)
   */
  async deleteReport(reportId, userId) {
    const report = await Report.findOneAndDelete({ _id: reportId, userId });
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    return report;
  }

  /**
   * Get parameter trends over time
   * @param {string} userId - User ID
   * @param {string} parameterName - Parameter name
   * @returns {Promise<Array>} - Trend data
   */
  async getParameterTrend(userId, parameterName) {
    const reports = await Report.find({
      userId,
      processingStatus: 'completed',
      'parameters.name': parameterName,
    })
      .sort({ reportDate: 1 })
      .select('reportDate parameters');
    
    // Extract specific parameter values
    const trendData = reports.map(report => {
      const param = report.parameters.find(p => p.name === parameterName);
      return {
        date: report.reportDate,
        value: parseFloat(param.value),
        unit: param.unit,
        status: param.status,
      };
    });
    
    return trendData;
  }

  /**
   * Add user notes to a report
   * @param {string} reportId - Report ID
   * @param {string} userId - User ID
   * @param {string} notes - User notes
   */
  async addNotes(reportId, userId, notes) {
    const report = await Report.findOne({ _id: reportId, userId });
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    report.userNotes = notes;
    await report.save();
    
    return report;
  }
}

module.exports = new ReportService();
