export const mockDashboardData = {
    status: 'success',
    code: 200,
    metadata: {
        statistics: {
            totalUsers: 245,
            totalProducts: 86,
            totalRevenue: 5846000,
            totalWatching: 128,
        },

        recentOrders: [
            {
                id: '64f1a2c7d8f32a001c91d100',
                idPayment: '64f1a2c7d8f32a001c91d100',
                fullName: 'Nguyễn Thị Hương',
                totalPrice: 245000,
                status: 'pending',
                typePayment: 'COD',
            },
            {
                id: '64f1a2c7d8f32a001c91d101',
                idPayment: '64f1a2c7d8f32a001c91d101',
                fullName: 'Lê Hoàng Nam',
                totalPrice: 680000,
                status: 'completed',
                typePayment: 'Banking',
            },
            {
                id: '64f1a2c7d8f32a001c91d102',
                idPayment: '64f1a2c7d8f32a001c91d102',
                fullName: 'Phạm Minh Châu',
                totalPrice: 320000,
                status: 'delivered',
                typePayment: 'Momo',
            },
            {
                id: '64f1a2c7d8f32a001c91d103',
                idPayment: '64f1a2c7d8f32a001c91d103',
                fullName: 'Đỗ Văn Kiên',
                totalPrice: 540000,
                status: 'cancelled',
                typePayment: 'COD',
            },
            {
                id: '64f1a2c7d8f32a001c91d104',
                idPayment: '64f1a2c7d8f32a001c91d104',
                fullName: 'Trần Thị Lan',
                totalPrice: 420000,
                status: 'completed',
                typePayment: 'Banking',
            },
        ],

        topProducts: [
            {
                id: 'p001',
                name: 'Sách lập trình Python',
                quantity: 42,
                price: 180000,
                stock: 18,
            },
            {
                id: 'p002',
                name: 'Sách thiết kế UI/UX',
                quantity: 35,
                price: 220000,
                stock: 12,
            },
            {
                id: 'p003',
                name: 'Sách khoa học dữ liệu',
                quantity: 29,
                price: 260000,
                stock: 7,
            },
            {
                id: 'p004',
                name: 'Sách tiếng Anh giao tiếp',
                quantity: 26,
                price: 150000,
                stock: 15,
            },
        ],

        orderStats: [
            { date: '2026-08-08', count: 12 },
            { date: '2026-08-09', count: 16 },
            { date: '2026-08-10', count: 19 },
            { date: '2026-08-11', count: 14 },
            { date: '2026-08-12', count: 22 },
            { date: '2026-08-13', count: 18 },
            { date: '2026-08-14', count: 24 },
        ],

        categoryStats: [
            { name: 'Sách giáo trình', value: 32 },
            { name: 'Sách kỹ năng', value: 21 },
            { name: 'Sách ngoại ngữ', value: 18 },
            { name: 'Sách tham khảo', value: 15 },
            { name: 'Sách trẻ em', value: 14 },
        ],

        orderStatusStats: [
            { status: 'pending', value: 18, name: 'Đang chờ xử lý' },
            { status: 'completed', value: 52, name: 'Hoàn thành' },
            { status: 'delivered', value: 33, name: 'Đã giao' },
            { status: 'cancelled', value: 7, name: 'Đã hủy' },
        ],
    },
};
