const pdf = require('pdf-parse');

/**
 * Extract text from PDF file buffer
 * @param {Buffer} fileBuffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromPDF = async (fileBuffer) => {
  try {
    const data = await pdf(fileBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Validate file type
 * @param {string} mimetype - File mimetype
 * @returns {string} - File type: 'pdf' or 'image'
 */
const validateFileType = (mimetype) => {
  const allowedPdfTypes = ['application/pdf'];
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
  
  if (allowedPdfTypes.includes(mimetype)) {
    return 'pdf';
  } else if (allowedImageTypes.includes(mimetype)) {
    return 'image';
  } else {
    throw new Error('Invalid file type. Only PDF and images (JPEG, PNG, TIFF) are allowed.');
  }
};

/**
 * Validate file size (max 10MB)
 * @param {number} size - File size in bytes
 * @returns {boolean}
 */
const validateFileSize = (size) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (size > maxSize) {
    throw new Error('File size exceeds 10MB limit');
  }
  return true;
};

module.exports = {
  extractTextFromPDF,
  validateFileType,
  validateFileSize,
};
