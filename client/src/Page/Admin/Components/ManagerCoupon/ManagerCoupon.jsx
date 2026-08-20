import React, { useState, useEffect } from 'react';
import {
    Table,
    Tag,
    Space,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    DatePicker,
    Switch,
    message,
    Popconfirm,
    Tooltip,
    Row,
    Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CopyOutlined } from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './ManagerCoupon.module.scss';
import {
    requestCreateCoupon,
    requestGetAllCoupons,
    requestUpdateCoupon,
    requestDeleteCoupon,
    requestToggleCouponStatus,
    requestGetBooks,
    requestGetCategory,
} from '../../../../config/request';
import dayjs from 'dayjs';

const cx = classNames.bind(styles);
const { RangePicker } = DatePicker;
const { TextArea } = Input;

function ManagerCoupon() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchCoupons();
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const response = await requestGetAllCoupons();
            setCoupons(response.metadata);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            message.error('Lỗi khi tải danh sách mã giảm giá');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await requestGetBooks();
            setProducts(response.metadata);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await requestGetCategory();
            setCategories(response.metadata);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleCreate = () => {
        setEditingCoupon(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingCoupon(record);
        form.setFieldsValue({
            code: record.code,
            description: record.description,
            discountType: record.discountType,
            discountValue: record.discountValue,
            minOrderValue: record.minOrderValue,
            maxDiscount: record.maxDiscount,
            dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
            usageLimit: record.usageLimit,
            applyToAll: record.applyToAll,
            applicableProducts: record.applicableProducts?.map((p) => p._id),
            applicableCategories: record.applicableCategories?.map((c) => c._id),
        });
        setIsModalVisible(true);
    };

    const handleViewDetail = (record) => {
        setSelectedCoupon(record);
        setIsDetailModalVisible(true);
    };

    const handleSubmit = async (values) => {
        try {
            const couponData = {
                code: values.code,
                description: values.description,
                discountType: values.discountType,
                discountValue: values.discountValue,
                minOrderValue: values.minOrderValue || 0,
                maxDiscount: values.maxDiscount || null,
                startDate: values.dateRange[0].toDate(),
                endDate: values.dateRange[1].toDate(),
                usageLimit: values.usageLimit || null,
                applyToAll: values.applyToAll || false,
                applicableProducts: values.applicableProducts || [],
                applicableCategories: values.applicableCategories || [],
            };

            if (editingCoupon) {
                await requestUpdateCoupon({ id: editingCoupon._id, ...couponData });
                message.success('Cập nhật mã giảm giá thành công');
            } else {
                await requestCreateCoupon(couponData);
                message.success('Tạo mã giảm giá thành công');
            }

            setIsModalVisible(false);
            fetchCoupons();
            form.resetFields();
        } catch (error) {
            console.error('Error saving coupon:', error);
            message.error(error.response?.data?.message || 'Lỗi khi lưu mã giảm giá');
        }
    };

    const handleDelete = async (id) => {
        try {
            await requestDeleteCoupon(id);
            message.success('Xóa mã giảm giá thành công');
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
            message.error('Lỗi khi xóa mã giảm giá');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await requestToggleCouponStatus(id);
            message.success('Cập nhật trạng thái thành công');
            fetchCoupons();
        } catch (error) {
            console.error('Error toggling status:', error);
            message.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        message.success('Đã copy mã giảm giá');
    };

    const isExpired = (endDate) => {
        return new Date(endDate) < new Date();
    };

    const isNotStarted = (startDate) => {
        return new Date(startDate) > new Date();
    };

    const columns = [
        {
            title: 'Mã giảm giá',
            dataIndex: 'code',
            key: 'code',
            width: '12%',
            render: (code) => (
                <Space>
                    <Tag color="blue" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {code}
                    </Tag>
                    <Tooltip title="Copy mã">
                        <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopyCode(code)} />
                    </Tooltip>
                </Space>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            width: '20%',
            ellipsis: true,
        },
        {
            title: 'Loại giảm giá',
            dataIndex: 'discountType',
            key: 'discountType',
            width: '10%',
            render: (type, record) => {
                if (type === 'percentage') {
                    return <Tag color="green">{record.discountValue}%</Tag>;
                } else {
                    return <Tag color="orange">{record.discountValue.toLocaleString('vi-VN')}đ</Tag>;
                }
            },
        },
        {
            title: 'Giá trị đơn tối thiểu',
            dataIndex: 'minOrderValue',
            key: 'minOrderValue',
            width: '12%',
            render: (value) => <span>{value.toLocaleString('vi-VN')}đ</span>,
        },
        {
            title: 'Thời gian',
            key: 'time',
            width: '15%',
            render: (_, record) => (
                <div>
                    <div>{dayjs(record.startDate).format('DD/MM/YYYY')}</div>
                    <div>đến {dayjs(record.endDate).format('DD/MM/YYYY')}</div>
                </div>
            ),
        },
        {
            title: 'Sử dụng',
            key: 'usage',
            width: '10%',
            render: (_, record) => (
                <span>
                    {record.usedCount}/{record.usageLimit || '∞'}
                </span>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: '10%',
            render: (_, record) => {
                if (!record.isActive) {
                    return <Tag color="default">Đã tắt</Tag>;
                }
                if (isExpired(record.endDate)) {
                    return <Tag color="red">Hết hạn</Tag>;
                }
                if (isNotStarted(record.startDate)) {
                    return <Tag color="orange">Chưa bắt đầu</Tag>;
                }
                if (record.usageLimit && record.usedCount >= record.usageLimit) {
                    return <Tag color="red">Hết lượt</Tag>;
                }
                return <Tag color="green">Đang hoạt động</Tag>;
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: '15%',
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button type="primary" ghost icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    </Tooltip>
                    <Tooltip title={record.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
                        <Switch
                            checked={record.isActive}
                            onChange={() => handleToggleStatus(record._id)}
                            size="small"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa mã giảm giá"
                        description="Bạn có chắc muốn xóa mã giảm giá này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa">
                            <Button danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <h2 className={cx('title')}>Quản lý mã giảm giá</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
                    Tạo mã giảm giá
                </Button>
            </div>

            <div className={cx('content')}>
                <Table
                    columns={columns}
                    dataSource={coupons}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        position: ['bottomCenter'],
                        showTotal: (total) => `Tổng ${total} mã giảm giá`,
                    }}
                />
            </div>

            {/* Modal Create/Edit */}
            <Modal
                title={editingCoupon ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={800}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Mã giảm giá"
                                name="code"
                                rules={[{ required: true, message: 'Vui lòng nhập mã giảm giá' }]}
                            >
                                <Input
                                    placeholder="VD: SUMMER2024"
                                    disabled={!!editingCoupon}
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Loại giảm giá"
                                name="discountType"
                                rules={[{ required: true, message: 'Vui lòng chọn loại giảm giá' }]}
                            >
                                <Select placeholder="Chọn loại giảm giá">
                                    <Select.Option value="percentage">Phần trăm (%)</Select.Option>
                                    <Select.Option value="fixed">Số tiền cố định (đ)</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Mô tả"
                        name="description"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                    >
                        <TextArea rows={2} placeholder="Mô tả chi tiết về mã giảm giá" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="Giá trị giảm"
                                name="discountValue"
                                rules={[{ required: true, message: 'Vui lòng nhập giá trị giảm' }]}
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    placeholder="0"
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Giá trị đơn tối thiểu" name="minOrderValue">
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    placeholder="0"
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Giảm tối đa (nếu %)" name="maxDiscount">
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    placeholder="Không giới hạn"
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item
                                label="Thời gian hiệu lực"
                                name="dateRange"
                                rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
                            >
                                <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Giới hạn số lần sử dụng" name="usageLimit">
                                <InputNumber min={0} style={{ width: '100%' }} placeholder="Không giới hạn" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Áp dụng cho" name="applyToAll" valuePropName="checked">
                        <Switch checkedChildren="Tất cả sản phẩm" unCheckedChildren="Sản phẩm/Danh mục cụ thể" />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.applyToAll !== currentValues.applyToAll}
                    >
                        {({ getFieldValue }) =>
                            !getFieldValue('applyToAll') && (
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item label="Sản phẩm áp dụng" name="applicableProducts">
                                            <Select
                                                mode="multiple"
                                                placeholder="Chọn sản phẩm"
                                                showSearch
                                                filterOption={(input, option) =>
                                                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                                }
                                            >
                                                {products.map((product) => (
                                                    <Select.Option key={product._id} value={product._id}>
                                                        {product.nameProduct}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Danh mục áp dụng" name="applicableCategories">
                                            <Select mode="multiple" placeholder="Chọn danh mục">
                                                {categories.map((category) => (
                                                    <Select.Option key={category._id} value={category._id}>
                                                        {category.nameCategory}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )
                        }
                    </Form.Item>

                    <Form.Item>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => {
                                    setIsModalVisible(false);
                                    form.resetFields();
                                }}
                            >
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingCoupon ? 'Cập nhật' : 'Tạo mã'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Detail */}
            <Modal
                title="Chi tiết mã giảm giá"
                open={isDetailModalVisible}
                onCancel={() => setIsDetailModalVisible(false)}
                footer={null}
                width={600}
            >
                {selectedCoupon && (
                    <div className={cx('detail-content')}>
                        <div className={cx('detail-row')}>
                            <strong>Mã giảm giá:</strong>
                            <Tag color="blue" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                {selectedCoupon.code}
                            </Tag>
                        </div>
                        <div className={cx('detail-row')}>
                            <strong>Mô tả:</strong>
                            <span>{selectedCoupon.description}</span>
                        </div>
                        <div className={cx('detail-row')}>
                            <strong>Loại giảm giá:</strong>
                            <span>
                                {selectedCoupon.discountType === 'percentage'
                                    ? `${selectedCoupon.discountValue}%`
                                    : `${selectedCoupon.discountValue.toLocaleString('vi-VN')}đ`}
                            </span>
                        </div>
                        <div className={cx('detail-row')}>
                            <strong>Giá trị đơn tối thiểu:</strong>
                            <span>{selectedCoupon.minOrderValue.toLocaleString('vi-VN')}đ</span>
                        </div>
                        {selectedCoupon.maxDiscount && (
                            <div className={cx('detail-row')}>
                                <strong>Giảm tối đa:</strong>
                                <span>{selectedCoupon.maxDiscount.toLocaleString('vi-VN')}đ</span>
                            </div>
                        )}
                        <div className={cx('detail-row')}>
                            <strong>Thời gian:</strong>
                            <span>
                                {dayjs(selectedCoupon.startDate).format('DD/MM/YYYY')} -{' '}
                                {dayjs(selectedCoupon.endDate).format('DD/MM/YYYY')}
                            </span>
                        </div>
                        <div className={cx('detail-row')}>
                            <strong>Số lượt sử dụng:</strong>
                            <span>
                                {selectedCoupon.usedCount}/{selectedCoupon.usageLimit || 'Không giới hạn'}
                            </span>
                        </div>
                        <div className={cx('detail-row')}>
                            <strong>Áp dụng cho:</strong>
                            <span>{selectedCoupon.applyToAll ? 'Tất cả sản phẩm' : 'Sản phẩm/Danh mục cụ thể'}</span>
                        </div>
                        {!selectedCoupon.applyToAll && (
                            <>
                                {selectedCoupon.applicableProducts?.length > 0 && (
                                    <div className={cx('detail-row')}>
                                        <strong>Sản phẩm:</strong>
                                        <div className={cx('item-list')}>
                                            {selectedCoupon.applicableProducts.map((product) => (
                                                <Tag key={product._id}>{product.nameProduct}</Tag>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedCoupon.applicableCategories?.length > 0 && (
                                    <div className={cx('detail-row')}>
                                        <strong>Danh mục:</strong>
                                        <div className={cx('item-list')}>
                                            {selectedCoupon.applicableCategories.map((category) => (
                                                <Tag key={category._id}>{category.nameCategory}</Tag>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div className={cx('detail-row')}>
                            <strong>Trạng thái:</strong>
                            {selectedCoupon.isActive ? (
                                <Tag color="green">Đang hoạt động</Tag>
                            ) : (
                                <Tag color="default">Đã tắt</Tag>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default ManagerCoupon;
