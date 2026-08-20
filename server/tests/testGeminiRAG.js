require('dotenv').config();
const mongoose = require('mongoose');
const { askGeminiAI } = require('./src/utils/Chatbot/geminiAIWithRAG');

async function test() {
    try {
        console.log('ðŸ§ª Testing Gemini AI with RAG...');
        console.log('ðŸ“ API Key:', process.env.GEMINI_API_KEY ? 'âœ“ Configured' : 'âœ— Missing');

        // Káº¿t ná»‘i database (optional - náº¿u khÃ´ng connect thÃ¬ sáº½ dÃ¹ng fallback)
        try {
            console.log('ðŸ”Œ Connecting to MongoDB...');
            await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/library', {
                serverSelectionTimeoutMS: 5000,
            });
            console.log('âœ“ MongoDB connected');
        } catch (dbError) {
            console.log('âš ï¸  MongoDB not connected (using fallback mode)');
        }

        console.log('');

        const context = `
- ThÆ° viá»‡n cho thuÃª sÃ¡ch trá»±c tuyáº¿n
- Há»— trá»£ nhiá»u hÃ¬nh thá»©c thanh toÃ¡n
- Giao sÃ¡ch táº­n nÆ¡i miá»…n phÃ­ ná»™i thÃ nh
- LiÃªn há»‡: library@dav.edu.vn, Hotline: 0123-456-789
        `;

        console.log('ðŸš€ Sending test question...');
        const result = await askGeminiAI('ThÆ° viá»‡n cÃ³ nhá»¯ng loáº¡i sÃ¡ch gÃ¬?', context);

        console.log('\nâœ… Success!');
        console.log('ðŸ“¦ Result type:', typeof result);
        console.log('ðŸ“ Answer:', result.answer);
        console.log('ðŸ”– Source:', result.source);

        if (result.relatedBooks && result.relatedBooks.length > 0) {
            console.log('ðŸ“š Related books:', result.relatedBooks.length);
        }

        // ÄÃ³ng káº¿t ná»‘i database
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('\nðŸ”Œ MongoDB disconnected');
        }
    } catch (error) {
        console.error('\nâŒ Error:', error.message);
        console.error('ðŸ“‹ Error name:', error.name);
        if (error.stack) {
            console.error('ðŸ” Stack trace:', error.stack.split('\n').slice(0, 3).join('\n'));
        }

        // ÄÃ³ng káº¿t ná»‘i database khi cÃ³ lá»—i
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }

        process.exit(1);
    }
}

test();

