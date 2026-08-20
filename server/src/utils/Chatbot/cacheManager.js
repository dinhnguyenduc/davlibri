/**
 * Simple In-Memory Cache for FAQ và AI responses
 * Giảm database queries và API calls
 */

class CacheManager {
    constructor() {
        this.faqCache = new Map(); // Cache FAQ results
        this.aiCache = new Map(); // Cache AI responses
        this.FAQ_TTL = 30 * 60 * 1000; // 30 phút
        this.AI_TTL = 60 * 60 * 1000; // 1 giờ
        this.MAX_CACHE_SIZE = 500; // Tối đa 500 items
    }

    /**
     * Tạo cache key từ question (normalize để tránh duplicate)
     */
    _normalizeQuestion(question) {
        return question
            .toLowerCase()
            .trim()
            .replace(/[?.!,]/g, '')
            .replace(/\s+/g, ' ');
    }

    /**
     * Get FAQ từ cache
     */
    getFAQ(question) {
        const key = this._normalizeQuestion(question);
        const cached = this.faqCache.get(key);

        if (!cached) return null;

        // Kiểm tra TTL
        if (Date.now() - cached.timestamp > this.FAQ_TTL) {
            this.faqCache.delete(key);
            return null;
        }

        console.log('✅ FAQ Cache HIT:', key.substring(0, 50));
        return cached.data;
    }

    /**
     * Set FAQ vào cache
     */
    setFAQ(question, data) {
        const key = this._normalizeQuestion(question);

        // Limit cache size (FIFO)
        if (this.faqCache.size >= this.MAX_CACHE_SIZE) {
            const firstKey = this.faqCache.keys().next().value;
            this.faqCache.delete(firstKey);
        }

        this.faqCache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Get AI response từ cache
     */
    getAI(question, contextHash = '') {
        const key = this._normalizeQuestion(question) + ':' + contextHash;
        const cached = this.aiCache.get(key);

        if (!cached) return null;

        // Kiểm tra TTL
        if (Date.now() - cached.timestamp > this.AI_TTL) {
            this.aiCache.delete(key);
            return null;
        }

        console.log('✅ AI Cache HIT:', key.substring(0, 50));
        return cached.data;
    }

    /**
     * Set AI response vào cache
     */
    setAI(question, data, contextHash = '') {
        const key = this._normalizeQuestion(question) + ':' + contextHash;

        // Limit cache size (FIFO)
        if (this.aiCache.size >= this.MAX_CACHE_SIZE) {
            const firstKey = this.aiCache.keys().next().value;
            this.aiCache.delete(firstKey);
        }

        this.aiCache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Clear cache (dùng khi update FAQ hoặc books)
     */
    clearFAQCache() {
        this.faqCache.clear();
        console.log('🗑️  FAQ Cache cleared');
    }

    clearAICache() {
        this.aiCache.clear();
        console.log('🗑️  AI Cache cleared');
    }

    clearAll() {
        this.clearFAQCache();
        this.clearAICache();
        console.log('🗑️  All cache cleared');
    }

    /**
     * Get cache stats
     */
    getStats() {
        return {
            faqCacheSize: this.faqCache.size,
            aiCacheSize: this.aiCache.size,
            totalSize: this.faqCache.size + this.aiCache.size,
        };
    }
}

// Singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;
