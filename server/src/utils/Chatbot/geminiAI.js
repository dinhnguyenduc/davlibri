const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gọi Gemini AI để trả lời câu hỏi khi không tìm thấy trong FAQ
 * @param {string} question - Câu hỏi từ user
 * @param {string} context - Context về thư viện (optional)
 * @returns {Promise<string>} - Câu trả lời từ Gemini
 */
async function askGeminiAI(question, context = '') {
    try {
        const API_KEY = process.env.GEMINI_API_KEY;
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        const prompt = `
Bạn là trợ lý ảo của một thư viện cho thuê sách trực tuyến.
Nhiệm vụ của bạn là trả lời các câu hỏi về dịch vụ cho thuê sách một cách thân thiện và hữu ích.

${context ? `Thông tin về thư viện:\n${context}\n` : ''}

Câu hỏi của khách hàng: ${question}

Hãy trả lời một cách ngắn gọn, rõ ràng và thân thiện. Nếu không chắc chắn, khuyến khích khách hàng liên hệ trực tiếp với nhân viên hỗ trợ.
`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        return text;
    } catch (error) {
        console.error('Error calling Gemini AI:', error);
        throw new Error('Không thể kết nối với AI. Vui lòng thử lại sau.');
    }
}

module.exports = { askGeminiAI };
