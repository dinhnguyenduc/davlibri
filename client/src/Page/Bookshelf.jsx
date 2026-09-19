import { BookMarked, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import Chatbot from '../Components/Chatbot/Chatbot';

function Bookshelf() {
    return (
        <div className="min-h-screen bg-blue-50 text-gray-800">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-12 min-h-[60vh]">
                <section className="rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm md:p-12">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
                        <BookMarked className="h-12 w-12 text-blue-600" />
                    </div>
                    <h1 className="mt-6 text-3xl font-bold text-gray-900 md:text-4xl">Tủ sách cá nhân</h1>
                    <p className="mx-auto mt-4 max-w-xl text-gray-600">
                        Tủ sách của bạn hiện chưa có tài liệu nào đang mượn.
                    </p>
                    <Link
                        to="/"
                        className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                        <Search className="h-5 w-5" />
                        Khám phá sách ngay
                    </Link>
                </section>
            </main>

            <Footer />
            <Chatbot />
        </div>
    );
}

export default Bookshelf;
