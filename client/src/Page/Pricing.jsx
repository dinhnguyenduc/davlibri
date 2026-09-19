import { CheckCircle, Crown, GraduationCap, Microscope } from 'lucide-react';
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import Chatbot from '../Components/Chatbot/Chatbot';

const plans = [
    {
        name: 'Gói Cơ bản',
        price: '30 ngày',
        description: 'Phù hợp cho nhu cầu mượn sách ngắn hạn và đọc tài liệu phổ thông.',
        icon: CheckCircle,
        features: ['Mượn tài liệu tiêu chuẩn', 'Theo dõi lịch trả sách', 'Hỗ trợ gia hạn trực tuyến'],
    },
    {
        name: 'Gói Sinh viên',
        price: '90 ngày',
        description: 'Tối ưu cho sinh viên cần truy cập tài liệu học tập thường xuyên.',
        icon: GraduationCap,
        featured: true,
        features: ['Ưu tiên tài liệu học phần', 'Nhắc hạn trả sách', 'Gợi ý sách theo chuyên ngành'],
    },
    {
        name: 'Gói Nghiên cứu',
        price: '180 ngày',
        description: 'Dành cho người học, giảng viên và nhóm nghiên cứu chuyên sâu.',
        icon: Microscope,
        features: ['Thời hạn mượn dài hơn', 'Tài liệu chuyên khảo', 'Hỗ trợ tra cứu học thuật'],
    },
];

function Pricing() {
    return (
        <div className="min-h-screen bg-blue-50 text-gray-800">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-12 min-h-[60vh]">
                <div className="mb-10 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Rental Packages</p>
                    <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-5xl">Gói nạp ngày thuê</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                        Lựa chọn gói ngày thuê phù hợp để duy trì quyền mượn và quản lý tài liệu thuận tiện hơn.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        return (
                            <article
                                key={plan.name}
                                className={`relative rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                                    plan.featured ? 'border-blue-500 ring-2 ring-blue-100' : 'border-blue-100'
                                }`}
                            >
                                {plan.featured && (
                                    <div className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                                        <Crown className="h-3.5 w-3.5" />
                                        Phổ biến
                                    </div>
                                )}
                                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                                    <Icon className="h-7 w-7 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                                <p className="mt-3 text-4xl font-extrabold text-blue-700">{plan.price}</p>
                                <p className="mt-4 min-h-[72px] text-sm leading-6 text-gray-600">{plan.description}</p>
                                <ul className="mt-6 space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className="mt-8 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700">
                                    Đăng ký ngay
                                </button>
                            </article>
                        );
                    })}
                </div>
            </main>

            <Footer />
            <Chatbot />
        </div>
    );
}

export default Pricing;
