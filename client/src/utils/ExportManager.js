import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { message } from 'antd';

/**
 * Export Manager - Universal export utility for all admin tables
 * Supports: CSV, XLSX, XLS formats
 */

class ExportManager {
    /**
     * Export data to file
     * @param {Array} data - Data to export
     * @param {Object} options - Export options
     * @param {string} options.filename - Base filename without extension
     * @param {string} options.format - File format: 'csv', 'xlsx', 'xls'
     * @param {string} options.sheetName - Excel sheet name
     * @param {Object} options.columnMapping - Map data keys to display names
     */
    static export(data, options = {}) {
        const { filename = 'export', format = 'csv', sheetName = 'Sheet1', columnMapping = null } = options;

        if (!data || data.length === 0) {
            message.warning('Không có dữ liệu để export');
            return;
        }

        try {
            // Transform data if column mapping provided
            const exportData = columnMapping ? this.transformData(data, columnMapping) : data;

            // Generate timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const fullFilename = `${filename}_${timestamp}`;

            // Export based on format
            switch (format.toLowerCase()) {
                case 'csv':
                    this.exportCSV(exportData, fullFilename);
                    break;
                case 'xlsx':
                    this.exportExcel(exportData, fullFilename, sheetName, 'xlsx');
                    break;
                case 'xls':
                    this.exportExcel(exportData, fullFilename, sheetName, 'xls');
                    break;
                default:
                    message.error('Format không hỗ trợ');
                    return;
            }

            message.success(`Đã export ${data.length} bản ghi ra file ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Export error:', error);
            message.error('Lỗi khi export: ' + error.message);
        }
    }

    /**
     * Transform data using column mapping
     */
    static transformData(data, columnMapping) {
        return data.map((item, index) => {
            const transformed = {};
            Object.entries(columnMapping).forEach(([key, config]) => {
                if (typeof config === 'string') {
                    // Simple mapping: key -> display name
                    transformed[config] = item[key] ?? '';
                } else if (typeof config === 'object') {
                    // Advanced mapping with transform function
                    const { label, transform } = config;
                    transformed[label] = transform ? transform(item, index) : item[key] ?? '';
                }
            });
            return transformed;
        });
    }

    /**
     * Export to CSV format
     */
    static exportCSV(data, filename) {
        // Create CSV content
        const headers = Object.keys(data[0]);
        const csvContent =
            headers.join(',') +
            '\n' +
            data
                .map((row) =>
                    headers
                        .map((header) => {
                            const value = row[header]?.toString() || '';
                            // Escape quotes and wrap in quotes
                            return `"${value.replace(/"/g, '""')}"`;
                        })
                        .join(','),
                )
                .join('\n');

        // Download file
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${filename}.csv`);
    }

    /**
     * Export to Excel format (XLSX or XLS)
     */
    static exportExcel(data, filename, sheetName, format) {
        // Create workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Auto-size columns
        const maxWidth = 50;
        const colWidths = Object.keys(data[0]).map((key) => {
            const maxLength = Math.max(key.length, ...data.map((row) => (row[key]?.toString() || '').length));
            return { wch: Math.min(maxLength + 2, maxWidth) };
        });
        worksheet['!cols'] = colWidths;

        // Write file
        const extension = format === 'xls' ? 'xls' : 'xlsx';
        const bookType = format === 'xls' ? 'biff8' : 'xlsx';

        XLSX.writeFile(workbook, `${filename}.${extension}`, { bookType });
    }

    /**
     * Export FAQ data (specific format)
     */
    static exportFAQ(faqs, format = 'csv') {
        const columnMapping = {
            _id: { label: 'ID', transform: (item) => item._id || '' },
            question: 'Câu hỏi',
            answer: 'Câu trả lời',
            category: {
                label: 'Danh mục',
                transform: (item) => {
                    const categoryMap = {
                        general: 'Thông tin chung',
                        product: 'Sản phẩm',
                        payment: 'Thanh toán',
                        rental: 'Thuê sách',
                        return: 'Trả sách',
                        other: 'Khác',
                    };
                    return categoryMap[item.category] || item.category;
                },
            },
            keywords: { label: 'Từ khóa', transform: (item) => item.keywords?.join(', ') || '' },
            viewCount: 'Lượt xem',
            isActive: { label: 'Trạng thái', transform: (item) => (item.isActive ? 'Hoạt động' : 'Tạm ẩn') },
            createdAt: {
                label: 'Ngày tạo',
                transform: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''),
            },
        };

        this.export(faqs, {
            filename: 'faq_export',
            format,
            sheetName: 'FAQs',
            columnMapping,
        });
    }

    /**
     * Export Category data
     */
    static exportCategories(categories, format = 'csv') {
        const columnMapping = {
            _id: 'ID',
            nameCategory: 'Tên danh mục',
            description: 'Mô tả',
            slug: 'Slug',
            productCount: { label: 'Số sản phẩm', transform: (item) => item.productCount || 0 },
            isActive: { label: 'Trạng thái', transform: (item) => (item.isActive ? 'Hoạt động' : 'Tạm ẩn') },
            createdAt: {
                label: 'Ngày tạo',
                transform: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''),
            },
        };

        this.export(categories, {
            filename: 'categories_export',
            format,
            sheetName: 'Danh mục',
            columnMapping,
        });
    }

    /**
     * Export User data
     */
    static exportUsers(users, format = 'csv') {
        const columnMapping = {
            _id: 'ID',
            name: 'Họ và tên',
            email: 'Email',
            phone: 'Số điện thoại',
            role: {
                label: 'Vai trò',
                transform: (item) => {
                    if (item.role === 'admin') return 'Quản trị viên';
                    if (item.role === 'librarian') return 'Thủ thư';
                    return 'Người dùng';
                },
            },
            permissions: {
                label: 'Quyền hạn',
                transform: (item) => {
                    if (item.role !== 'librarian' || !item.permissions || item.permissions.length === 0) {
                        return '';
                    }
                    const permMap = {
                        manage_categories: 'Danh mục',
                        manage_products: 'Sản phẩm',
                        manage_coupons: 'Mã giảm giá',
                        manage_deposits: 'Đặt cọc',
                        manage_orders: 'Đơn hàng',
                    };
                    return item.permissions.map((p) => permMap[p] || p).join(', ');
                },
            },
            isActive: { label: 'Trạng thái', transform: (item) => (item.isActive ? 'Hoạt động' : 'Đã khóa') },
            createdAt: {
                label: 'Ngày đăng ký',
                transform: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''),
            },
        };

        this.export(users, {
            filename: 'users_export',
            format,
            sheetName: 'Người dùng',
            columnMapping,
        });
    }

    /**
     * Export Product data
     */
    static exportProducts(products, format = 'csv') {
        const columnMapping = {
            _id: 'ID',
            nameProduct: 'Tên sản phẩm',
            author: 'Tác giả',
            price: { label: 'Giá thuê (đ/ngày)', transform: (item) => item.price?.toLocaleString('vi-VN') || 0 },
            quantity: 'Số lượng',
            stock: 'Còn lại',
            category: { label: 'Danh mục', transform: (item) => item.category?.nameCategory || '' },
            publisher: 'Nhà xuất bản',
            publishYear: 'Năm xuất bản',
            language: 'Ngôn ngữ',
            pageCount: 'Số trang',
            viewCount: 'Lượt xem',
            rentCount: 'Lượt thuê',
            createdAt: {
                label: 'Ngày thêm',
                transform: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''),
            },
        };

        this.export(products, {
            filename: 'products_export',
            format,
            sheetName: 'Sản phẩm',
            columnMapping,
        });
    }

    /**
     * Export Order data
     */
    static exportOrders(orders, format = 'csv') {
        const columnMapping = {
            _id: 'Mã đơn hàng',
            user: { label: 'Khách hàng', transform: (item) => item.user?.name || '' },
            items: {
                label: 'Số sản phẩm',
                transform: (item) => item.products?.length || item.items?.length || 0,
            },
            totalAmount: {
                label: 'Tổng tiền (đ)',
                transform: (item) => item.totalAmount?.toLocaleString('vi-VN') || 0,
            },
            paymentMethod: {
                label: 'Thanh toán',
                transform: (item) => {
                    const methods = { cod: 'COD', online: 'Online', bank: 'Chuyển khoản' };
                    return methods[item.paymentMethod] || item.paymentMethod;
                },
            },
            status: {
                label: 'Trạng thái',
                transform: (item) => {
                    const statuses = {
                        pending: 'Chờ xử lý',
                        confirmed: 'Đã xác nhận',
                        shipping: 'Đang giao',
                        delivered: 'Đã giao',
                        cancelled: 'Đã hủy',
                    };
                    return statuses[item.status] || item.status;
                },
            },
            createdAt: {
                label: 'Ngày đặt',
                transform: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''),
            },
        };

        this.export(orders, {
            filename: 'orders_export',
            format,
            sheetName: 'Đơn hàng',
            columnMapping,
        });
    }
}

export default ExportManager;
