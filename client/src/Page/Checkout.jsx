import React, { useEffect, useState } from 'react';
import {
    CheckCircle,
    HelpCircle,
    Truck,
    CreditCard,
    Smartphone,
    Banknote,
    User,
    GraduationCap,
    IdCard,
    Phone,
    Tag,
    X,
} from 'lucide-react';
import Header from '../Components/Header/Header';
import Chatbot from '../Components/Chatbot/Chatbot';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { requestUpdateInfoCart, requestCreateLoan, requestApplyCoupon, requestGetCart } from '../config/request';
import { message } from 'antd';
import dayjs from 'dayjs';

function Checkout() {
    const { dataCart, dataUser, fetchCart } = useStore();
    const navigate = useNavigate();
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
        studentClass: '',
        studentId: '',
    });

    const [typePayment, setTypePayment] = useState('cod');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCustomerInfo((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    useEffect(() => {
        if (dataUser) {
            setCustomerInfo((prev) => ({
                ...prev,
                name: dataUser.fullName || prev.name,
                email: dataUser.email || prev.email,
                phone: dataUser.phone || prev.phone,
            }));
        }
    }, [dataUser]);

    // Áp dụng mã giảm giá
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            message.warning('Vui lòng nhập mã giảm giá');
            return;
        }

        setIsApplyingCoupon(true);
        try {
            const totalAmount = dataCart.reduce((total, item) => total + item.totalPrice, 0);
            const products = dataCart.map((item) => ({
                productId: item.book._id,
                quantity: item.quantity,
            }));

            const response = await requestApplyCoupon({
                code: couponCode,
                orderTotal: totalAmount,
                products: products,
            });

            setAppliedCoupon(response.metadata);
            message.success('Áp dụng mã giảm giá thành công!');
        } catch (error) {
            message.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    // Xóa mã giảm giá
    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        message.info('Đã xóa mã giảm giá');
    };

    // Tính tổng tiền sau khi áp dụng mã giảm giá
    const calculateTotal = () => {
        const subtotal = dataCart.reduce((total, item) => total + item.totalPrice, 0);
        if (appliedCoupon) {
            return appliedCoupon.finalTotal;
        }
        return subtotal;
    };

    const handleCreateLoan = async () => {
        if (isSubmittingLoan) {
            return;
        }

        if (!dataCart?.length) {
            message.warning('Giỏ mượn sách đang trống');
            navigate('/cart');
            return;
        }

        if (!customerInfo.name || !customerInfo.phone) {
            message.warning('Vui lòng nhập họ tên và số điện thoại');
            return;
        }

        const data = {
            feePaymentMethod: typePayment,
            couponId: appliedCoupon?.couponId || null,
            discountAmount: appliedCoupon?.discountAmount || 0,
        };

        setIsSubmittingLoan(true);
        try {
            const cartResponse = await requestGetCart();
            const serverCart = Array.isArray(cartResponse?.metadata)
                ? cartResponse.metadata
                : cartResponse?.metadata?.books || [];

            if (!serverCart.length) {
                message.warning('Giỏ mượn sách đang trống hoặc đã hết hạn. Vui lòng thêm lại sách.');
                await fetchCart();
                navigate('/cart');
                return;
            }

            await requestUpdateInfoCart({
                fullName: customerInfo.name,
                phone: customerInfo.phone,
                studentClass: customerInfo.studentClass,
                studentId: customerInfo.studentId,
            });

            if (typePayment === 'cod') {
                await requestCreateLoan(data);
                await fetchCart();
                message.success('Tạo phiếu mượn thành công');
                navigate('/');
                // Nếu có coupon, tăng số lần sử dụng
                if (appliedCoupon?.couponId) {
                    // Có thể gọi API increment usage ở đây nếu cần
                }
            } else if (typePayment === 'momo') {
                const res = await requestCreateLoan(data);
                window.open(res.metadata, '_blank');
            } else if (typePayment === 'vnpay') {
                const res = await requestCreateLoan(data);
                window.open(res.metadata, '_blank');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Không thể tạo phiếu mượn';
            message.error(errorMessage);

            if (errorMessage.includes('Giỏ mượn sách không tồn tại')) {
                await fetchCart();
                navigate('/cart');
            }
        } finally {
            setIsSubmittingLoan(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <header>
                <Header />
            </header>

            <main className="w-[90%] bg-white mt-2.5 mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Xác nhận phiếu mượn</h1>
                    <p className="text-gray-600">Hoàn tất thủ tục mượn sách</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Delivery and Payment */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Delivery Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {dataCart.map((item, index) => (
                                <div key={index} className="p-4 border-b last:border-b-0 border-gray-100">
                                    <div className="flex gap-4">
                                        {/* Ảnh sách */}
                                        <div className="flex-shrink-0">
                                            <img
                                                src={item.book.images[0]}
                                                alt={item.book.title}
                                                className="w-20 h-28 object-contain rounded-lg shadow-sm bg-gray-50"
                                            />
                                        </div>

                                        {/* Thông tin sách */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                                                    {item.book.title}
                                                </h3>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <p>
                                                        Tác giả: <span className="font-medium">{item.book.author}</span>
                                                    </p>
                                                    <p>
                                                        Nhà xuất bản:{' '}
                                                        <span className="font-medium">{item.book.publisher}</span>
                                                    </p>
                                                    <div className="flex gap-4 mt-2">
                                                        <p>
                                                            Ngày mượn:{' '}
                                                            <span className="font-medium text-blue-600">
                                                                {dayjs(item.borrowDate).format('DD/MM/YYYY')}
                                                            </span>
                                                        </p>
                                                        <p>
                                                            Hạn trả:{' '}
                                                            <span className="font-medium text-blue-600">
                                                                {dayjs(item.dueDate).format('DD/MM/YYYY')}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <p className="text-blue-700 font-semibold">
                                                        Số ngày mượn: {item.days} ngày
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Giá và số lượng */}
                                        <div className="flex flex-col items-end justify-between min-w-[220px]">
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-red-500">
                                                    {item.book.dailyRentalFee.toLocaleString()}đ
                                                    <span className="text-xs text-gray-500 font-normal">
                                                        {' '}
                                                        / ngày thuê
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    Số lượng: <span className="font-semibold">{item.quantity}</span>
                                                </div>
                                            </div>

                                            <div className="text-right space-y-1">
                                                <div className="text-sm text-gray-600">
                                                    Phí thuê:{' '}
                                                    <span className="font-semibold">
                                                        {(item.rentalFee || 0).toLocaleString()}đ
                                                    </span>
                                                </div>
                                                <div className="text-sm text-orange-600">
                                                    Tiền cọc:{' '}
                                                    <span className="font-semibold">
                                                        {(item.depositFee || 0).toLocaleString()}đ
                                                    </span>
                                                </div>
                                                <div className="pt-1 border-t border-gray-200">
                                                    <div className="text-xl font-bold text-red-600">
                                                        {item.totalPrice.toLocaleString()}đ
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Customer Information Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-violet-100 rounded-full">
                                        <User className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900">Thông tin sinh viên</h2>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="space-y-6">
                                    {/* Name Field */}
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="text-sm font-medium text-gray-700 block mb-1.5"
                                        >
                                            Họ và tên <span className="text-red-500">*</span>
                                        </label>
                                        <div className="group relative transition-all duration-300">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-violet-500 transition-colors">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                value={customerInfo.name}
                                                onChange={handleInputChange}
                                                className="w-full px-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all duration-300"
                                                placeholder="Nhập họ và tên của bạn"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Phone Field */}
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="text-sm font-medium text-gray-700 block mb-1.5"
                                        >
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            value={customerInfo.email}
                                            readOnly
                                            className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 outline-none"
                                        />
                                    </div>

                                    {/* Phone Field */}
                                    <div>
                                        <label
                                            htmlFor="phone"
                                            className="text-sm font-medium text-gray-700 block mb-1.5"
                                        >
                                            Số điện thoại <span className="text-red-500">*</span>
                                        </label>
                                        <div className="group relative transition-all duration-300">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-violet-500 transition-colors">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                id="phone"
                                                value={customerInfo.phone}
                                                onChange={handleInputChange}
                                                className="w-full px-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all duration-300"
                                                placeholder="Nhập số điện thoại của bạn"
                                                required
                                            />
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                                <span className="text-xs text-gray-400">VD: 0912345678</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Student Class Field - optional */}
                                    <div>
                                        <label
                                            htmlFor="studentClass"
                                            className="text-sm font-medium text-gray-700 block mb-1.5"
                                        >
                                            Lớp/Khoa <span className="text-gray-400">(không bắt buộc)</span>
                                        </label>
                                        <div className="group relative transition-all duration-300">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-violet-500 transition-colors">
                                                <GraduationCap className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                name="studentClass"
                                                id="studentClass"
                                                value={customerInfo.studentClass}
                                                onChange={handleInputChange}
                                                className="w-full px-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all duration-300"
                                                placeholder="Nhập lớp hoặc khoa của bạn (VD: CNTT-K15)"
                                            />
                                        </div>
                                    </div>

                                    {/* Student ID Field - optional */}
                                    <div>
                                        <label
                                            htmlFor="studentId"
                                            className="text-sm font-medium text-gray-700 block mb-1.5"
                                        >
                                            Mã sinh viên <span className="text-gray-400">(không bắt buộc)</span>
                                        </label>
                                        <div className="group relative transition-all duration-300">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-violet-500 transition-colors">
                                                <IdCard className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                name="studentId"
                                                id="studentId"
                                                value={customerInfo.studentId}
                                                onChange={handleInputChange}
                                                className="w-full px-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all duration-300"
                                                placeholder="Nhập mã sinh viên của bạn"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CreditCard className="w-5 h-5 text-green-600" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900">Chọn hình thức thanh toán</h2>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Momo Option */}
                                <div
                                    className={`border ${
                                        typePayment === 'momo'
                                            ? 'border-2 border-pink-400 bg-pink-50'
                                            : 'border-gray-200'
                                    } rounded-xl p-4 hover:border-pink-400 hover:bg-pink-50 transition-all duration-200 cursor-pointer`}
                                    onClick={() => setTypePayment('momo')}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className={`w-5 h-5 ${
                                                typePayment === 'momo'
                                                    ? 'bg-pink-500 flex items-center justify-center'
                                                    : 'border-2 border-gray-300'
                                            } rounded-full transition-all duration-200`}
                                        >
                                            {typePayment === 'momo' && <CheckCircle className="w-3 h-3 text-white" />}
                                        </div>
                                        <img
                                            src="https://developers.momo.vn/v3/vi/assets/images/square-8c08a00f550e40a2efafea4a005b1232.png"
                                            alt="Momo"
                                            className="w-8 h-8 rounded"
                                        />
                                        <span className="font-medium text-gray-900">Ví Momo</span>
                                    </div>
                                </div>

                                {/* Cash Option */}
                                <div
                                    className={`border ${
                                        typePayment === 'cod'
                                            ? 'border-2 border-blue-400 bg-blue-50'
                                            : 'border-gray-200'
                                    } rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer`}
                                    onClick={() => setTypePayment('cod')}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className={`w-5 h-5 ${
                                                typePayment === 'cod'
                                                    ? 'bg-blue-500 flex items-center justify-center'
                                                    : 'border-2 border-gray-300'
                                            } rounded-full transition-all duration-200`}
                                        >
                                            {typePayment === 'cod' && <CheckCircle className="w-3 h-3 text-white" />}
                                        </div>
                                        <img
                                            src="https://salt.tikicdn.com/ts/upload/92/b2/78/1b3b9cda5208b323eb9ec56b84c7eb87.png"
                                            alt="Cash"
                                            className="w-8 h-8 rounded"
                                        />
                                        <span className="font-medium text-gray-900">Thanh toán tiền mặt</span>
                                    </div>
                                </div>

                                {/* VNPAY Option */}
                                <div
                                    className={`border ${
                                        typePayment === 'vnpay'
                                            ? 'border-2 border-blue-400 bg-blue-50'
                                            : 'border-gray-200'
                                    } rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer`}
                                    onClick={() => setTypePayment('vnpay')}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className={`w-5 h-5 ${
                                                typePayment === 'vnpay'
                                                    ? 'bg-blue-500 flex items-center justify-center'
                                                    : 'border-2 border-gray-300'
                                            } rounded-full transition-all duration-200`}
                                        >
                                            {typePayment === 'vnpay' && <CheckCircle className="w-3 h-3 text-white" />}
                                        </div>
                                        <img
                                            src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg"
                                            alt="VNPAY"
                                            className="w-8 h-8 rounded"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">VNPAY</div>
                                            <div className="text-xs text-gray-500">
                                                Quét Mã QR từ ứng dụng ngân hàng
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-5">
                            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900">Đơn hàng</h2>
                                    <Link to="/cart">
                                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline">
                                            Thay đổi
                                        </button>
                                    </Link>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4">
                                    {/* Mã giảm giá */}
                                    <div className="border-b border-gray-200 pb-4">
                                        {!appliedCoupon ? (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Mã giảm giá
                                                </label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Nhập mã giảm giá"
                                                            value={couponCode}
                                                            onChange={(e) =>
                                                                setCouponCode(e.target.value.toUpperCase())
                                                            }
                                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            onKeyPress={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleApplyCoupon();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={handleApplyCoupon}
                                                        disabled={isApplyingCoupon}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                                                    >
                                                        {isApplyingCoupon ? 'Đang xử lý...' : 'Áp dụng'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-2">
                                                        <Tag className="w-5 h-5 text-green-600 mt-0.5" />
                                                        <div>
                                                            <div className="font-semibold text-green-800">
                                                                {appliedCoupon.couponCode}
                                                            </div>
                                                            <div className="text-sm text-green-600">
                                                                Giảm {appliedCoupon.discountAmount.toLocaleString()}đ
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={handleRemoveCoupon}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Phí thuê sách</span>
                                        <span className="font-medium">
                                            {dataCart
                                                .reduce((total, item) => total + (item.rentalFee || 0), 0)
                                                .toLocaleString()}
                                            đ
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Tiền cọc</span>
                                        <span className="font-medium text-orange-600">
                                            {dataCart
                                                .reduce((total, item) => total + (item.depositFee || 0), 0)
                                                .toLocaleString()}
                                            đ
                                        </span>
                                    </div>

                                    {appliedCoupon && (
                                        <div className="flex justify-between items-center text-green-600">
                                            <span className="font-medium">Giảm giá</span>
                                            <span className="font-semibold">
                                                -{appliedCoupon.discountAmount.toLocaleString()}đ
                                            </span>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-lg font-semibold text-gray-900">
                                                Tổng tiền thanh toán
                                            </span>
                                            <span className="text-2xl font-bold text-red-600">
                                                {calculateTotal().toLocaleString()}đ
                                            </span>
                                        </div>
                                        {appliedCoupon && (
                                            <div className="text-sm text-gray-500 text-right line-through">
                                                {appliedCoupon.originalTotal.toLocaleString()}đ
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                                        Giá này bao gồm tiền thuê sách và tiền cọc. Tiền cọc sẽ được hoàn trả sau khi
                                        bạn trả sách
                                    </div>

                                    <button
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-purple-700 hover:to-blue-800 text-white font-semibold py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                                        onClick={handleCreateLoan}
                                        disabled={isSubmittingLoan}
                                    >
                                        {isSubmittingLoan ? 'Đang xử lý...' : 'Xác nhận mượn sách'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Chatbot floating button */}
            <Chatbot />
        </div>
    );
}

export default Checkout;
