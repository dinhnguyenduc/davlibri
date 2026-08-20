/**
 * HYBRID SEARCH SERVICE
 *
 * Kết hợp BM25 (keyword) và Vector (semantic) search
 * Đây là ĐIỂM NHẤN của luận văn - CHƯƠNG 4.3.3
 *
 * Algorithm:
 * 1. Parallel search: BM25 + Vector
 * 2. Score fusion: Weighted average
 * 3. Re-ranking: Sort by hybrid score
 */

const { vectorSearch } = require('./vectorSearch.service');
const Book = require('../models/books.model');

/**
 * BM25 Text Search (existing implementation)
 */
async function bm25Search(query, limit = 10) {
    const keywords = query
        .toLowerCase()
        .replace(/[?.,!]/g, '')
        .split(' ')
        .filter((w) => w.length > 2);

    const books = await Book.find({
        $text: { $search: keywords.join(' ') },
        availableCopies: { $gt: 0 },
    })
        .select(
            'title author isbn dailyRentalFee availableCopies totalCopies location description category images publisher borrowCount publicationYear',
        )
        .sort({ score: { $meta: 'textScore' }, borrowCount: -1 })
        .limit(limit)
        .lean();

    // Add textScore
    return books.map((book, index) => ({
        ...book,
        bm25Score: 1 - index / limit, // Normalize: 1.0 → 0.0
        source: 'bm25',
    }));
}

/**
 * Hybrid Search - KẾT HỢP BM25 + VECTOR
 *
 * @param {string} query
 * @param {Object} options
 * @param {number} options.limit - Final results count
 * @param {string} options.category - Filter by category
 * @param {number} options.minYear - Min publication year
 * @param {number} options.maxYear - Max publication year
 * @param {number} options.bm25Weight - Weight for BM25 (default: 0.4)
 * @param {number} options.vectorWeight - Weight for Vector (default: 0.6)
 * @returns {Promise<Array>} Ranked books
 */
async function hybridSearch(query, options = {}) {
    const {
        limit = 10,
        bm25Weight = 0.4, // BM25: 40%
        vectorWeight = 0.6, // Vector: 60%
    } = options;

    console.log(`\n🔀 HYBRID SEARCH: "${query}"`);
    console.log(`   Weights: BM25=${bm25Weight}, Vector=${vectorWeight}`);
    console.log('─'.repeat(60));

    const startTime = Date.now();

    try {
        // Step 1: Parallel search
        console.log('⚙️  Step 1: Parallel search (BM25 + Vector)...');
        const [bm25Results, vectorResults] = await Promise.all([
            bm25Search(query, limit * 2), // Get more candidates
            vectorSearch(query, { limit: limit * 2 }),
        ]);

        console.log(`   📊 BM25 found: ${bm25Results.length}`);
        console.log(`   📊 Vector found: ${vectorResults.length}`);

        // Step 2: Score fusion
        console.log('⚙️  Step 2: Fusing scores...');
        const scoreMap = new Map();

        // Add BM25 scores
        bm25Results.forEach((book, index) => {
            const id = book._id.toString();
            const normalizedScore = 1 - index / bm25Results.length;

            scoreMap.set(id, {
                ...book,
                bm25Score: normalizedScore,
                vectorScore: 0,
                hybridScore: normalizedScore * bm25Weight,
                sources: ['bm25'],
            });
        });

        // Add/merge Vector scores
        vectorResults.forEach((book, index) => {
            const id = book._id.toString();
            const normalizedScore = book.score || 1 - index / vectorResults.length;

            if (scoreMap.has(id)) {
                // Book found by both methods - BOOST SCORE
                const existing = scoreMap.get(id);
                existing.vectorScore = normalizedScore;
                existing.hybridScore += normalizedScore * vectorWeight;
                existing.sources.push('vector');
            } else {
                // Only found by Vector
                scoreMap.set(id, {
                    ...book,
                    bm25Score: 0,
                    vectorScore: normalizedScore,
                    hybridScore: normalizedScore * vectorWeight,
                    sources: ['vector'],
                });
            }
        });

        // Step 3: Re-rank by hybrid score
        console.log('⚙️  Step 3: Re-ranking...');
        const rankedResults = Array.from(scoreMap.values())
            .sort((a, b) => b.hybridScore - a.hybridScore)
            .slice(0, limit);

        // Add metadata
        rankedResults.forEach((book, index) => {
            book.rank = index + 1;
        });

        const totalTime = Date.now() - startTime;

        // Metrics
        console.log('\n📊 RESULTS:');
        console.log(`   Total candidates: ${scoreMap.size}`);
        console.log(`   Final results: ${rankedResults.length}`);
        console.log(`   Found by both: ${rankedResults.filter((r) => r.sources.length > 1).length}`);
        console.log(`   Time: ${totalTime}ms`);

        // Top 3 preview
        if (rankedResults.length > 0) {
            console.log('\n🏆 TOP 3:');
            rankedResults.slice(0, 3).forEach((book) => {
                console.log(`   ${book.rank}. ${book.title}`);
                console.log(
                    `      Score: ${book.hybridScore.toFixed(4)} (BM25: ${book.bm25Score.toFixed(
                        2,
                    )}, Vector: ${book.vectorScore.toFixed(2)})`,
                );
                console.log(`      Sources: ${book.sources.join(' + ')}`);
            });
        }

        return rankedResults;
    } catch (error) {
        console.error('❌ Hybrid search failed:', error);

        // Fallback to BM25 only
        console.log('⚠️  Falling back to BM25 only...');
        return bm25Search(query, limit);
    }
}

/**
 * Compare BM25 vs Vector vs Hybrid
 * For evaluation (CHƯƠNG 5.2.3)
 */
async function compareSearchMethods(query) {
    console.log(`\n📊 SEARCH COMPARISON: "${query}"\n`);

    const [bm25, vector, hybrid] = await Promise.all([
        bm25Search(query, 10),
        vectorSearch(query, { limit: 10 }),
        hybridSearch(query, { limit: 10 }),
    ]);

    return {
        query,
        bm25: {
            count: bm25.length,
            top5: bm25.slice(0, 5).map((b) => b.title),
        },
        vector: {
            count: vector.length,
            top5: vector.slice(0, 5).map((b) => b.title),
        },
        hybrid: {
            count: hybrid.length,
            top5: hybrid.slice(0, 5).map((b) => b.title),
            bothMethods: hybrid.filter((b) => b.sources.length > 1).length,
        },
    };
}

module.exports = {
    hybridSearch,
    compareSearchMethods,
    bm25Search,
};
