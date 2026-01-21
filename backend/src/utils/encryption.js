const CryptoJS = require('crypto-js');

/**
 * Get encryption key from environment
 */
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  return key;
};

/**
 * Encrypt sensitive data before storing in database
 * @param {string} data - Data to encrypt
 * @returns {string} - Encrypted data
 */
const encryptData = (data) => {
  if (!data) return data;
  
  try {
    const encrypted = CryptoJS.AES.encrypt(
      data, 
      getEncryptionKey()
    ).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data when retrieving from database
 * @param {string} encryptedData - Encrypted data
 * @returns {string} - Decrypted data
 */
const decryptData = (encryptedData) => {
  if (!encryptedData) return encryptedData;
  
  try {
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData, 
      getEncryptionKey()
    ).toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

module.exports = {
  encryptData,
  decryptData,
};
