/**
 * Advanced Cache Manager
 * Supports in-memory caching with Redis fallback
 * Includes cache invalidation, TTL management, and performance monitoring
 */

const logger = require('../utils/logger');

class CacheManager {
    constructor(options = {}) {
        this.store = new Map(); // In-memory cache
        this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default
        this.maxSize = options.maxSize || 1000; // Max cache entries
        this.strategy = options.strategy || 'LRU'; // LRU or LFU
        this.redis = options.redis || null; // Optional Redis client
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
        };

        // Use LRU tracking
        this.accessOrder = new Map();
        this.accessCount = new Map();
    }

    /**
     * Get value from cache
     */
    async get(key) {
        try {
            // Try memory cache first
            if (this.store.has(key)) {
                const entry = this.store.get(key);

                // Check if expired
                if (Date.now() > entry.expiry) {
                    this.store.delete(key);
                    this.stats.misses++;
                    logger.debug('Cache miss (expired)', { key });
                    return null;
                }

                // Update LRU/LFU stats
                this.accessOrder.set(key, Date.now());
                this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
                this.stats.hits++;

                logger.debug('Cache hit', { key, hitRate: this.getHitRate() });
                return entry.value;
            }

            // Try Redis if available
            if (this.redis) {
                const redisValue = await this.redis.get(key);
                if (redisValue) {
                    this.stats.hits++;
                    logger.debug('Cache hit (Redis)', { key });
                    return JSON.parse(redisValue);
                }
            }

            this.stats.misses++;
            logger.debug('Cache miss', { key });
            return null;
        } catch (error) {
            logger.error('Cache get error', { key, error: error.message });
            return null;
        }
    }

    /**
     * Set value in cache
     */
    async set(key, value, ttl = null) {
        try {
            const expiryTime = ttl || this.ttl;
            const entry = {
                value,
                expiry: Date.now() + expiryTime,
                createdAt: Date.now(),
                size: this.estimateSize(value),
            };

            // Check size limit and evict if necessary
            if (this.store.size >= this.maxSize) {
                this.evict();
            }

            // Store in memory
            this.store.set(key, entry);
            this.accessOrder.set(key, Date.now());
            this.accessCount.set(key, 1);
            this.stats.sets++;

            // Store in Redis if available
            if (this.redis) {
                await this.redis.setex(key, Math.floor(expiryTime / 1000), JSON.stringify(value));
            }

            logger.debug('Cache set', {
                key,
                size: entry.size,
                ttl: expiryTime / 1000,
            });

            return true;
        } catch (error) {
            logger.error('Cache set error', { key, error: error.message });
            return false;
        }
    }

    /**
     * Delete value from cache
     */
    async delete(key) {
        try {
            this.store.delete(key);
            this.accessOrder.delete(key);
            this.accessCount.delete(key);
            this.stats.deletes++;

            if (this.redis) {
                await this.redis.del(key);
            }

            logger.debug('Cache delete', { key });
            return true;
        } catch (error) {
            logger.error('Cache delete error', { key, error: error.message });
            return false;
        }
    }

    /**
     * Invalidate by pattern
     */
    async invalidatePattern(pattern) {
        try {
            const regex = new RegExp(pattern);
            let invalidated = 0;

            for (const key of this.store.keys()) {
                if (regex.test(key)) {
                    await this.delete(key);
                    invalidated++;
                }
            }

            logger.info('Pattern invalidation', { pattern, invalidated });
            return invalidated;
        } catch (error) {
            logger.error('Pattern invalidation error', { pattern, error: error.message });
            return 0;
        }
    }

    /**
     * Invalidate all cache
     */
    async clear() {
        const size = this.store.size;
        this.store.clear();
        this.accessOrder.clear();
        this.accessCount.clear();

        if (this.redis) {
            await this.redis.flushdb();
        }

        logger.info('Cache cleared', { itemsCleared: size });
        return size;
    }

    /**
     * LRU/LFU Eviction
     */
    evict() {
        let keyToEvict;

        if (this.strategy === 'LRU') {
            // Evict least recently used
            keyToEvict = Array.from(this.accessOrder.entries()).sort((a, b) => a[1] - b[1])[0][0];
        } else if (this.strategy === 'LFU') {
            // Evict least frequently used
            keyToEvict = Array.from(this.accessCount.entries()).sort((a, b) => a[1] - b[1])[0][0];
        }

        if (keyToEvict) {
            this.store.delete(keyToEvict);
            this.accessOrder.delete(keyToEvict);
            this.accessCount.delete(keyToEvict);
            this.stats.evictions++;

            logger.debug('Cache eviction', { strategy: this.strategy, keyEvicted: keyToEvict });
        }
    }

    /**
     * Estimate value size (in bytes)
     */
    estimateSize(value) {
        return new Blob([JSON.stringify(value)]).size;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.getHitRate();
        return {
            hitRate: `${(hitRate * 100).toFixed(2)}%`,
            hits: this.stats.hits,
            misses: this.stats.misses,
            sets: this.stats.sets,
            deletes: this.stats.deletes,
            evictions: this.stats.evictions,
            size: this.store.size,
            maxSize: this.maxSize,
            utilizationPercent: `${((this.store.size / this.maxSize) * 100).toFixed(2)}%`,
        };
    }

    /**
     * Calculate hit rate
     */
    getHitRate() {
        const total = this.stats.hits + this.stats.misses;
        return total === 0 ? 0 : this.stats.hits / total;
    }

    /**
     * Get keys matching pattern
     */
    getKeysByPattern(pattern) {
        const regex = new RegExp(pattern);
        return Array.from(this.store.keys()).filter((key) => regex.test(key));
    }

    /**
     * Get cache entry with metadata
     */
    getEntry(key) {
        return this.store.get(key) || null;
    }

    /**
     * Middleware for Express
     */
    middleware(options = {}) {
        const { keyPrefix = '', ttl = this.ttl } = options;

        return async (req, res, next) => {
            // Only cache GET requests
            if (req.method !== 'GET') {
                return next();
            }

            const cacheKey = `${keyPrefix}:${req.originalUrl}`;

            // Try to get from cache
            const cached = await this.get(cacheKey);
            if (cached) {
                logger.info('Cache hit (middleware)', { url: req.originalUrl });
                return res.json(cached);
            }

            // Intercept res.json
            const originalJson = res.json.bind(res);
            res.json = function (data) {
                // Cache successful responses
                if (res.statusCode === 200) {
                    this.cacheManager.set(cacheKey, data, ttl).catch((err) => {
                        logger.error('Cache middleware error', { error: err.message });
                    });
                }
                return originalJson(data);
            }.bind({ cacheManager: this });

            next();
        };
    }

    /**
     * Warm cache with predefined data
     */
    async warmCache(data) {
        let warmed = 0;
        for (const [key, value] of Object.entries(data)) {
            await this.set(key, value);
            warmed++;
        }
        logger.info('Cache warmed', { itemsWarmed: warmed });
        return warmed;
    }

    /**
     * Export cache contents for debugging
     */
    export() {
        const contents = {};
        for (const [key, entry] of this.store.entries()) {
            contents[key] = {
                value: entry.value,
                expiresIn: Math.max(0, entry.expiry - Date.now()),
                size: entry.size,
                accessCount: this.accessCount.get(key),
            };
        }
        return contents;
    }
}

module.exports = CacheManager;
