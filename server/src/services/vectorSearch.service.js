/**
 * VECTOR SEARCH SERVICE
 *
 * Implement Semantic Search using MongoDB Atlas Vector Search
 * Phục vụ CHƯƠNG 3.3.2 - Vector Search Implementation
 *
 * Algorithm: HNSW (Hierarchical Navigable Small World)
 * Similarity: Cosine Similarity
 * Dimensions: 768 (Google Gemini text-embedding-004)
 */

const Book = require('../models/books.model');
const { generateEmbedding } = require('./embedding.service');

/**
 * Vector Search - Tìm kiếm ngữ nghĩa
 *
 * @param {string} query - Câu hỏi/truy vấn của user
 * @param {Object} options - Search options
 * @param {number} options.limit - Số kết quả trả về (default: 10)
 * @param {Object} options.filter - Pre-filter conditions
 * @param {string} options.category - Filter by category (optimized via Atlas index)
 * @param {number} options.minYear - Min publication year (optimized via Atlas index)
 * @param {number} options.maxYear - Max publication year (optimized via Atlas index)
 * @returns {Promise<Array>} Ranked books by semantic relevance
 */
async function vectorSearch(query, options = {}) {
    const { limit = 10, filter = {}, category, minYear, maxYear } = options;

    try {
        console.log(`🔍 Vector Search: "${query}"`);

        // Step 1: Generate query embedding
        console.log('⚙️  Step 1: Generating query embedding...');
        const startEmbed = Date.now();
        const queryEmbedding = await generateEmbedding(query);
        const embedTime = Date.now() - startEmbed;
        console.log(`   ✅ Generated in ${embedTime}ms`);

        // Step 2: Build aggregation pipeline with optimized filters
        console.log('⚙️  Step 2: Building vector search pipeline...');

        // Build Atlas-optimized filters (these run DURING vector search, not after)
        const atlasFilters = [];
        if (category) {
            atlasFilters.push({ category: category });
        }
        if (minYear || maxYear) {
            const yearFilter = {};
            if (minYear) yearFilter.$gte = minYear;
            if (maxYear) yearFilter.$lte = maxYear;
            atlasFilters.push({ publicationYear: yearFilter });
        }
        // Always filter available copies
        atlasFilters.push({ availableCopies: { $gt: 0 } });

        const pipeline = [
            {
                $vectorSearch: {
                    index: 'vector_index', // Index name from Atlas
                    path: 'embedding', // Field path
                    queryVector: queryEmbedding, // 768-dim query vector
                    numCandidates: 100, // HNSW search space (candidates to evaluate)
                    limit: limit, // Final results
                    // Pre-filters executed DURING vector search (FASTER)
                    filter: atlasFilters.length > 0 ? { $and: atlasFilters } : undefined,
                },
            },
            {
                $project: {
                    title: 1,
                    author: 1,
                    isbn: 1,
                    dailyRentalFee: 1,
                    description: 1,
                    category: 1,
                    availableCopies: 1,
                    totalCopies: 1,
                    location: 1,
                    images: 1,
                    publisher: 1,
                    borrowCount: 1,
                    publicationYear: 1,
                    // Include vector search score
                    score: { $meta: 'vectorSearchScore' },
                },
            },
            // Apply additional custom filters if provided (runs AFTER vector search)
            ...(Object.keys(filter).length > 0 ? [{ $match: filter }] : []),
        ];

        // Step 3: Execute vector search
        console.log('⚙️  Step 3: Executing HNSW search...');
        const startSearch = Date.now();
        const results = await Book.aggregate(pipeline);
        const searchTime = Date.now() - startSearch;

        // Results are already normalized to book schema
        const normalizedResults = results.map((book) => ({
            ...book,
            vectorScore: book.score,
        }));

        console.log(`   ✅ Found ${normalizedResults.length} results in ${searchTime}ms`);
        console.log(`   📊 Top score: ${normalizedResults[0]?.score.toFixed(4) || 'N/A'}`);

        // Metrics
        const totalTime = embedTime + searchTime;
        console.log(`⏱️  Total: ${totalTime}ms (Embed: ${embedTime}ms + Search: ${searchTime}ms)`);

        return normalizedResults;
    } catch (error) {
        console.error('❌ Vector search failed:', error);

        // Fallback to empty results (let hybrid search use BM25)
        return [];
    }
}

/**
 * Explain vector search results (for debugging)
 *
 * @param {string} query
 * @returns {Promise<Object>} Search explanation
 */
async function explainVectorSearch(query) {
    try {
        const queryEmbedding = await generateEmbedding(query);

        const pipeline = [
            {
                $vectorSearch: {
                    index: 'vector_index',
                    path: 'embedding',
                    queryVector: queryEmbedding,
                    numCandidates: 100,
                    limit: 10,
                },
            },
            {
                $project: {
                    title: 1,
                    author: 1,
                    score: { $meta: 'vectorSearchScore' },
                },
            },
        ];

        const results = await Book.aggregate(pipeline);

        return {
            query,
            queryVectorLength: queryEmbedding.length,
            resultsCount: results.length,
            topResults: results.map((r) => ({
                title: r.title,
                author: r.author,
                score: r.score.toFixed(4),
            })),
            algorithmUsed: 'HNSW (Hierarchical Navigable Small World)',
            similarity: 'Cosine Similarity',
            dimensions: 768,
        };
    } catch (error) {
        throw new Error(`Explain failed: ${error.message}`);
    }
}

module.exports = {
    vectorSearch,
    explainVectorSearch,
};
