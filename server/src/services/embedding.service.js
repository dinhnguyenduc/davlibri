/**
 * EMBEDDING SERVICE
 *
 * Tích hợp Google Gemini text-embedding-004
 * Phục vụ CHƯƠNG 3.3.2 - Vector Search Implementation
 *
 * Model specs:
 * - Input: Text (max 2048 tokens)
 * - Output: 768-dimensional vector
 * - Normalization: L2 normalized (||v|| = 1)
 */

const axios = require('axios');
require('dotenv').config();

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Generate embedding vector from text
 *
 * @param {string} text - Input text to embed
 * @returns {Promise<number[]>} 768-dimensional vector
 * @throws {Error} If API call fails
 */
async function generateEmbedding(text) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    // Truncate text if too long (max 2048 tokens ≈ 8000 chars)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;

    const url = `${EMBEDDING_API_URL}/${EMBEDDING_MODEL}:embedContent`;

    try {
        const response = await axios.post(
            `${url}?key=${apiKey}`,
            {
                content: {
                    parts: [{ text: truncatedText }],
                },
                taskType: 'RETRIEVAL_DOCUMENT', // Optimize for search
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000, // 10s timeout
            },
        );

        const embedding = response.data.embedding.values;

        // Validate dimensions
        if (embedding.length !== 768) {
            throw new Error(`Invalid embedding dimensions: ${embedding.length}, expected 768`);
        }

        console.log(`✅ Generated embedding: ${embedding.length} dims`);
        return embedding;
    } catch (error) {
        console.error('❌ Embedding generation failed:', error.message);
        throw new Error(`Embedding API error: ${error.message}`);
    }
}

/**
 * Batch generate embeddings (with rate limiting)
 *
 * @param {string[]} texts - Array of texts
 * @param {number} delayMs - Delay between requests (default 100ms)
 * @returns {Promise<number[][]>} Array of embeddings
 */
async function batchGenerateEmbeddings(texts, delayMs = 100) {
    const embeddings = [];

    for (let i = 0; i < texts.length; i++) {
        try {
            const embedding = await generateEmbedding(texts[i]);
            embeddings.push(embedding);

            console.log(`📊 Progress: ${i + 1}/${texts.length}`);

            // Rate limiting: 10 req/sec
            if (i < texts.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        } catch (error) {
            console.error(`❌ Failed for text ${i + 1}:`, error.message);
            embeddings.push(null); // Mark as failed
        }
    }

    return embeddings;
}

/**
 * Prepare book text for embedding
 * Combines title, author, description for better semantic context
 *
 * @param {Object} book - Book document
 * @returns {string} Combined text
 */
function prepareBookText(book) {
    const parts = [
        `Tiêu đề: ${book.title}`,
        book.author ? `Tác giả: ${book.author}` : '',
        book.isbn ? `ISBN: ${book.isbn}` : '',
        book.publisher ? `Nhà xuất bản: ${book.publisher}` : '',
        book.category ? `Danh mục: ${book.category}` : '',
        book.description ? `Mô tả: ${book.description}` : '',
        book.keywords?.length ? `Từ khóa: ${book.keywords.join(', ')}` : '',
    ].filter((p) => p); // Remove empty parts

    return parts.join('. ');
}

module.exports = {
    generateEmbedding,
    batchGenerateEmbeddings,
    prepareBookText,
    EMBEDDING_MODEL,
};
