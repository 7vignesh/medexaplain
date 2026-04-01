/**
 * Response Validation Middleware
 * Intercepts responses and validates format before sending to client
 * Logs validation errors and maintains response integrity
 */

import type { Request, Response, NextFunction } from 'express';
import ResponseValidator from '../services/responseValidator.service';

interface ValidatedRequest extends Request {
  validationLog?: {
    requestId: string;
    timestamp: Date;
    endpoint: string;
    isValid: boolean;
    errors: string[];
  };
}

/**
 * Middleware to validate response format
 */
export const responseValidationMiddleware = (
  req: ValidatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to validate response
  res.json = function (data: any) {
    // Only validate v2 API responses
    if (req.path.includes('/api/v2/')) {
      const validation = ResponseValidator.validateAnalysisResponse(data);

      // Log validation
      const validationLog = {
        requestId: req.ip + '-' + Date.now(),
        timestamp: new Date(),
        endpoint: req.path,
        isValid: validation.isValid,
        errors: validation.errors,
      };

      // Store in request for logging
      (req as ValidatedRequest).validationLog = validationLog;

      // Log errors to console (dev) or external service (prod)
      if (!validation.isValid) {
        console.warn(`[VALIDATION ERROR] ${req.path}:`, validation.errors);
      }

      if (validation.warnings.length > 0) {
        console.warn(`[VALIDATION WARNING] ${req.path}:`, validation.warnings);
      }

      // If invalid, wrap in error response
      if (!validation.isValid) {
        const errorResponse = {
          success: false,
          error: 'Response validation failed',
          validationErrors: validation.errors,
          data: null,
        };
        return originalJson.call(this, errorResponse).status(500);
      }

      // If valid, sanitize and return
      const sanitized = ResponseValidator.sanitizeResponse(data);
      return originalJson.call(this, sanitized);
    }

    // Non-v2 endpoints pass through unchanged
    return originalJson(data);
  };

  next();
};

/**
 * Middleware to normalize response format for consistency
 */
export const responseNormalizationMiddleware = (
  req: ValidatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Store original send method
  const originalSend = res.send.bind(res);

  // Override send method
  res.send = function (data: any) {
    // Handle v2 analysis endpoints
    if (req.path.includes('/api/v2/') && typeof data === 'object' && data !== null) {
      try {
        // Normalize response format
        const normalized = ResponseValidator.normalizeResponse(data);
        return originalSend(normalized);
      } catch (error) {
        console.error('[NORMALIZATION ERROR]:', error);
        return originalSend(data); // Fall back to original
      }
    }

    return originalSend(data);
  };

  next();
};

/**
 * Error handler specifically for validation errors
 */
export const validationErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.message.includes('validation')) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
    });
  }

  next(err);
};

/**
 * Logging middleware for validation results
 */
export const validationLoggingMiddleware = (
  req: ValidatedRequest,
  res: Response,
  next: NextFunction
) => {
  res.on('finish', () => {
    if (req.validationLog) {
      const { endpoint, isValid, errors } = req.validationLog;
      const status = res.statusCode;
      const duration = Date.now() - (req.validationLog as any).startTime || 0;

      const logEntry = {
        timestamp: new Date().toISOString(),
        endpoint,
        status,
        isValid,
        errorCount: errors.length,
        duration: `${duration}ms`,
      };

      // In production, send to logging service
      if (process.env.NODE_ENV === 'production') {
        // Send to external logging service (Sentry, DataDog, etc.)
        console.log('[VALIDATION_LOG]', JSON.stringify(logEntry));
      } else {
        console.log('[VALIDATION_LOG]', logEntry);
      }
    }
  });

  next();
};

export default responseValidationMiddleware;
