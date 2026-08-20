import React, { useState, useEffect } from 'react';
import {
    Table,
    Tag,
    Space,
    Button,
    Modal,
    Descriptions,
    Select,
    Image,
    message,
    DatePicker,
    Row,
    Col,
    Form,
    Input,
    InputNumber,
    Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerOrder.module.scss';
import ExportButton from '../../../../Components/ExportButton/ExportButton';
import {
    requestGetLoansAdmin,
    requestUpdateLoanStatus,
    requestCreateLoanByAdmin,
    requestDeleteLoan,
    requestGetBooks,
} from '../../../../config/request';

import dayjs from 'dayjs';

const cx = classNames.bind(styles);
const { RangePicker } = DatePicker;

const getOrderItems = (order) => {
    if (Array.isArray(order?.books)) return order.books;
    if (Array.isArray(order?.products)) return order.products;
    return [];
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

function ManagerOrder() {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState(null);
    const [products, setProducts] = useState([]);
    const [form] = Form.useForm();
    const [orderProducts, setOrderProducts] = useState([{ bookId: '', quantity: 1, borrowDate: null, dueDate: null }]);

    // Fetch orders data when component mounts
    useEffect(() => {
        fetchOrders();
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await requestGetBooks();
            setProducts(Array.isArray(response?.metadata) ? response.metadata : []);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        }
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await requestGetLoansAdmin();
            setOrders(Array.isArray(response?.metadata) ? response.metadata : []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            message.error('Lỗi khi tải danh sách đơn hàng');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (record) => {
        setSelectedOrder(record);
        setIsModalVisible(true);
    };

    const handleStatusChange = async (newStatus, record) => {
        try {
            const data = {
                id: record._id,
                status: newStatus,
            };
            await requestUpdateLoanStatus(data);
            message.success('Cập nhật trạng thái thành công');
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const handleDeleteOrder = async (orderId) => {
        try {
            await requestDeleteLoan(orderId);
            message.success('Xóa đơn hàng thành công');
            fetchOrders();
        } catch (error) {
            console.error('Error deleting order:', error);
            message.error(error.response?.data?.message || 'Lỗi khi xóa đơn hàng');
        }
    };

    const handleCreateOrder = () => {
        setIsCreateModalVisible(true);
        form.resetFields();
        setOrderProducts([{ bookId: '', quantity: 1, borrowDate: null, dueDate: null }]);
    };

    const handleAddProduct = () => {
        setOrderProducts([...orderProducts, { bookId: '', quantity: 1, borrowDate: null, dueDate: null }]);
    };

    const handleRemoveProduct = (index) => {
        const newProducts = orderProducts.filter((_, i) => i !== index);
        setOrderProducts(newProducts);
    };

    const handleProductChange = (index, field, value) => {
        const newProducts = [...orderProducts];
        newProducts[index][field] = value;
        setOrderProducts(newProducts);
    };

    const handleSubmitOrder = async (values) => {
        try {
            // Validate products
            const hasEmptyProduct = orderProducts.some((p) => !p.bookId || !p.quantity || !p.borrowDate || !p.dueDate);
            if (hasEmptyProduct) {
                message.error('Vui lòng điền đầy đủ thông tin sản phẩm');
                return;
            }

            const orderData = {
                fullName: values.fullName,
                phone: values.phone,
                studentClass: values.studentClass || '',
                studentId: values.studentId || '',
                feePaymentMethod: values.paymentMethod || 'cod',
                books: orderProducts,
            };

            await requestCreateLoanByAdmin(orderData);
            message.success('Tạo đơn hàng thành công');
            setIsCreateModalVisible(false);
            fetchOrders();
            form.resetFields();
            setOrderProducts([{ bookId: '', quantity: 1, borrowDate: null, dueDate: null }]);
        } catch (error) {
            console.error('Error creating order:', error);
            message.error(error.response?.data?.message || 'Lỗi khi tạo đơn hàng');
        }
    };

    const getStatusColor = (status) => {
        const normalizedStatus = String(status || '').toLowerCase();
        const colors = {
            pending: 'gold',
            completed: 'blue',
            delivered: 'green',
            cancelled: 'red',
            requested: 'gold',
            approved: 'blue',
            active: 'cyan',
            returned: 'green',
            overdue: 'volcano',
        };
        return colors[normalizedStatus] || 'default';
    };

    const getStatusText = (status) => {
        const normalizedStatus = String(status || '').toLowerCase();
        const statusText = {
            pending: 'Chờ xử lý',
            completed: 'Đã xử lý',
            delivered: 'Đã giao hàng',
            cancelled: 'Đã hủy',
            requested: 'Chờ xác nhận',
            approved: 'Đã duyệt',
            active: 'Đang mượn',
            returned: 'Đã trả',
            overdue: 'Quá hạn',
        };
        return statusText[normalizedStatus] || 'Không xác định';
    };

    const handleFilterChange = (type, value) => {
        if (type === 'status') {
            setStatusFilter(value);
        } else if (type === 'date') {
            setDateRange(value);
        }
    };

    const getFilteredOrders = () => {
        let filteredOrders = Array.isArray(orders) ? [...orders] : [];

        // Filter by status
        if (statusFilter !== 'all') {
            filteredOrders = filteredOrders.filter((order) => order.status === statusFilter);
        }

        // Filter by date range
        if (dateRange && dateRange[0] && dateRange[1]) {
            const startDate = dateRange[0].startOf('day');
            const endDate = dateRange[1].endOf('day');
            filteredOrders = filteredOrders.filter((order) => {
                const orderDate = dayjs(order.createdAt);
                return orderDate.isAfter(startDate) && orderDate.isBefore(endDate);
            });
        }

        return filteredOrders;
    };

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: '_id',
            key: '_id',
            width: '15%',
        },
        {
            title: 'Khách hàng',
            dataIndex: 'fullName',
            key: 'fullName',
            width: '15%',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            width: '12%',
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: '12%',
            align: 'right',
            render: (price) => <span className={cx('price')}>{formatCurrency(price)}</span>,
        },
        {
            title: 'Trạng thái',
            key: 'status',
            dataIndex: 'status',
            width: '15%',
            render: (status, record) => (
                <Select
                    value={status}
                    style={{ width: 140 }}
                    onChange={(newStatus) => handleStatusChange(newStatus, record)}
                    className={cx('status-select')}
                >
                    <Select.Option value="requested">
                        <Tag color="gold">Chờ xác nhận</Tag>
                    </Select.Option>
                    <Select.Option value="approved">
                        <Tag color="blue">Đã duyệt</Tag>
                    </Select.Option>
                    <Select.Option value="active">
                        <Tag color="cyan">Đang mượn</Tag>
                    </Select.Option>
                    <Select.Option value="returned">
                        <Tag color="green">Đã trả</Tag>
                    </Select.Option>
                    <Select.Option value="overdue">
                        <Tag color="volcano">Quá hạn</Tag>
                    </Select.Option>
                    <Select.Option value="cancelled">
                        <Tag color="red">Đã hủy</Tag>
                    </Select.Option>
                </Select>
            ),
        },
        {
            title: 'Sản phẩm',
            key: 'products',
            width: '25%',
            render: (_, record) => (
                <Space direction="vertical" className={cx('products-list')}>
                    {getOrderItems(record).map((product, index) => (
                        <Space
                            key={index}
                            className={cx('product-info')}
                            align="start"
                            style={{ display: 'flex', width: '100%' }}
                        >
                            <Image
                                src={product.book?.images?.[0]}
                                alt={product.book?.title || 'Book'}
                                width={60}
                                height={60}
                                className={cx('product-image')}
                            />
                            <div className={cx('product-details')} style={{ textAlign: 'left', width: '100%' }}>
                                <div className={cx('product-name')} style={{ textAlign: 'left', fontWeight: 'bold' }}>
                                    {product.book?.title}
                                </div>
                                <div className={cx('product-variant')}>
                                    {product.book?.author} - {product.book?.publisher}
                                </div>
                                <div className={cx('product-quantity')}>Số lượng: {product.quantity}</div>
                            </div>
                        </Space>
                    ))}
                </Space>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: '10%',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button type="primary" onClick={() => handleViewDetails(record)} className={cx('action-button')}>
                        Chi tiết
                    </Button>
                    <Popconfirm
                        title="Xóa đơn hàng"
                        description="Bạn có chắc muốn xóa đơn hàng này?"
                        onConfirm={() => handleDeleteOrder(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            disabled={record.status !== 'requested' && record.status !== 'cancelled'}
                        >
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <h2 className={cx('title')}>Quản lý đơn hàng</h2>
                <Space>
                    <ExportButton data={getFilteredOrders()} type="order" buttonText="Export Excel" />
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateOrder} size="large">
                        Tạo đơn hàng
                    </Button>
                </Space>
            </div>

            <div className={cx('filters')}>
                <Row gutter={16}>
                    <Col span={8}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Lọc theo trạng thái"
                            value={statusFilter}
                            onChange={(value) => handleFilterChange('status', value)}
                        >
                            <Select.Option value="all">Tất cả trạng thái</Select.Option>
                            <Select.Option value="requested">Chờ xác nhận</Select.Option>
                            <Select.Option value="approved">Đã duyệt</Select.Option>
                            <Select.Option value="active">Đang mượn</Select.Option>
                            <Select.Option value="returned">Đã trả</Select.Option>
                            <Select.Option value="overdue">Quá hạn</Select.Option>
                            <Select.Option value="cancelled">Đã hủy</Select.Option>
                        </Select>
                    </Col>
                    <Col span={8}>
                        <RangePicker
                            style={{ width: '100%' }}
                            placeholder={['Từ ngày', 'Đến ngày']}
                            value={dateRange}
                            onChange={(value) => handleFilterChange('date', value)}
                            format="DD/MM/YYYY"
                        />
                    </Col>
                </Row>
            </div>

            <div className={cx('content')}>
                <Table
                    columns={columns}
                    dataSource={getFilteredOrders()}
                    rowKey="_id"
                    pagination={{
                        pageSize: 10,
                        position: ['bottomCenter'],
                    }}
                    loading={loading}
                    className={cx('order-table')}
                />
            </div>

            <Modal
                title={<div className={cx('modal-title')}>Chi tiết đơn hàng</div>}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={700}
                className={cx('order-modal')}
            >
                {selectedOrder && (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Mã đơn hàng">{selectedOrder._id}</Descriptions.Item>
                        <Descriptions.Item label="Sản phẩm">
                            <Space direction="vertical" className={cx('products-list')} style={{ width: '100%' }}>
                                {getOrderItems(selectedOrder).map((product, index) => (
                                    <Space
                                        key={index}
                                        direction="vertical"
                                        className={cx('product-detail-item')}
                                        style={{ width: '100%' }}
                                    >
                                        <Image
                                            src={product.book?.images?.[0]}
                                            alt={product.book?.title || 'Book'}
                                            width={100}
                                            height={100}
                                            style={{ objectFit: 'cover' }}
                                        />
                                        <div>
                                            <strong>{product.book?.title}</strong>
                                        </div>
                                        <div>Số lượng: {product.quantity}</div>
                                        <div>
                                            Giá thuê/ngày: {product.book?.dailyRentalFee?.toLocaleString('vi-VN')}đ
                                        </div>
                                        <div>Số ngày thuê: {product.days} ngày</div>
                                        <div>Tiền thuê: {Number(product.rentalFee || 0).toLocaleString('vi-VN')}đ</div>
                                        <div>Tiền cọc: {Number(product.depositFee || 0).toLocaleString('vi-VN')}đ</div>
                                        <div>
                                            <strong>
                                                Tổng: {Number(product.totalPrice || 0).toLocaleString('vi-VN')}đ
                                            </strong>
                                        </div>
                                    </Space>
                                ))}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày đặt hàng">
                            {dayjs(selectedOrder.createdAt).format('HH:mm DD/MM/YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Khách hàng">{selectedOrder.fullName}</Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">{selectedOrder.phone}</Descriptions.Item>
                        <Descriptions.Item label="Lớp/Khoa">{selectedOrder.studentClass || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Tổng tiền">
                            {formatCurrency(selectedOrder.totalAmount)}
                        </Descriptions.Item>
                        {Number(selectedOrder.discountAmount || 0) > 0 && (
                            <Descriptions.Item label="Giảm giá">
                                <span className="text-green-600 font-semibold">
                                    -{Number(selectedOrder.discountAmount || 0).toLocaleString('vi-VN')}đ
                                </span>
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={getStatusColor(selectedOrder.status)}>
                                {getStatusText(selectedOrder.status)}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Phương thức thanh toán">
                            {selectedOrder.feePaymentMethod || selectedOrder.paymentMethod || '-'}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            {/* Modal Tạo đơn hàng */}
            <Modal
                title="Tạo đơn hàng mới"
                open={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                footer={null}
                width={800}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmitOrder}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Tên khách hàng"
                                name="fullName"
                                rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
                            >
                                <Input placeholder="Nhập tên khách hàng" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Số điện thoại"
                                name="phone"
                                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                            >
                                <Input placeholder="Nhập số điện thoại" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Lớp/Khoa" name="studentClass">
                        <Input placeholder="Nhập lớp hoặc khoa (tùy chọn)" />
                    </Form.Item>

                    <Form.Item label="Mã sinh viên" name="studentId">
                        <Input placeholder="Nhập mã sinh viên (tùy chọn)" />
                    </Form.Item>

                    <Form.Item label="Phương thức thanh toán" name="paymentMethod" initialValue="cod">
                        <Select>
                            <Select.Option value="cod">COD</Select.Option>
                            <Select.Option value="momo">Momo</Select.Option>
                            <Select.Option value="vnpay">VNPay</Select.Option>
                        </Select>
                    </Form.Item>

                    <div style={{ marginBottom: 16 }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8,
                            }}
                        >
                            <strong>Sản phẩm:</strong>
                            <Button type="dashed" onClick={handleAddProduct} icon={<PlusOutlined />}>
                                Thêm sản phẩm
                            </Button>
                        </div>

                        {orderProducts.map((product, index) => (
                            <div
                                key={index}
                                style={{
                                    border: '1px solid #d9d9d9',
                                    padding: '16px',
                                    marginBottom: '12px',
                                    borderRadius: '8px',
                                    position: 'relative',
                                }}
                            >
                                {orderProducts.length > 1 && (
                                    <Button
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemoveProduct(index)}
                                        style={{ position: 'absolute', top: 8, right: 8 }}
                                    />
                                )}

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <div style={{ marginBottom: 8 }}>
                                            <label>Sản phẩm *</label>
                                            <Select
                                                style={{ width: '100%', marginTop: 4 }}
                                                placeholder="Chọn sản phẩm"
                                                value={product.bookId || undefined}
                                                onChange={(value) => handleProductChange(index, 'bookId', value)}
                                                showSearch
                                                filterOption={(input, option) =>
                                                    String(option?.children ?? '')
                                                        .toLowerCase()
                                                        .includes(input.toLowerCase())
                                                }
                                            >
                                                {products.map((p) => (
                                                    <Select.Option key={p._id} value={p._id}>
                                                        {p.title || p.nameProduct}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div style={{ marginBottom: 8 }}>
                                            <label>Số lượng *</label>
                                            <InputNumber
                                                min={1}
                                                style={{ width: '100%', marginTop: 4 }}
                                                value={product.quantity}
                                                onChange={(value) => handleProductChange(index, 'quantity', value)}
                                            />
                                        </div>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <div>
                                            <label>Ngày thuê *</label>
                                            <DatePicker
                                                style={{ width: '100%', marginTop: 4 }}
                                                format="DD/MM/YYYY"
                                                placeholder="Chọn ngày thuê"
                                                value={product.borrowDate ? dayjs(product.borrowDate) : null}
                                                onChange={(date) =>
                                                    handleProductChange(
                                                        index,
                                                        'borrowDate',
                                                        date ? date.toDate() : null,
                                                    )
                                                }
                                            />
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div>
                                            <label>Ngày trả *</label>
                                            <DatePicker
                                                style={{ width: '100%', marginTop: 4 }}
                                                format="DD/MM/YYYY"
                                                placeholder="Chọn ngày trả"
                                                value={product.dueDate ? dayjs(product.dueDate) : null}
                                                onChange={(date) =>
                                                    handleProductChange(index, 'dueDate', date ? date.toDate() : null)
                                                }
                                            />
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        ))}
                    </div>

                    <Form.Item>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => setIsCreateModalVisible(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit">
                                Tạo đơn hàng
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ManagerOrder;
