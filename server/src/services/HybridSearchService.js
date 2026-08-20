/**
 * Optimized Hybrid Search Service
 * Combines BM25 keyword search + Vector semantic search
 * Includes preprocessing, relevance scoring, and performance optimization
 */

const logger = require('../utils/logger');

class HybridSearchService {
    constructor(mongoClient, embeddingService) {
        this.mongoClient = mongoClient;
        this.embeddingService = embeddingService;
        this.cache = new Map(); // In-memory cache
        this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
    }

    /**
     * Preprocess search query
     * - Remove stopwords
     * - Normalize whitespace
     * - Handle special characters
     */
    preprocessQuery(query) {
        const stopwords = new Set([
            'the',
            'a',
            'an',
            'and',
            'or',
            'but',
            'in',
            'on',
            'at',
            'to',
            'for',
            'of',
            'with',
            'by',
            'from',
            'as',
            'is',
            'was',
            'are',
            'be',
            'been',
            'being',
        ]);

        return query
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '') // Remove special chars
            .split(/\s+/)
            .filter((word) => word.length > 1 && !stopwords.has(word))
            .join(' ');
    }

    /**
     * BM25 Keyword Search (existing Mongoose text index)
     */
    async keywordSearch(query, limit = 10) {
        const startTime = Date.now();
        try {
            const results = await this.mongoClient
                .collection('books')
                .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .toArray();

            const duration = Date.now() - startTime;
            logger.database('keywordSearch', 'books', duration, {
                query,
                resultCount: results.length,
            });

            // Normalize BM25 scores to 0-1 range
            return results.map((doc) => ({
                ...doc,
                keywordScore: Math.min(doc.score / 100, 1), // Normalize
                searchType: 'keyword',
            }));
        } catch (error) {
            logger.error('Keyword search error', { query, error: error.message });
            return [];
        }
    }

    /**
     * Vector Semantic Search
     */
    async vectorSearch(query, limit = 10, threshold = 0.5) {
        const startTime = Date.now();
        try {
            // Generate embedding
            const embedding = await this.embeddingService.generateEmbedding(query);

            // Vector search using MongoDB Atlas aggregation
            const results = await this.mongoClient
                .collection('books')
                .aggregate([
                    {
                        $search: {
                            cosmosSearch: {
                                vector: embedding,
                                k: limit,
                            },
                            returnStoredSource: true,
                        },
                    },
                    {
                        $project: {
                            vectorScore: { $meta: 'searchScore' },
                            document: '$$ROOT',
                        },
                    },
                ])
                .toArray();

            const duration = Date.now() - startTime;
            logger.database('vectorSearch', 'books', duration, {
                query,
                resultCount: results.length,
            });

            // Filter by threshold and normalize scores
            return results
                .filter((doc) => doc.vectorScore >= threshold)
                .map((doc) => ({
                    ...doc.document,
                    vectorScore: doc.vectorScore,
                    searchType: 'vector',
                }));
        } catch (error) {
            logger.error('Vector search error', { query, error: error.message });
            return [];
        }
    }

    /**
     * Hybrid Search with intelligent merging
     */
    async search(query, options = {}) {
        const { limit = 10, keywordWeight = 0.4, vectorWeight = 0.6, minScore = 0.3 } = options;

        const startTime = Date.now();

        // Check cache
        const cacheKey = `${query}_${limit}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                logger.info('Cache hit for hybrid search', { query });
                return cached.results;
            } else {
                this.cache.delete(cacheKey);
            }
        }

        try {
            // Preprocess query
            const processedQuery = this.preprocessQuery(query);

            // Run both searches in parallel
            const [keywordResults, vectorResults] = await Promise.all([
                this.keywordSearch(processedQuery, limit * 2),
                this.vectorSearch(query, limit * 2, 0.3),
            ]);

            // Merge results with intelligent scoring
            const mergedResults = this.mergeResults(keywordResults, vectorResults, {
                keywordWeight,
                vectorWeight,
                minScore,
            });

            // Sort by combined score and limit
            const finalResults = mergedResults
                .sort((a, b) => b.combinedScore - a.combinedScore)
                .slice(0, limit)
                .map((doc) => ({
                    id: doc._id,
                    title: doc.title,
                    author: doc.author,
                    description: doc.description,
                    callNumber: doc.callNumber,
                    isbn: doc.isbn,
                    score: doc.combinedScore,
                    scoreBreakdown: {
                        keyword: doc.keywordScore || 0,
                        vector: doc.vectorScore || 0,
                    },
                }));

            // Cache result
            this.cache.set(cacheKey, {
                results: finalResults,
                timestamp: Date.now(),
            });

            const duration = Date.now() - startTime;
            logger.performance('Hybrid search', duration, {
                query,
                resultCount: finalResults.length,
                weights: { keyword: keywordWeight, vector: vectorWeight },
            });

            return finalResults;
        } catch (error) {
            logger.error('Hybrid search error', { query, error: error.message });
            return [];
        }
    }

    /**
     * Intelligent result merging
     */
    mergeResults(keywordResults, vectorResults, weights) {
        const merged = new Map();

        // Add keyword results
        keywordResults.forEach((doc) => {
            const id = doc._id.toString();
            merged.set(id, {
                ...doc,
                keywordScore: doc.keywordScore || 0,
                vectorScore: 0,
            });
        });

        // Merge vector results
        vectorResults.forEach((doc) => {
            const id = doc._id.toString();
            if (merged.has(id)) {
                const existing = merged.get(id);
                existing.vectorScore = doc.vectorScore || 0;
            } else {
                merged.set(id, {
                    ...doc,
                    keywordScore: 0,
                    vectorScore: doc.vectorScore || 0,
                });
            }
        });

        // Calculate combined scores
        const results = Array.from(merged.values()).map((doc) => {
            const combinedScore = doc.keywordScore * weights.keywordWeight + doc.vectorScore * weights.vectorWeight;

            return {
                ...doc,
                combinedScore,
            };
        });

        return results.filter((doc) => doc.combinedScore >= weights.minScore);
    }

    /**
     * Search with faceted filtering
     */
    async searchWithFacets(query, filters = {}, options = {}) {
        const results = await this.search(query, options);

        // Apply filters
        let filtered = results;

        if (filters.author) {
            filtered = filtered.filter((doc) => doc.author.toLowerCase().includes(filters.author.toLowerCase()));
        }

        if (filters.category) {
            filtered = filtered.filter((doc) => doc.category === filters.category);
        }

        if (filters.yearMin && filters.yearMax) {
            filtered = filtered.filter((doc) => {
                const year = new Date(doc.publishedDate).getFullYear();
                return year >= filters.yearMin && year <= filters.yearMax;
            });
        }

        if (filters.language) {
            filtered = filtered.filter((doc) => doc.language === filters.language);
        }

        logger.info('Filtered search results', {
            originalCount: results.length,
            filteredCount: filtered.length,
            filters,
        });

        return filtered;
    }

    /**
     * Get search suggestions (autocomplete)
     */
    async getSuggestions(query, limit = 5) {
        if (query.length < 2) return [];

        try {
            const suggestions = await this.mongoClient
                .collection('books')
                .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .project({ title: 1, author: 1 })
                .toArray();

            return suggestions.map((doc) => ({
                id: doc._id,
                title: doc.title,
                author: doc.author,
                label: `${doc.title} by ${doc.author}`,
            }));
        } catch (error) {
            logger.error('Suggestions error', { query, error: error.message });
            return [];
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        logger.info('Cache cleared', { itemsCleared: size });
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.cache.size,
            expiry: this.cacheExpiry / 1000 / 60, // in minutes
        };
    }

    /**
     * Performance analysis
     */
    async analyzePerformance(queries = []) {
        const results = [];

        for (const query of queries) {
            const start = Date.now();
            await this.search(query);
            const duration = Date.now() - start;
            results.push({ query, duration });
        }

        const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
        const maxDuration = Math.max(...results.map((r) => r.duration));
        const minDuration = Math.min(...results.map((r) => r.duration));

        logger.info('Performance analysis', {
            queriesAnalyzed: results.length,
            avgDuration: `${avgDuration.toFixed(2)}ms`,
            maxDuration: `${maxDuration}ms`,
            minDuration: `${minDuration}ms`,
        });

        return {
            results,
            stats: {
                average: avgDuration,
                max: maxDuration,
                min: minDuration,
            },
        };
    }
}

module.exports = HybridSearchService;
