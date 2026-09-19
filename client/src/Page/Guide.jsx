import { AlertCircle, BookOpenCheck, CalendarClock, ClipboardList, RefreshCw } from 'lucide-react';
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import Chatbot from '../Components/Chatbot/Chatbot';

const guideSections = [
    {
        title: 'Quy trình mượn sách',
        icon: BookOpenCheck,
        items: [
            'Tìm kiếm tài liệu theo tên sách, tác giả hoặc danh mục tài liệu.',
            'Chọn thời gian mượn phù hợp và thêm sách vào giỏ mượn.',
            'Xác nhận thông tin mượn trước khi gửi yêu cầu đến thư viện.',
        ],
    },
    {
        title: 'Thời hạn và gia hạn',
        icon: CalendarClock,
        items: [
            'Thời hạn mượn phụ thuộc vào gói ngày thuê và tình trạng tài liệu.',
            'Bạn nên kiểm tra ngày trả dự kiến trong tủ sách cá nhân.',
            'Yêu cầu gia hạn cần được thực hiện trước ngày đến hạn.',
        ],
    },
    {
        title: 'Quy định trả sách',
        icon: ClipboardList,
        items: [
            'Tài liệu cần được trả đúng hạn và giữ nguyên tình trạng ban đầu.',
            'Người mượn chịu trách nhiệm với tài liệu bị thất lạc hoặc hư hỏng.',
            'Các khoản phí phát sinh sẽ được thông báo trong quá trình xử lý trả sách.',
        ],
    },
    {
        title: 'Lưu ý sử dụng',
        icon: AlertCircle,
        items: [
            'Không chia sẻ tài khoản cá nhân cho người khác sử dụng.',
            'Ưu tiên kiểm tra tình trạng còn sách trước khi tạo yêu cầu mượn.',
            'Liên hệ thư viện nếu thông tin tài liệu hoặc ngày mượn có sai lệch.',
        ],
    },
];

function Guide() {
    return (
        <div className="min-h-screen bg-blue-50 text-gray-800">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-12 min-h-[60vh]">
                <div className="mb-10 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Library Guide</p>
                    <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-5xl">Hướng dẫn mượn trả sách</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                        Các quy định cơ bản giúp bạn sử dụng DAVLibri thuận tiện, đúng hạn và an toàn.
                    </p>
                </div>

                <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        {guideSections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <article
                                    key={section.title}
                                    className="rounded-2xl border border-blue-100 bg-blue-50 p-5"
                                >
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                                            <Icon className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                                    </div>
                                    <ul className="space-y-3 text-sm leading-6 text-gray-700">
                                        {section.items.map((item) => (
                                            <li key={item} className="flex gap-2">
                                                <RefreshCw className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            );
                        })}
                    </div>
                </section>
            </main>

            <Footer />
            <Chatbot />
        </div>
    );
}

export default Guide;
