const config = require('../config');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.maxSize = config.cache.maxSize;
    this.duration = config.cache.duration;
    this.enabled = config.cache.enabled;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
    };
  }

  /**
   * Generate a cache key
   */
  generateKey(type, params = '') {
    return `${type}_${params}`.replace(/\s+/g, '_');
  }

  /**
   * Check if cache item is valid
   */
  isValid(item) {
    if (!item) {return false;}
    return (Date.now() - item.timestamp) < this.duration;
  }

  /**
   * Get item from cache
   */
  get(key) {
    if (!this.enabled) {return null;}

    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      logger.cache('miss', key);
      return null;
    }

    if (!this.isValid(item)) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.cache('expired', key);
      return null;
    }

    this.stats.hits++;
    logger.cache('hit', key, true);
    return item.data;
  }

  /**
   * Set item in cache
   */
  set(key, data) {
    if (!this.enabled) {return;}

    // If cache is at max size, remove oldest items
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const item = {
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccess: Date.now(),
    };

    this.cache.set(key, item);
    this.stats.sets++;
    logger.cache('set', key, false, { size: this.cache.size });
  }

  /**
   * Delete item from cache
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      logger.cache('delete', key);
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.clears++;
    logger.cache('clear', 'all', false, { clearedItems: size });
  }

  /**
   * Evict oldest items when cache is full
   */
  evictOldest() {
    const entries = Array.from(this.cache.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 10% of items
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    logger.cache('eviction', `${toRemove}_items`, false, { 
      remainingSize: this.cache.size 
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxSize,
      enabled: this.enabled,
    };
  }

  /**
   * Get cache keys matching a pattern
   */
  getKeys(pattern = null) {
    const keys = Array.from(this.cache.keys());
    
    if (!pattern) {return keys;}
    
    const regex = new RegExp(pattern);
    return keys.filter(key => regex.test(key));
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidate(pattern) {
    const keys = this.getKeys(pattern);
    let deleted = 0;

    keys.forEach(key => {
      if (this.cache.delete(key)) {
        deleted++;
      }
    });

    logger.cache('invalidate', pattern, false, { deletedKeys: deleted });
    return deleted;
  }

  /**
   * Warm up cache with provided data
   */
  warmUp(data) {
    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value);
    });

    logger.info('Cache warmed up', { keys: Object.keys(data).length });
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const before = this.cache.size;
    const expired = [];

    for (const [key, item] of this.cache.entries()) {
      if (!this.isValid(item)) {
        expired.push(key);
      }
    }

    expired.forEach(key => this.cache.delete(key));

    const cleaned = before - this.cache.size;
    if (cleaned > 0) {
      logger.cache('cleanup', 'expired', false, { 
        cleaned, 
        remaining: this.cache.size 
      });
    }

    return cleaned;
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Schedule periodic cleanup
if (config.cache.enabled) {
  setInterval(() => {
    cacheManager.cleanup();
  }, config.cache.duration);
}

module.exports = cacheManager;
