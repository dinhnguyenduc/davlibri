/**
 * KIá»‚M TRA Cáº¤U HÃŒNH EMAIL NHANH
 * Xem há»‡ thá»‘ng Ä‘ang dÃ¹ng phÆ°Æ¡ng thá»©c gá»­i email nÃ o
 */

require('dotenv').config();

console.log('\nðŸ” KIá»‚M TRA Cáº¤U HÃŒNH EMAIL Há»† THá»NG\n');
console.log('='.repeat(70));

// Kiá»ƒm tra cáº¥u hÃ¬nh @dav.edu.vn
const davConfig = {
    host: process.env.DAV_SMTP_HOST,
    port: process.env.DAV_SMTP_PORT,
    user: process.env.DAV_SMTP_USER,
    pass: process.env.DAV_SMTP_PASS,
    from: process.env.DAV_EMAIL_FROM,
};

const isDavConfigured = davConfig.host && davConfig.user && davConfig.pass;

// Kiá»ƒm tra cáº¥u hÃ¬nh Gmail
const gmailConfig = {
    email: process.env.USER_EMAIL,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
};

const isGmailConfigured =
    gmailConfig.email && gmailConfig.clientId && gmailConfig.clientSecret && gmailConfig.refreshToken;

console.log('\nðŸ“§ Cáº¤U HÃŒNH EMAIL @DAV.EDU.VN:');
console.log('-'.repeat(70));
if (isDavConfigured) {
    console.log('âœ… ÄÃ£ cáº¥u hÃ¬nh hoÃ n chá»‰nh');
    console.log('   SMTP Host:', davConfig.host);
    console.log('   SMTP Port:', davConfig.port || '587 (máº·c Ä‘á»‹nh)');
    console.log('   SMTP User:', davConfig.user);
    console.log('   SMTP Pass:', davConfig.pass ? 'â—â—â—â—â—â—â—â—' : 'âŒ Thiáº¿u');
    console.log('   Email From:', davConfig.from || davConfig.user);
    console.log('\n   ðŸŽ¯ Há»‡ thá»‘ng sáº½ Æ°u tiÃªn gá»­i email qua @dav.edu.vn');
} else {
    console.log('âŒ ChÆ°a cáº¥u hÃ¬nh');
    console.log('   SMTP Host:', davConfig.host || 'âŒ Thiáº¿u');
    console.log('   SMTP User:', davConfig.user || 'âŒ Thiáº¿u');
    console.log('   SMTP Pass:', davConfig.pass ? 'âœ… ÄÃ£ cÃ³' : 'âŒ Thiáº¿u');
    console.log('\n   âš ï¸  Cáº§n thÃªm cáº¥u hÃ¬nh vÃ o file .env:');
    console.log('   DAV_SMTP_HOST="mail.dav.edu.vn"');
    console.log('   DAV_SMTP_PORT="587"');
    console.log('   DAV_SMTP_USER="library@dav.edu.vn"');
    console.log('   DAV_SMTP_PASS="máº­t_kháº©u_email"');
    console.log('   DAV_EMAIL_FROM="ThÆ° viá»‡n HVNG <library@dav.edu.vn>"');
}

console.log('\nðŸ“® Cáº¤U HÃŒNH GMAIL (FALLBACK):');
console.log('-'.repeat(70));
if (isGmailConfigured) {
    console.log('âœ… ÄÃ£ cáº¥u hÃ¬nh hoÃ n chá»‰nh');
    console.log('   User Email:', gmailConfig.email);
    console.log('   Client ID:', gmailConfig.clientId);
    console.log('   Client Secret:', gmailConfig.clientSecret.substring(0, 10) + '...');
    console.log('   Refresh Token:', gmailConfig.refreshToken.substring(0, 20) + '...');

    if (isDavConfigured) {
        console.log('\n   â„¹ï¸  Gmail sáº½ dÃ¹ng lÃ m backup náº¿u @dav.edu.vn lá»—i');
    } else {
        console.log('\n   âš ï¸  Há»‡ thá»‘ng Ä‘ang dÃ¹ng Gmail (khÃ´ng khuyáº¿n nghá»‹)');
        console.log('   ðŸ“ NÃªn chuyá»ƒn sang sá»­ dá»¥ng email @dav.edu.vn');
    }
} else {
    console.log('âŒ ChÆ°a cáº¥u hÃ¬nh');
    if (!isDavConfigured) {
        console.log('\n   âš ï¸  Há»† THá»NG KHÃ”NG THá»‚ Gá»¬I EMAIL!');
        console.log('   Cáº§n cáº¥u hÃ¬nh Ã­t nháº¥t 1 trong 2 phÆ°Æ¡ng thá»©c');
    }
}

