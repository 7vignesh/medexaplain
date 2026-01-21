const rateLimit = require('express-rate-limit');

/**
 * Rate limiter middleware to prevent abuse
 * Limits requests per IP address
 */
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests in development
  skipSuccessfulRequests: process.env.NODE_ENV === 'development',
  // Skip failed requests
  skipFailedRequests: false,
});

module.exports = rateLimiter;
