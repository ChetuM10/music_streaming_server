import rateLimit from "express-rate-limit";

/**
 * Rate Limiter Configuration
 *
 * Security feature to prevent API abuse and DDoS attacks.
 * Different limits for public vs authenticated endpoints.
 */

// General rate limiter for all requests
// 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  // Use default keyGenerator (handles IPv6 properly)
});

// Stricter limiter for authentication endpoints
// 10 requests per 15 minutes per IP (prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: "Too many login attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Higher limit for authenticated users
// 1000 requests per hour
export const authenticatedLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per window
  message: {
    success: false,
    message: "Rate limit exceeded, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for file uploads
// 20 uploads per hour per user
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    message: "Upload limit exceeded, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for search endpoints (prevent scraping)
// 60 searches per minute per IP
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: "Too many search requests, please slow down",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  generalLimiter,
  authLimiter,
  authenticatedLimiter,
  uploadLimiter,
  searchLimiter,
};
