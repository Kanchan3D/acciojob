const redis = require('redis');

/**
 * Redis Cache Service
 * 
 * Purpose: Provides centralized caching functionality for the application
 * Benefits:
 * 1. Faster data retrieval (RAM vs Disk storage)
 * 2. Reduced database load
 * 3. Improved application performance
 * 4. Session management
 * 5. API response caching
 */

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour default expiration
  }

  /**
   * Initialize Redis connection
   * Why: Establishes connection to Redis server with error handling
   */
  async connect() {
    try {
      // Create Redis client with configuration
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        // Connection settings for reliability
        socket: {
          connectTimeout: 10000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            // Exponential backoff for reconnection
            return Math.min(retries * 50, 2000);
          }
        }
      });

      // Event handlers for monitoring connection health
      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('🚀 Redis ready for operations');
      });

      this.client.on('end', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
      });

      // Establish connection
      await this.client.connect();
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Check if Redis is available
   * Why: Graceful fallback when Redis is unavailable
   */
  isAvailable() {
    return this.isConnected && this.client;
  }

  /**
   * Set cache value with expiration
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds
   * 
   * Why: Store frequently accessed data in memory for faster retrieval
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isAvailable()) {
      console.warn('Redis not available, skipping cache set');
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);
      console.log(`📦 Cached: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cache value
   * @param {string} key - Cache key
   * 
   * Why: Retrieve data from cache instead of expensive database queries
   */
  async get(key) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        console.log(`🎯 Cache hit: ${key}`);
        return JSON.parse(value);
      }
      console.log(`❌ Cache miss: ${key}`);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   * 
   * Why: Remove outdated data when updates occur
   */
  async del(key) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client.del(key);
      console.log(`🗑️ Cache deleted: ${key}`);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple cache entries by pattern
   * @param {string} pattern - Pattern to match keys
   * 
   * Why: Bulk deletion for related cache entries (e.g., user:123:*)
   */
  async delPattern(pattern) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️ Cache pattern deleted: ${pattern} (${keys.length} keys)`);
      }
      return true;
    } catch (error) {
      console.error('Cache pattern delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   */
  async exists(key) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Set cache TTL for existing key
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   */
  async expire(key, ttl) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * Why: Monitor cache performance and hit rates
   */
  async getStats() {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const info = await this.client.info('stats');
      return info;
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Close Redis connection
   * Why: Graceful shutdown
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      console.log('👋 Redis disconnected');
    }
  }
}

// Export singleton instance
const redisService = new RedisService();
module.exports = redisService;
