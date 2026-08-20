import React, { useState } from 'react';
import {
    Checkbox,
    Button,
    InputNumber,
    Card,
    Row,
    Col,
    Divider,
    Tag,
    Empty,
    Badge,
    Tooltip,
    message,
    DatePicker,
    Modal,
} from 'antd';
import Chatbot from '../Components/Chatbot/Chatbot';
import {
    DeleteOutlined,
    HeartOutlined,
    GiftOutlined,
    TruckOutlined,
    ShoppingCartOutlined,
    EditOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import Header from '../Components/Header/Header';
import { Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

import dayjs from 'dayjs';
import { requestDeleteItem, requestUpdateQuantity, requestUpdateRentalDates } from '../config/request';

function CartUser() {
    const { dataCart, fetchCart } = useStore();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newStartDate, setNewStartDate] = useState(null);
    const [newEndDate, setNewEndDate] = useState(null);

    // Xử lý chọn tất cả

    // Cập nhật số lượng
    const updateQuantity = async (id, quantity) => {
        try {
            const data = {
                bookId: id,
                quantity: quantity,
            };
            await requestUpdateQuantity(data);
            fetchCart();
        } catch {
            message.error('Cập nhật số lượng thất bại');
        }
    };

    // Xóa sách khỏi giỏ
    const removeItem = async (id) => {
        try {
            const data = {
                bookId: id,
            };
            await requestDeleteItem(data);
            message.success('Xóa sách thành công');
            fetchCart();
        } catch {
            message.error('Xóa sách thất bại');
        }
    };

    // Mở modal chỉnh sửa ngày thuê trả
    const openEditModal = (item) => {
        setSelectedProduct(item);
        setNewStartDate(dayjs(item.borrowDate));
        setNewEndDate(dayjs(item.dueDate));
        setIsEditModalVisible(true);
    };

    // Xử lý cập nhật ngày thuê trả
    const handleUpdateRentalDates = async () => {
        if (!newStartDate || !newEndDate) {
            message.error('Vui lòng chọn ngày thuê và ngày trả');
            return;
        }

        if (newEndDate.isBefore(newStartDate)) {
            message.error('Ngày trả phải sau ngày thuê');
            return;
        }

        try {
            const data = {
                bookId: selectedProduct.bookId,
                borrowDate: newStartDate.toISOString(),
                dueDate: newEndDate.toISOString(),
            };
            await requestUpdateRentalDates(data);
            message.success('Cập nhật ngày mượn/trả thành công');
            setIsEditModalVisible(false);
            fetchCart();
        } catch {
            message.error('Cập nhật ngày thuê trả thất bại');
        }
    };

    // Hủy chỉnh sửa
    const handleCancelEdit = () => {
        setIsEditModalVisible(false);
        setSelectedProduct(null);
        setNewStartDate(null);
        setNewEndDate(null);
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
            <Header />

            <main className="w-[90%] mx-auto py-6 px-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <ShoppingCartOutlined className="text-2xl text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Danh sách mượn sách</h1>
                    <Badge count={dataCart?.length || 0} className="ml-2" />
                </div>

                <Row gutter={24}>
                    {/* Danh sách sản phẩm */}
                    <Col xs={24} lg={16}>
                        <Card className="shadow-md rounded-xl border-0" bodyStyle={{ padding: '24px' }}>
                            {/* Danh sách sách */}
                            {dataCart?.length === 0 ? (
                                <Empty description="Chưa có sách nào để mượn" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            ) : (
                                <div className="space-y-6">
                                    {dataCart?.map((item) => (
                                        <div
                                            key={item._id}
                                            className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-all duration-200 bg-white"
                                        >
                                            <Row align="middle" gutter={16}>
                                                {/* Checkbox */}

                                                {/* Ảnh sách */}
                                                <Col flex="80px">
                                                    <div className="relative">
                                                        <img
                                                            src={item.book.images[0]}
                                                            alt={item.book.title}
                                                            className="w-20 h-26 object-cover rounded-lg shadow-sm"
                                                            onError={(e) => {
                                                                e.target.src =
                                                                    'https://via.placeholder.com/80x104/f0f0f0/666666?text=No+Image';
                                                            }}
                                                        />
                                                    </div>
                                                </Col>

                                                {/* Thông tin sách */}
                                                <Col flex="1">
                                                    <div className="space-y-2">
                                                        <Tooltip title={item.book.title} placement="topLeft">
                                                            <h3
                                                                className="font-semibold text-gray-800 leading-tight cursor-pointer hover:text-blue-600 transition-colors overflow-hidden"
                                                                style={{
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                }}
                                                            >
                                                                {item.book.title}
                                                            </h3>
                                                        </Tooltip>
                                                        <div className="text-sm text-gray-500 flex flex-col gap-2">
                                                            <span>Tác giả: {item.book.author}</span>
                                                            <span>Nhà xuất bản: {item.book.publisher}</span>
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span>
                                                                        Ngày mượn:{' '}
                                                                        {dayjs(item.borrowDate).format('DD/MM/YYYY')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span>
                                                                        Hạn trả:{' '}
                                                                        {dayjs(item.dueDate).format('DD/MM/YYYY')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-blue-600 font-semibold">
                                                                        Số ngày mượn: {item.days} ngày
                                                                    </span>
                                                                    <Tooltip title="Chỉnh sửa thời gian mượn">
                                                                        <Button
                                                                            icon={<EditOutlined />}
                                                                            size="small"
                                                                            type="link"
                                                                            onClick={() => openEditModal(item)}
                                                                            className="text-blue-600"
                                                                        />
                                                                    </Tooltip>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Col>

                                                {/* Phí thuê */}
                                                <Col flex="120px">
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-red-500">
                                                            {item.book.dailyRentalFee.toLocaleString()}₫
                                                        </div>
                                                        <div className="text-xs text-gray-500">/ ngày thuê</div>
                                                    </div>
                                                </Col>

                                                {/* Số lượng */}
                                                <Col flex="120px">
                                                    <div className="text-center space-y-2">
                                                        <InputNumber
                                                            min={1}
                                                            max={item.book.availableCopies}
                                                            value={item.quantity}
                                                            onChange={(value) =>
                                                                updateQuantity(item.bookId, value || 1)
                                                            }
                                                            className="w-full"
                                                            size="small"
                                                        />
                                                        <div className="text-xs text-orange-500">
                                                            Còn {item.book.availableCopies} cuốn
                                                        </div>
                                                    </div>
                                                </Col>

                                                {/* Thành tiền */}
                                                <Col flex="180px">
                                                    <div className="text-right">
                                                        <div className="font-bold text-lg text-red-500">
                                                            {item.totalPrice.toLocaleString()}₫
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Phí thuê: {(item.rentalFee || 0).toLocaleString()}₫
                                                        </div>
                                                        <div className="text-xs text-orange-600 font-medium">
                                                            Tiền cọc: {(item.depositFee || 0).toLocaleString()}₫
                                                        </div>
                                                    </div>
                                                </Col>

                                                {/* Actions */}
                                                <Col flex="80px">
                                                    <div className="flex flex-col gap-2">
                                                        <Tooltip title="Xóa khỏi danh sách">
                                                            <Button
                                                                icon={<DeleteOutlined />}
                                                                size="small"
                                                                danger
                                                                onClick={() => removeItem(item.bookId)}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </Col>

                    {/* Tóm tắt đơn hàng */}
                    <Col xs={24} lg={8}>
                        <div className="sticky top-6">
                            <Card className="shadow-lg rounded-xl border-0" bodyStyle={{ padding: '24px' }}>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <GiftOutlined className="text-blue-600" />
                                    Tóm tắt phiếu mượn
                                </h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Phí thuê sách</span>
                                        <span className="font-semibold">
                                            {dataCart
                                                ?.reduce((sum, item) => sum + (item.rentalFee || 0), 0)
                                                .toLocaleString()}
                                            ₫
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Tiền cọc</span>
                                        <span className="font-semibold text-orange-600">
                                            {dataCart
                                                ?.reduce((sum, item) => sum + (item.depositFee || 0), 0)
                                                .toLocaleString()}
                                            ₫
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-blue-600">
                                        <span>Dịch vụ</span>
                                        <span className="font-semibold">Miễn phí</span>
                                    </div>
                                </div>

                                <Divider className="my-4" />
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-lg font-bold">Tổng thanh toán</span>
                                    <span className="text-2xl font-bold text-red-600">
                                        {dataCart?.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}₫
                                    </span>
                                </div>
                                <Link to="/checkout">
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        className="h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-500 border-0 rounded-lg shadow-lg"
                                    >
                                        Xác nhận mượn sách
                                    </Button>
                                </Link>

                                {/* Lưu ý */}
                                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                                    <div className="text-sm">
                                        <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                                            <GiftOutlined />
                                            <span>Lưu ý</span>
                                        </div>
                                        <ul className="text-gray-600 space-y-1 text-xs">
                                            <li>• Tiền cọc sẽ được hoàn trả sau khi trả sách</li>
                                            <li>• Vui lòng trả sách đúng hạn</li>
                                            <li>• Giữ gìn sách cẩn thận</li>
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </Col>
                </Row>
            </main>

            {/* Modal chỉnh sửa thời gian mượn */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <CalendarOutlined className="text-blue-600" />
                        <span>Chỉnh sửa thời gian mượn sách</span>
                    </div>
                }
                open={isEditModalVisible}
                onOk={handleUpdateRentalDates}
                onCancel={handleCancelEdit}
                okText="Cập nhật"
                cancelText="Hủy"
                width={500}
            >
                {selectedProduct && (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <img
                                src={selectedProduct.book.images[0]}
                                alt={selectedProduct.book.title}
                                className="w-16 h-20 object-cover rounded"
                            />
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 line-clamp-2">
                                    {selectedProduct.book.title}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    Phí thuê: {selectedProduct.book.dailyRentalFee.toLocaleString()}₫/ngày
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày mượn</label>
                                <DatePicker
                                    value={newStartDate}
                                    onChange={(date) => setNewStartDate(date)}
                                    format="DD/MM/YYYY"
                                    placeholder="Chọn ngày mượn"
                                    className="w-full"
                                    disabledDate={(current) => {
                                        return current && current < dayjs().startOf('day');
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hạn trả</label>
                                <DatePicker
                                    value={newEndDate}
                                    onChange={(date) => setNewEndDate(date)}
                                    format="DD/MM/YYYY"
                                    placeholder="Chọn hạn trả"
                                    className="w-full"
                                    disabledDate={(current) => {
                                        if (!newStartDate) return current && current < dayjs().startOf('day');
                                        return current && current < newStartDate.startOf('day');
                                    }}
                                />
                            </div>

                            {newStartDate && newEndDate && (
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Số ngày mượn:</strong>{' '}
                                        {Math.ceil((newEndDate - newStartDate) / (1000 * 60 * 60 * 24)) + 1} ngày
                                    </p>
                                    <p className="text-sm text-blue-800 mt-1">
                                        <strong>Phí thuê:</strong>{' '}
                                        {(
                                            selectedProduct.book.dailyRentalFee *
                                            selectedProduct.quantity *
                                            (Math.ceil((newEndDate - newStartDate) / (1000 * 60 * 60 * 24)) + 1)
                                        ).toLocaleString()}
                                        ₫
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Chatbot floating button */}
            <Chatbot />
        </div>
    );
}

export default CartUser;
