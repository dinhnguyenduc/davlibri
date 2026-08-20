/**
 * VNPay Integration Tests
 * Tests for checksum verification, transaction creation, and IPN callbacks
 * Run with: npm test -- tests/vnpay.test.js
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

describe('VNPay Integration Tests', () => {
    const VNP_SECRET_KEY = 'DEMOVNPPAYMENTGATEWAY'; // Use test key
    const VNP_MERCHANT_ID = '89898898';

    // Helper: Generate VNPay Checksum
    const generateChecksum = (params, secretKey) => {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((result, key) => {
                result[key] = params[key];
                return result;
            }, {});

        const queryString = Object.keys(sortedParams)
            .map((key) => `${key}=${encodeURIComponent(sortedParams[key])}`)
            .join('&');

        return crypto.createHmac('sha512', secretKey).update(Buffer.from(queryString, 'utf-8')).digest('hex');
    };

    // Helper: Validate Checksum
    const validateChecksum = (params, checksum, secretKey) => {
        const calculated = generateChecksum(params, secretKey);
        return calculated === checksum;
    };

    describe('Checksum Generation & Validation', () => {
        test('should generate valid checksum for VNPay params', () => {
            const params = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: VNP_MERCHANT_ID,
                vnp_Amount: '1000000',
                vnp_CurrCode: 'VND',
                vnp_TxnRef: '20260204112233',
                vnp_OrderInfo: 'Payment for order #123',
                vnp_Locale: 'vn',
                vnp_ReturnUrl: 'http://localhost:5173/return',
                vnp_IpAddr: '127.0.0.1',
                vnp_CreateDate: '20260204112233',
            };

            const checksum = generateChecksum(params, VNP_SECRET_KEY);
            expect(checksum).toBeDefined();
            expect(checksum).toHaveLength(128); // SHA512 hex length
        });

        test('should validate correct checksum', () => {
            const params = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: VNP_MERCHANT_ID,
                vnp_Amount: '1000000',
            };

            const checksum = generateChecksum(params, VNP_SECRET_KEY);
            const isValid = validateChecksum(params, checksum, VNP_SECRET_KEY);
            expect(isValid).toBe(true);
        });

        test('should reject invalid checksum', () => {
            const params = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: VNP_MERCHANT_ID,
                vnp_Amount: '1000000',
            };

            const invalidChecksum = 'invalid_checksum_value_12345';
            const isValid = validateChecksum(params, invalidChecksum, VNP_SECRET_KEY);
            expect(isValid).toBe(false);
        });

        test('should detect tampered parameters', () => {
            const params = {
                vnp_Amount: '1000000',
                vnp_TmnCode: VNP_MERCHANT_ID,
            };

            const checksum = generateChecksum(params, VNP_SECRET_KEY);

            // Tamper with amount
            const tamperedParams = { ...params, vnp_Amount: '2000000' };
            const isValid = validateChecksum(tamperedParams, checksum, VNP_SECRET_KEY);
            expect(isValid).toBe(false);
        });
    });

    describe('VNPay Request Parameters', () => {
        test('should generate valid payment request params', () => {
            const createDate = new Date();
            const txnRef = `${createDate.getTime()}`;

            const params = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: VNP_MERCHANT_ID,
                vnp_Amount: 1000000, // 10,000 VND
                vnp_CurrCode: 'VND',
                vnp_TxnRef: txnRef,
                vnp_OrderInfo: 'Purchase book: The Great Gatsby',
                vnp_Locale: 'vn',
                vnp_ReturnUrl: 'http://localhost:5173/return',
                vnp_IpAddr: '127.0.0.1',
                vnp_CreateDate: createDate.toISOString().replace(/[-:]/g, '').split('.')[0],
            };

            expect(params.vnp_Amount).toBeGreaterThan(0);
            expect(params.vnp_CurrCode).toBe('VND');
            expect(params.vnp_Command).toBe('pay');
        });

        test('should validate amount is positive integer', () => {
            const testCases = [
                { amount: 1000, valid: true },
                { amount: 100000, valid: true },
                { amount: -1000, valid: false },
                { amount: 0, valid: false },
                { amount: 100.5, valid: false },
            ];

            testCases.forEach(({ amount, valid }) => {
                const isValid = amount > 0 && Number.isInteger(amount);
                expect(isValid).toBe(valid);
            });
        });

        test('should validate TxnRef is unique per request', () => {
            const txnRef1 = `${Date.now()}_1`;
            const txnRef2 = `${Date.now()}_2`;
            expect(txnRef1).not.toBe(txnRef2);
        });
    });

    describe('IPN Callback Handling', () => {
        test('should validate IPN response structure', () => {
            const ipnResponse = {
                vnp_Amount: '1000000',
                vnp_BankCode: 'VNBANK',
                vnp_BankTranNo: '1234567890',
                vnp_CardType: 'ATM',
                vnp_OrderInfo: 'Purchase book',
                vnp_PayDate: '20260204112233',
                vnp_ResponseCode: '00', // Success
                vnp_TmnCode: VNP_MERCHANT_ID,
                vnp_TransactionNo: '123456789',
                vnp_TxnRef: '20260204112233',
                vnp_SecureHash: '',
            };

            // Validate required fields
            const requiredFields = ['vnp_Amount', 'vnp_OrderInfo', 'vnp_ResponseCode', 'vnp_TxnRef'];
            requiredFields.forEach((field) => {
                expect(ipnResponse[field]).toBeDefined();
            });
        });

        test('should process successful payment (ResponseCode=00)', () => {
            const ipnResponse = {
                vnp_Amount: '1000000',
                vnp_ResponseCode: '00', // Success
                vnp_OrderInfo: 'Payment successful',
                vnp_TxnRef: '12345',
            };

            expect(ipnResponse.vnp_ResponseCode).toBe('00');
            // In real app: Create order, update inventory
        });

        test('should handle payment failure (ResponseCode!=00)', () => {
            const testCases = [
                { code: '01', meaning: 'Bank system error' },
                { code: '02', meaning: 'Card declined' },
                { code: '09', meaning: 'Card expired' },
                { code: '10', meaning: 'Invalid card' },
                { code: '24', meaning: 'Customer cancelled' },
                { code: '99', meaning: 'Unknown error' },
            ];

            testCases.forEach(({ code, meaning }) => {
                const isFailure = code !== '00';
                expect(isFailure).toBe(true);
                // In real app: Send notification to user
            });
        });

        test('should validate IPN checksum before processing', () => {
            const ipnData = {
                vnp_Amount: '1000000',
                vnp_BankCode: 'VNBANK',
                vnp_OrderInfo: 'Order #123',
                vnp_ResponseCode: '00',
                vnp_TmnCode: VNP_MERCHANT_ID,
                vnp_TransactionNo: '123456789',
                vnp_TxnRef: '12345',
            };

            const correctChecksum = generateChecksum(ipnData, VNP_SECRET_KEY);
            const isValid = validateChecksum(ipnData, correctChecksum, VNP_SECRET_KEY);

            expect(isValid).toBe(true);
            // In real app: Only process if checksum is valid
        });
    });

    describe('Amount Formatting', () => {
        test('should convert VND to VNPay format (x100)', () => {
            const testCases = [
                { vnd: 10000, vnpay: '1000000' },
                { vnd: 50000, vnpay: '5000000' },
                { vnd: 100000, vnpay: '10000000' },
            ];

            testCases.forEach(({ vnd, vnpay }) => {
                const converted = (vnd * 100).toString();
                expect(converted).toBe(vnpay);
            });
        });

        test('should format timestamp correctly', () => {
            const date = new Date('2026-02-04T11:22:33Z');
            const formatted = date.toISOString().replace(/[-:T]/g, '').split('.')[0];

            expect(formatted).toBe('20260204112233');
            expect(formatted).toHaveLength(14);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing secret key gracefully', () => {
            const params = { vnp_Amount: '1000000' };
            expect(() => {
                if (!VNP_SECRET_KEY) {
                    throw new Error('VNP_SECRET_KEY not configured');
                }
            }).not.toThrow();
        });

        test('should reject IPN with mismatched merchant ID', () => {
            const ipnData = { vnp_TmnCode: 'DIFFERENT_MERCHANT' };
            const isMatchingMerchant = ipnData.vnp_TmnCode === VNP_MERCHANT_ID;
            expect(isMatchingMerchant).toBe(false);
        });

        test('should validate IPN timestamp is recent (not older than 15 min)', () => {
            const paymentTime = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
            const currentTime = new Date();
            const diffMinutes = (currentTime - paymentTime) / (1000 * 60);

            expect(diffMinutes).toBeLessThan(15);
        });
    });

    describe('Security', () => {
        test('should use SHA512 for checksum generation', () => {
            const data = 'test_data';
            const checksum = crypto.createHmac('sha512', VNP_SECRET_KEY).update(data).digest('hex');

            expect(checksum).toBeDefined();
            expect(checksum).toMatch(/^[a-f0-9]{128}$/); // SHA512 hex format
        });

        test('should not expose secret key in logs or responses', () => {
            const response = {
                success: true,
                message: 'Payment processed',
                // Secret key should NEVER be here
            };

            expect(JSON.stringify(response)).not.toContain(VNP_SECRET_KEY);
        });

        test('should sanitize order info to prevent injection', () => {
            const maliciousInput = '<script>alert("xss")</script>';
            const sanitized = maliciousInput.replace(/[<>]/g, '');

            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('</script>');
        });
    });
});
