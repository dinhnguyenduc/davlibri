import { useEffect, useState } from 'react';
import { Table, Tag, Button, Tabs, Badge, Modal, Timeline, Descriptions, message } from 'antd';
import { EyeOutlined, FileDoneOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { requestCancelLoan, requestGetLoansByUserId } from '../../config/request';

import dayjs from 'dayjs';

const { TabPane } = Tabs;

const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const getStatusDisplay = (status) => {
    switch (status) {
        case 'completed':
        case 'returned':
            return { color: 'green', text: 'Hoàn thành' };
        case 'processing':
        case 'approved':
        case 'active':
            return { color: 'blue', text: 'Đang xử lý' };
        case 'pending':
        case 'requested':
            return { color: 'orange', text: 'Chờ xác nhận' };
        case 'overdue':
            return { color: 'volcano', text: 'Quá hạn' };
        case 'cancelled':
            return { color: 'red', text: 'Đã hủy' };
        default:
            return { color: 'default', text: 'Không xác định' };
    }
};

const OrderManagement = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loans, setLoans] = useState([]);

    const columns = [
        {
            title: 'Mã phiếu mượn',
            dataIndex: '_id',
            key: '_id',
        },
        {
            title: 'Ngày mượn',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount) => formatCurrency(amount),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const { color, text } = getStatusDisplay(status);
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <div className="flex gap-2">
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => showOrderDetails(record)}
                        className="flex items-center bg-blue-500 hover:bg-blue-600"
                    >
                        Xem chi tiết
                    </Button>

                    {(record.status === 'pending' || record.status === 'requested') && (
                        <Button
                            type="primary"
                            danger
                            icon={<FileDoneOutlined />}
                            size="small"
                            onClick={() => handleCancelLoan(record)}
                            className="flex items-center bg-red-500 hover:bg-red-600"
                        >
                            Hủy phiếu
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const showOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const fetchLoans = async () => {
        try {
            const response = await requestGetLoansByUserId();
            const items = Array.isArray(response?.metadata) ? response.metadata : [];
            setLoans(items);
        } catch (error) {
            setLoans([]);
            message.error(error.response?.data?.message || 'Không thể tải danh sách phiếu mượn');
        }
    };

    useEffect(() => {
        fetchLoans();
    }, []);

    const handleCancelLoan = async (loan) => {
        try {
            await requestCancelLoan({ id: loan._id });
            fetchLoans();
            message.success('Hủy phiếu mượn thành công');
        } catch (error) {
            message.error('Hủy phiếu mượn thất bại');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Quản lý phiếu mượn</h2>

            <Tabs defaultActiveKey="all">
                <TabPane
                    tab={
                        <span>
                            <Badge count={(loans || []).length} offset={[10, 0]}>
                                <span>Tất cả</span>
                            </Badge>
                        </span>
                    }
                    key="all"
                >
                    <Table
                        columns={columns}
                        dataSource={loans || []}
                        rowKey="_id"
                        pagination={false}
                        className="mt-4"
                    />
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            <ClockCircleOutlined /> Chờ xác nhận
                        </span>
                    }
                    key="pending"
                >
                    <Table
                        columns={columns}
                        dataSource={(loans || []).filter(
                            (loan) => loan?.status === 'pending' || loan?.status === 'requested',
                        )}
                        rowKey="_id"
                        pagination={false}
                        className="mt-4"
                    />
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            <FileDoneOutlined /> Đã hoàn thành
                        </span>
                    }
                    key="completed"
                >
                    <Table
                        columns={columns}
                        dataSource={(loans || []).filter(
                            (loan) => loan?.status === 'completed' || loan?.status === 'returned',
                        )}
                        rowKey="_id"
                        pagination={false}
                        className="mt-4"
                    />
                </TabPane>
            </Tabs>

            <Modal
                title={`Chi tiết phiếu mượn #${selectedOrder?._id}`}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={700}
            >
                {selectedOrder && (
                    <div>
                        <Descriptions bordered column={2} size="small" className="mb-6">
                            <Descriptions.Item label="Mã phiếu mượn" span={2}>
                                #{selectedOrder._id}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày mượn">
                                {dayjs(selectedOrder.createdAt).format('DD/MM/YYYY HH:mm')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                {(() => {
                                    const { color, text } = getStatusDisplay(selectedOrder.status);
                                    return <Tag color={color}>{text}</Tag>;
                                })()}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổng tiền" span={2}>
                                {formatCurrency(selectedOrder.totalAmount || selectedOrder.totalPrice)}
                            </Descriptions.Item>
                        </Descriptions>

                        <h3 className="text-lg font-medium mb-2">Sách mượn</h3>
                        <Table
                            dataSource={selectedOrder.books || selectedOrder.products || []}
                            pagination={false}
                            size="small"
                            columns={[
                                {
                                    title: 'Tên sách',
                                    dataIndex: 'book',
                                    key: 'book',
                                    render: (book) => <div>{book?.title || 'N/A'}</div>,
                                },
                                {
                                    title: 'Số lượng',
                                    dataIndex: 'quantity',
                                    key: 'quantity',
                                    width: 100,
                                },
                                {
                                    title: 'Phí thuê',
                                    dataIndex: 'rentalFee',
                                    key: 'rentalFee',
                                    width: 150,
                                    render: (price) => `${Number(price || 0).toLocaleString()} VNĐ`,
                                },
                            ]}
                            rowKey={(record, index) => record?.book?._id || record?.bookId || index}
                            className="mb-6"
                        />

                        <h3 className="text-lg font-medium mb-2">Thông tin mượn sách</h3>
                        <Timeline className="mt-4">
                            {(selectedOrder.books || selectedOrder.products || []).map((item, index) => (
                                <Timeline.Item
                                    key={index}
                                    color={
                                        index === (selectedOrder.books || selectedOrder.products || []).length - 1
                                            ? 'green'
                                            : 'blue'
                                    }
                                >
                                    <p className="mb-0">
                                        <strong>{item.book?.title || 'N/A'}</strong>
                                    </p>
                                    <p className="text-gray-500">
                                        {item.quantity} cuốn -{' '}
                                        {dayjs(item.borrowDate || item.startDate).format('DD/MM/YYYY')} -{' '}
                                        {dayjs(item.dueDate || item.endDate).format('DD/MM/YYYY')}
                                    </p>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default OrderManagement;
