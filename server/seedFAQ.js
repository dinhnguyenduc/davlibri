// Script Ä‘á»ƒ thÃªm dá»¯ liá»‡u FAQ máº«u cho chatbot
const mongoose = require('mongoose');
require('dotenv').config();

// Káº¿t ná»‘i MongoDB - sá»­ dá»¥ng cÃ¹ng connection string vá»›i server
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error:', err));

const FAQ = require('./src/models/faq.model');

const sampleFAQs = [
    {
        question: 'LÃ m tháº¿ nÃ o Ä‘á»ƒ thuÃª sÃ¡ch trÃªn website?',
        answer: 'Äá»ƒ thuÃª sÃ¡ch, báº¡n cáº§n: 1) ÄÄƒng kÃ½/ÄÄƒng nháº­p tÃ i khoáº£n, 2) TÃ¬m sÃ¡ch muá»‘n thuÃª, 3) Chá»n ngÃ y thuÃª vÃ  ngÃ y tráº£, 4) ThÃªm vÃ o giá» hÃ ng, 5) Tiáº¿n hÃ nh thanh toÃ¡n. Ráº¥t Ä‘Æ¡n giáº£n!',
        keywords: ['thuÃª sÃ¡ch', 'cÃ¡ch thuÃª', 'hÆ°á»›ng dáº«n thuÃª', 'thuÃª nhÆ° tháº¿ nÃ o'],
        category: 'rental',
        isActive: true,
    },
    {
        question: 'GiÃ¡ thuÃª sÃ¡ch Ä‘Æ°á»£c tÃ­nh nhÆ° tháº¿ nÃ o?',
        answer: 'GiÃ¡ thuÃª sÃ¡ch Ä‘Æ°á»£c tÃ­nh theo cÃ´ng thá»©c: GiÃ¡ thuÃª/ngÃ y x Sá»‘ lÆ°á»£ng sÃ¡ch x Sá»‘ ngÃ y thuÃª. Báº¡n cÃ³ thá»ƒ xem giÃ¡ chi tiáº¿t cá»§a tá»«ng cuá»‘n sÃ¡ch trÃªn trang sáº£n pháº©m.',
        keywords: ['giÃ¡ thuÃª', 'phÃ­ thuÃª', 'tÃ­nh phÃ­', 'chi phÃ­'],
        category: 'rental',
        isActive: true,
    },
    {
        question: 'TÃ´i cÃ³ thá»ƒ thuÃª sÃ¡ch trong bao lÃ¢u?',
        answer: 'Báº¡n cÃ³ thá»ƒ tá»± chá»n thá»i gian thuÃª sÃ¡ch tá»« 1 ngÃ y trá»Ÿ lÃªn. Náº¿u muá»‘n gia háº¡n thÃªm, vui lÃ²ng liÃªn há»‡ vá»›i chÃºng tÃ´i trÆ°á»›c khi háº¿t háº¡n tráº£.',
        keywords: ['thá»i gian thuÃª', 'bao lÃ¢u', 'thá»i háº¡n', 'gia háº¡n'],
        category: 'rental',
        isActive: true,
    },
    {
        question: 'Tiá»n cá»c lÃ  gÃ¬ vÃ  tÃ´i pháº£i Ä‘áº·t cá»c bao nhiÃªu?',
        answer: 'Tiá»n cá»c lÃ  khoáº£n tiá»n Ä‘áº£m báº£o Ä‘á»ƒ Ä‘áº£m báº£o sÃ¡ch Ä‘Æ°á»£c tráº£ Ä‘Ãºng háº¡n vÃ  trong tÃ¬nh tráº¡ng tá»‘t. Sá»‘ tiá»n cá»c phá»¥ thuá»™c vÃ o giÃ¡ trá»‹ sÃ¡ch, thÆ°á»ng lÃ  50,000â‚« hoáº·c theo quy Ä‘á»‹nh cá»§a tá»«ng loáº¡i sÃ¡ch. Tiá»n cá»c sáº½ Ä‘Æ°á»£c hoÃ n láº¡i sau khi báº¡n tráº£ sÃ¡ch.',
        keywords: ['tiá»n cá»c', 'Ä‘áº·t cá»c', 'cá»c bao nhiÃªu', 'hoÃ n cá»c'],
        category: 'payment',
        isActive: true,
    },
    {
        question: 'CÃ¡c hÃ¬nh thá»©c thanh toÃ¡n nÃ o Ä‘Æ°á»£c cháº¥p nháº­n?',
        answer: 'ChÃºng tÃ´i há»— trá»£ nhiá»u hÃ¬nh thá»©c thanh toÃ¡n: Chuyá»ƒn khoáº£n ngÃ¢n hÃ ng, VÃ­ Ä‘iá»‡n tá»­ (Momo, ZaloPay), Tháº» tÃ­n dá»¥ng/ghi ná»£. Báº¡n cÃ³ thá»ƒ chá»n phÆ°Æ¡ng thá»©c thanh toÃ¡n phÃ¹ há»£p khi checkout.',
        keywords: ['thanh toÃ¡n', 'phÆ°Æ¡ng thá»©c thanh toÃ¡n', 'hÃ¬nh thá»©c thanh toÃ¡n', 'payment'],
        category: 'payment',
        isActive: true,
    },
    {
        question: 'LÃ m tháº¿ nÃ o Ä‘á»ƒ tráº£ sÃ¡ch?',
        answer: 'Báº¡n cÃ³ thá»ƒ tráº£ sÃ¡ch báº±ng cÃ¡ch: 1) Äáº¿n trá»±c tiáº¿p thÆ° viá»‡n theo Ä‘á»‹a chá»‰, 2) Sá»­ dá»¥ng dá»‹ch vá»¥ giao hÃ ng (phÃ­ váº­n chuyá»ƒn do báº¡n chi tráº£). Vui lÃ²ng tráº£ sÃ¡ch Ä‘Ãºng háº¡n Ä‘á»ƒ trÃ¡nh phÃ­ pháº¡t.',
        keywords: ['tráº£ sÃ¡ch', 'cÃ¡ch tráº£', 'hoÃ n tráº£', 'Ä‘á»‹a chá»‰ tráº£ sÃ¡ch'],
        category: 'return',
        isActive: true,
    },
    {
        question: 'Náº¿u tÃ´i tráº£ sÃ¡ch muá»™n thÃ¬ sao?',
        answer: 'Náº¿u tráº£ sÃ¡ch muá»™n, báº¡n sáº½ bá»‹ tÃ­nh phÃ­ pháº¡t theo sá»‘ ngÃ y trá»… háº¡n. PhÃ­ pháº¡t lÃ  5,000â‚«/ngÃ y/cuá»‘n sÃ¡ch. Vui lÃ²ng liÃªn há»‡ vá»›i chÃºng tÃ´i náº¿u cÃ³ lÃ½ do chÃ­nh Ä‘Ã¡ng Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£.',
        keywords: ['tráº£ muá»™n', 'pháº¡t trá»…', 'trá»… háº¡n', 'phÃ­ pháº¡t'],
        category: 'return',
        isActive: true,
    },
    {
        question: 'LÃ m tháº¿ nÃ o Ä‘á»ƒ tÃ¬m sÃ¡ch trÃªn website?',
        answer: 'Báº¡n cÃ³ thá»ƒ tÃ¬m sÃ¡ch báº±ng cÃ¡ch: 1) Sá»­ dá»¥ng thanh tÃ¬m kiáº¿m á»Ÿ Ä‘áº§u trang, 2) Lá»c theo danh má»¥c sÃ¡ch, 3) Sáº¯p xáº¿p theo giÃ¡ hoáº·c Ä‘á»™ phá»• biáº¿n. Ráº¥t dá»… dÃ ng!',
        keywords: ['tÃ¬m sÃ¡ch', 'tÃ¬m kiáº¿m', 'search', 'lá»c sÃ¡ch'],
        category: 'product',
        isActive: true,
    },
    {
        question: 'ThÆ° viá»‡n cÃ³ nhá»¯ng loáº¡i sÃ¡ch nÃ o?',
        answer: 'ThÆ° viá»‡n chÃºng tÃ´i cÃ³ Ä‘a dáº¡ng cÃ¡c thá»ƒ loáº¡i: VÄƒn há»c, Kinh táº¿, Khoa há»c, Lá»‹ch sá»­, Thiáº¿u nhi, GiÃ¡o dá»¥c, CÃ´ng nghá»‡, vÃ  nhiá»u thá»ƒ loáº¡i khÃ¡c. Báº¡n cÃ³ thá»ƒ xem danh má»¥c Ä‘áº§y Ä‘á»§ trÃªn website.',
        keywords: ['loáº¡i sÃ¡ch', 'thá»ƒ loáº¡i', 'danh má»¥c', 'catalog'],
        category: 'product',
        isActive: true,
    },
    {
        question: 'TÃ´i cÃ³ thá»ƒ há»§y Ä‘Æ¡n thuÃª sÃ¡ch khÃ´ng?',
        answer: 'Báº¡n cÃ³ thá»ƒ há»§y Ä‘Æ¡n thuÃª trÆ°á»›c khi thanh toÃ¡n. Sau khi thanh toÃ¡n, vui lÃ²ng liÃªn há»‡ vá»›i chÃºng tÃ´i trong vÃ²ng 24h Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£ há»§y Ä‘Æ¡n vÃ  hoÃ n tiá»n (náº¿u Ã¡p dá»¥ng).',
        keywords: ['há»§y Ä‘Æ¡n', 'cancel', 'hoÃ n tiá»n', 'refund'],
        category: 'general',
        isActive: true,
    },
    {
        question: 'LÃ m tháº¿ nÃ o Ä‘á»ƒ liÃªn há»‡ vá»›i thÆ° viá»‡n?',
        answer: 'Báº¡n cÃ³ thá»ƒ liÃªn há»‡ vá»›i chÃºng tÃ´i qua: Email: library@dav.edu.vn, Hotline: 0123-456-789, hoáº·c gá»­i tin nháº¯n qua chatbot nÃ y. ChÃºng tÃ´i luÃ´n sáºµn sÃ ng há»— trá»£ báº¡n!',
        keywords: ['liÃªn há»‡', 'contact', 'há»— trá»£', 'hotline'],
        category: 'general',
        isActive: true,
    },
    {
        question: 'Website cÃ³ giao sÃ¡ch táº­n nÆ¡i khÃ´ng?',
        answer: 'CÃ³, chÃºng tÃ´i cÃ³ dá»‹ch vá»¥ giao sÃ¡ch táº­n nÆ¡i miá»…n phÃ­ trong ná»™i thÃ nh. Äá»‘i vá»›i khu vá»±c xa, phÃ­ váº­n chuyá»ƒn sáº½ Ä‘Æ°á»£c tÃ­nh dá»±a trÃªn khoáº£ng cÃ¡ch.',
        keywords: ['giao hÃ ng', 'ship', 'váº­n chuyá»ƒn', 'delivery', 'giao táº­n nÆ¡i'],
        category: 'general',
        isActive: true,
    },
    {
        question: 'TÃ´i cÃ³ cáº§n Ä‘Äƒng kÃ½ tÃ i khoáº£n khÃ´ng?',
        answer: 'CÃ³, báº¡n cáº§n Ä‘Äƒng kÃ½ tÃ i khoáº£n Ä‘á»ƒ thuÃª sÃ¡ch. Viá»‡c Ä‘Äƒng kÃ½ ráº¥t nhanh chÃ³ng, chá»‰ cáº§n email, sá»‘ Ä‘iá»‡n thoáº¡i vÃ  máº­t kháº©u. TÃ i khoáº£n giÃºp báº¡n quáº£n lÃ½ Ä‘Æ¡n hÃ ng vÃ  lá»‹ch sá»­ thuÃª sÃ¡ch dá»… dÃ ng.',
        keywords: ['Ä‘Äƒng kÃ½', 'tÃ i khoáº£n', 'register', 'sign up'],
        category: 'general',
        isActive: true,
    },
    {
        question: 'Náº¿u sÃ¡ch bá»‹ hÆ° há»ng khi nháº­n thÃ¬ sao?',
        answer: 'Náº¿u sÃ¡ch bá»‹ hÆ° há»ng khi báº¡n nháº­n, vui lÃ²ng chá»¥p áº£nh vÃ  liÃªn há»‡ ngay vá»›i chÃºng tÃ´i trong vÃ²ng 24h. ChÃºng tÃ´i sáº½ Ä‘á»•i sÃ¡ch má»›i hoáº·c hoÃ n tiá»n cho báº¡n.',
        keywords: ['sÃ¡ch hÆ°', 'há»ng', 'lá»—i sÃ¡ch', 'Ä‘á»•i sÃ¡ch'],
        category: 'return',
        isActive: true,
    },
    {
        question: 'CÃ³ mÃ£ giáº£m giÃ¡ hay chÆ°Æ¡ng trÃ¬nh khuyáº¿n mÃ£i khÃ´ng?',
        answer: 'ChÃºng tÃ´i thÆ°á»ng xuyÃªn cÃ³ cÃ¡c chÆ°Æ¡ng trÃ¬nh khuyáº¿n mÃ£i vÃ  mÃ£ giáº£m giÃ¡ cho khÃ¡ch hÃ ng. HÃ£y theo dÃµi trang chá»§ hoáº·c Ä‘Äƒng kÃ½ nháº­n thÃ´ng bÃ¡o Ä‘á»ƒ khÃ´ng bá» lá»¡!',
        keywords: ['giáº£m giÃ¡', 'khuyáº¿n mÃ£i', 'coupon', 'voucher', 'mÃ£ giáº£m'],
        category: 'general',
        isActive: true,
    },
];

const seedFAQs = async () => {
    try {
        // XÃ³a dá»¯ liá»‡u cÅ©
        await FAQ.deleteMany({});
        console.log('ÄÃ£ xÃ³a dá»¯ liá»‡u FAQ cÅ©');

        // ThÃªm dá»¯ liá»‡u má»›i
        await FAQ.insertMany(sampleFAQs);
        console.log(`ÄÃ£ thÃªm ${sampleFAQs.length} cÃ¢u há»i FAQ máº«u`);

        console.log('Seed data thÃ nh cÃ´ng!');
        process.exit(0);
    } catch (error) {
        console.error('Lá»—i khi seed data:', error);
        process.exit(1);
    }
};

seedFAQs();