console.log('\nðŸ“Š Káº¾T LUáº¬N:');
console.log('='.repeat(70));

if (isDavConfigured) {
    console.log('âœ… Há»‡ thá»‘ng Ä‘Ã£ sáºµn sÃ ng gá»­i email qua @dav.edu.vn');
    console.log('   ÄÃ¢y lÃ  phÆ°Æ¡ng thá»©c KHUYáº¾N NGHá»Š cho há»‡ thá»‘ng cá»§a trÆ°á»ng');
    console.log('\nðŸ§ª Cháº¡y test:');
    console.log('   node testEmailDAV.js');
} else if (isGmailConfigured) {
    console.log('âš ï¸  Há»‡ thá»‘ng Ä‘ang dÃ¹ng Gmail OAuth2');
    console.log('   PhÆ°Æ¡ng thá»©c nÃ y KHÃ”NG KHUYáº¾N NGHá»Š cho mÃ´i trÆ°á»ng production');
    console.log('   LÃ½ do:');
    console.log('   - Refresh token thÆ°á»ng xuyÃªn háº¿t háº¡n');
    console.log('   - Email tá»« @dav.edu.vn khÃ´ng chuyÃªn nghiá»‡p');
    console.log('   - Giá»›i háº¡n 500 email/ngÃ y');
    console.log('\nðŸ’¡ Khuyáº¿n nghá»‹:');
    console.log('   1. LiÃªn há»‡ IT cá»§a trÆ°á»ng láº¥y thÃ´ng tin SMTP');
    console.log('   2. Cáº¥u hÃ¬nh @dav.edu.vn theo hÆ°á»›ng dáº«n');
    console.log('   3. Xem: QUICK_START_EMAIL.md');
    console.log('\nðŸ§ª Cháº¡y test Gmail:');
    console.log('   node testEmailOTP.js');
} else {
    console.log('âŒ Há»† THá»NG KHÃ”NG THá»‚ Gá»¬I EMAIL!');
    console.log('   Cáº§n cáº¥u hÃ¬nh ngay:');
    console.log('\nðŸ“– HÆ°á»›ng dáº«n:');
    console.log('   1. Má»Ÿ file: QUICK_START_EMAIL.md');
    console.log('   2. LÃ m theo 3 bÆ°á»›c Ä‘Æ¡n giáº£n');
    console.log('   3. Test vá»›i: node testEmailDAV.js');
}

console.log('\nðŸ“š TÃ€I LIá»†U:');
console.log('-'.repeat(70));
console.log('   ðŸ“„ QUICK_START_EMAIL.md      - HÆ°á»›ng dáº«n nhanh (5 phÃºt)');
console.log('   ðŸ“„ HUONG_DAN_EMAIL_DAV.md    - HÆ°á»›ng dáº«n chi tiáº¿t Ä‘áº§y Ä‘á»§');
console.log('   ðŸ“„ SO_SANH_EMAIL_METHODS.md  - So sÃ¡nh 2 phÆ°Æ¡ng thá»©c');

console.log('\n' + '='.repeat(70) + '\n');

// Exit code
if (isDavConfigured || isGmailConfigured) {
    process.exit(0);
} else {
    process.exit(1);
}

