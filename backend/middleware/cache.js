const redisService = require('../services/redisService');

/**
 * Cache Middleware for Express Routes
 * 
 * Purpose: Automatically cache API responses to improve performance
 * 
 * Benefits:
 * 1. Reduces database queries for frequently accessed data
 * 2. Improves API response times (from ~100ms to ~10ms)
 * 3. Reduces server load and improves scalability
 * 4. Transparent caching - no changes needed in route handlers
 */

/**
 * Generic cache middleware
 * @param {number} ttl - Time to live in seconds
 * @param {function} keyGenerator - Function to generate cache key from request
 * 
 * Why: Provides flexible caching for different types of routes
 */
const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    let cacheKey;
    if (keyGenerator) {
      cacheKey = keyGenerator(req);
    } else {
      // Default key generation: route + user + query params
      const userId = req.user?.id || 'anonymous';
      const queryString = JSON.stringify(req.query);
      cacheKey = `api:${req.route.path}:${userId}:${Buffer.from(queryString).toString('base64')}`;
    }

    try {
      // Try to get from cache first
      const cachedData = await redisService.get(cacheKey);
      
      if (cachedData) {
        console.log(`🎯 Cache hit for ${req.originalUrl}`);
        return res.json(cachedData);
      }

      // If not in cache, intercept the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisService.set(cacheKey, data, ttl).catch(err => {
            console.error('Failed to cache response:', err);
          });
          console.log(`📦 Cached response for ${req.originalUrl} (TTL: ${ttl}s)`);
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

/**
 * User-specific cache middleware
 * Why: Cache user data that doesn't change frequently
 */
const userCacheMiddleware = (ttl = 600) => { // 10 minutes
  return cacheMiddleware(ttl, (req) => {
    return `user:${req.user?.id || 'anonymous'}:profile`;
  });
};

/**
 * Session cache middleware
 * Why: Cache user sessions to reduce database queries
 */
const sessionCacheMiddleware = (ttl = 300) => { // 5 minutes
  return cacheMiddleware(ttl, (req) => {
    const userId = req.user?.id || 'anonymous';
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    return `sessions:${userId}:page:${page}:limit:${limit}`;
  });
};

/**
 * Single session cache middleware
 * Why: Cache individual session data
 */
const singleSessionCacheMiddleware = (ttl = 600) => { // 10 minutes
  return cacheMiddleware(ttl, (req) => {
    const userId = req.user?.id || 'anonymous';
    const sessionId = req.params.id;
    return `session:${sessionId}:user:${userId}`;
  });
};

/**
 * Cache invalidation middleware
 * Why: Remove related cache entries when data is modified
 */
const invalidateCache = (...patterns) => {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override response methods to trigger cache invalidation
    const handleResponse = async function(data) {
      // Only invalidate on successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          for (const pattern of patterns) {
            let cachePattern;
            if (typeof pattern === 'function') {
              cachePattern = pattern(req);
            } else {
              cachePattern = pattern;
            }
            
            await redisService.delPattern(cachePattern);
            console.log(`🗑️ Invalidated cache pattern: ${cachePattern}`);
          }
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      }
      
      return data;
    };

    res.json = function(data) {
      handleResponse(data);
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      handleResponse(data);
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Cache warming function
 * Why: Pre-populate cache with frequently accessed data
 */
const warmCache = async (userId) => {
  try {
    console.log(`🔥 Warming cache for user: ${userId}`);
    
    // Warm user profile cache
    // This would typically fetch and cache user data
    // Implementation depends on your specific data needs
    
  } catch (error) {
    console.error('Cache warming error:', error);
  }
};

/**
 * Cache health check middleware
 * Why: Monitor cache performance and availability
 */
const cacheHealthCheck = async (req, res, next) => {
  try {
    const isAvailable = redisService.isAvailable();
    const stats = await redisService.getStats();
    
    req.cacheHealth = {
      available: isAvailable,
      stats: stats
    };
    
    next();
  } catch (error) {
    req.cacheHealth = {
      available: false,
      error: error.message
    };
    next();
  }
};

module.exports = {
  cacheMiddleware,
  userCacheMiddleware,
  sessionCacheMiddleware,
  singleSessionCacheMiddleware,
  invalidateCache,
  warmCache,
  cacheHealthCheck
};
