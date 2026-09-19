import { CalendarDays, Newspaper } from 'lucide-react';
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import Chatbot from '../Components/Chatbot/Chatbot';

const posts = [
    {
        title: '5 phương pháp đọc học thuật hiệu quả cho sinh viên',
        category: 'Kỹ năng đọc',
        date: '12/09/2026',
    },
    {
        title: 'Cách xây dựng danh mục tài liệu tham khảo cho bài nghiên cứu',
        category: 'Nghiên cứu',
        date: '10/09/2026',
    },
    {
        title: 'Những đầu sách nên đọc về quan hệ quốc tế và ngoại giao',
        category: 'Gợi ý sách',
        date: '08/09/2026',
    },
    {
        title: 'Hướng dẫn sử dụng thư viện số DAVLibri cho người mới',
        category: 'Hướng dẫn',
        date: '05/09/2026',
    },
    {
        title: 'Thói quen ghi chú giúp việc đọc sách chuyên ngành dễ hơn',
        category: 'Học tập',
        date: '02/09/2026',
    },
    {
        title: 'Cập nhật tài liệu mới trong tháng dành cho bạn đọc',
        category: 'Tin thư viện',
        date: '01/09/2026',
    },
];

function Blog() {
    return (
        <div className="min-h-screen bg-blue-50 text-gray-800">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-12 min-h-[60vh]">
                <div className="mb-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Tin tức & Sự kiện</p>
                    <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-5xl">Tin tức & Sự kiện</h1>
                    <p className="mt-4 max-w-2xl text-gray-600">
                        Tin tức, gợi ý đọc sách và các kỹ năng khai thác tài liệu học thuật hiệu quả.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {posts.map((post, index) => (
                        <article
                            key={post.title}
                            className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="flex aspect-[16/10] items-center justify-center bg-blue-50">
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm">
                                    <Newspaper className="h-10 w-10 text-blue-600" />
                                </div>
                            </div>
                            <div className="p-5">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                    {post.category}
                                </span>
                                <h2 className="mt-4 line-clamp-2 text-lg font-bold leading-7 text-gray-900">
                                    {post.title}
                                </h2>
                                <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
                                    <CalendarDays className="h-4 w-4" />
                                    <span>{post.date}</span>
                                </div>
                                <div className="mt-5 h-1.5 w-full rounded-full bg-blue-50">
                                    <div
                                        className="h-1.5 rounded-full bg-blue-600"
                                        style={{ width: `${50 + index * 7}%` }}
                                    />
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </main>

            <Footer />
            <Chatbot />
        </div>
    );
}

export default Blog;
