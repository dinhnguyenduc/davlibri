// import { FacebookFilled, YoutubeFilled } from 'antd/es/icons';

function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-8 w-full">
            <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row md:grid md:grid-cols-4 gap-8 text-sm text-gray-700">
                {/* Hỗ trợ khách hàng */}
                <div className="flex flex-col">
                    <h3 className="font-semibold mb-4 text-base text-gray-800">Hỗ trợ khách hàng</h3>
                    <div className="mb-2">
                        <span className="font-medium">Hotline:</span>
                        <span className="font-semibold ml-1">1900-6035</span>
                    </div>
                    <div className="mb-3 text-xs text-gray-500">(1000 đ/phút, 8-21h kể cả T7, CN)</div>
                    <ul className="space-y-2 text-xs sm:text-sm">
                        <li className="hover:text-blue-600 transition cursor-pointer">Các câu hỏi thường gặp</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Gửi yêu cầu hỗ trợ</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Hướng dẫn đặt hàng</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Phương thức vận chuyển</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Chính sách kiểm hàng</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Chính sách đổi trả</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Hướng dẫn trả góp</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Chính sách nhập khẩu</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">
                            Hỗ trợ khách hàng: hotro@dav.edu.vn
                        </li>
                        <li className="hover:text-blue-600 transition cursor-pointer">
                            Báo lỗi bảo mật: security@dav.edu.vn
                        </li>
                    </ul>
                </div>

                {/* Về DAVLibri */}
                <div className="flex flex-col">
                    <h3 className="font-semibold mb-4 text-base text-gray-800">Về DAVLibri</h3>
                    <ul className="space-y-2 text-xs sm:text-sm">
                        <li className="hover:text-blue-600 transition cursor-pointer">Giới thiệu DAVLibri</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">DAVLibri Blog</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Tuyển dụng</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Chính sách bảo mật thanh toán</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">
                            Chính sách bảo mật thông tin cá nhân
                        </li>
                        <li className="hover:text-blue-600 transition cursor-pointer">
                            Chính sách giải quyết khiếu nại
                        </li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Điều khoản sử dụng</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Giới thiệu DAVLibri Xu</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">
                            Tiếp thị liên kết cùng DAVLibri
                        </li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Bán hàng doanh nghiệp</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Điều kiện vận chuyển</li>
                    </ul>
                </div>

                {/* Hợp tác & liên kết */}
                <div className="flex flex-col">
                    <h3 className="font-semibold mb-4 text-base text-gray-800">Hợp tác và liên kết</h3>
                    <ul className="space-y-2 text-xs sm:text-sm mb-4">
                        <li className="hover:text-blue-600 transition cursor-pointer">Quy chế hoạt động Sàn GDTMĐT</li>
                        <li className="hover:text-blue-600 transition cursor-pointer">Bán hàng cùng DAVLibri</li>
                    </ul>

                    <h3 className="font-semibold mb-3 text-base text-gray-800">Chứng nhận bởi</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                        <img
                            src="https://frontend.tikicdn.com/_desktop-next/static/img/footer/bo-cong-thuong-2.png"
                            alt="Bộ Công Thương"
                            className="h-8 w-auto"
                        />
                        <img
                            src="https://frontend.tikicdn.com/_desktop-next/static/img/footer/bo-cong-thuong.svg"
                            alt="Đã đăng ký"
                            className="h-8 w-auto"
                        />
                        <img
                            src="https://images.dmca.com/Badges/dmca_protected_sml_120y.png?ID=388d758c-6722-4245-a2b0-1d2415e70127"
                            alt="DMCA"
                            className="h-8 w-auto"
                        />
                    </div>
                </div>

                {/* Kết nối với chúng tôi */}
                <div className="flex flex-col">
                    <h3 className="font-semibold mb-4 text-base text-gray-800">Kết nối với chúng tôi</h3>
                    <div className="flex gap-3 flex-wrap">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/2048px-Icon_of_Zalo.svg.png"
                            alt="Zalo"
                            className="h-10 w-10 hover:scale-110 transition cursor-pointer"
                        />
                        <img
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiXN9xSEe8unzPBEQOeAKXd9Q55efGHGB9BA&s"
                            alt="Facebook"
                            className="h-10 w-10 hover:scale-110 transition cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Bottom Info */}
            <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-gray-600">
                <p>© 2026 DAVLibri - Thư viện Học viện Ngoại giao.</p>
            </div>
        </footer>
    );
}

export default Footer;
