const medicalParametersDictionary = require('../../data/medical-parameters.json');

/**
 * Parse extracted text and identify medical parameters
 * @param {string} text - Extracted text from OCR
 * @returns {Array} - Array of identified parameters
 */
const parseParameters = (text) => {
  const identifiedParameters = [];
  const lines = text.split('\n');
  
  // Common patterns for medical reports
  const patterns = [
    // Pattern: "Parameter Name: Value Unit"
    /([A-Za-z0-9\s\-\/]+)\s*[:\-]\s*([\d\.]+)\s*([a-zA-Z\/\%]+)?/i,
    // Pattern: "Parameter Name   Value   Unit"
    /([A-Za-z0-9\s\-\/]+)\s+([\d\.]+)\s+([a-zA-Z\/\%]+)?/i,
  ];

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const [, paramName, value, unit] = match;
        
        // Try to match with dictionary
        const matchedParam = findParameterInDictionary(paramName.trim());
        
        if (matchedParam) {
          identifiedParameters.push({
            name: matchedParam.name,
            value: value.trim(),
            unit: unit?.trim() || matchedParam.unit,
            normalRange: matchedParam.normalRange,
            category: matchedParam.category,
            description: matchedParam.description,
          });
          break; // Found a match, move to next line
        }
      }
    }
  });

  return identifiedParameters;
};

/**
 * Find parameter in medical dictionary using fuzzy matching
 * @param {string} searchTerm - Term to search for
 * @returns {Object|null} - Matched parameter or null
 */
const findParameterInDictionary = (searchTerm) => {
  searchTerm = searchTerm.toLowerCase().trim();
  
  // First try exact match
  let match = medicalParametersDictionary.find(param => 
    param.name.toLowerCase() === searchTerm ||
    param.aliases?.some(alias => alias.toLowerCase() === searchTerm)
  );
  
  if (match) return match;
  
  // Try partial match
  match = medicalParametersDictionary.find(param => 
    param.name.toLowerCase().includes(searchTerm) ||
    searchTerm.includes(param.name.toLowerCase()) ||
    param.aliases?.some(alias => 
      alias.toLowerCase().includes(searchTerm) || 
      searchTerm.includes(alias.toLowerCase())
    )
  );
  
  return match || null;
};

/**
 * Determine parameter status by comparing value with normal range
 * @param {string} value - Parameter value
 * @param {string} normalRange - Normal range string (e.g., "70-100")
 * @returns {string} - Status: normal, slightly_high, high, slightly_low, low, critical
 */
const determineParameterStatus = (value, normalRange) => {
  if (!normalRange) return 'normal';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'normal';
  
  // Parse normal range
  const rangeMatch = normalRange.match(/([\d\.]+)\s*-\s*([\d\.]+)/);
  if (!rangeMatch) return 'normal';
  
  const [, min, max] = rangeMatch;
  const minValue = parseFloat(min);
  const maxValue = parseFloat(max);
  
  // Calculate thresholds
  const range = maxValue - minValue;
  const slightlyHighThreshold = maxValue + (range * 0.1); // 10% above max
  const slightlyLowThreshold = minValue - (range * 0.1); // 10% below min
  const criticalHighThreshold = maxValue + (range * 0.5); // 50% above max
  const criticalLowThreshold = minValue - (range * 0.5); // 50% below min
  
  // Determine status
  if (numValue >= criticalHighThreshold || numValue <= criticalLowThreshold) {
    return 'critical';
  } else if (numValue > maxValue && numValue < slightlyHighThreshold) {
    return 'slightly_high';
  } else if (numValue > slightlyHighThreshold) {
    return 'high';
  } else if (numValue < minValue && numValue > slightlyLowThreshold) {
    return 'slightly_low';
  } else if (numValue < slightlyLowThreshold) {
    return 'low';
  }
  
  return 'normal';
};

/**
 * Clean and normalize extracted text
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned text
 */
const cleanExtractedText = (text) => {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/ +/g, ' ') // Collapse multiple spaces
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .trim();
};

module.exports = {
  parseParameters,
  findParameterInDictionary,
  determineParameterStatus,
  cleanExtractedText,
};
