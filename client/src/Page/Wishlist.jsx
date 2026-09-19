import { Heart, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import Chatbot from '../Components/Chatbot/Chatbot';

function Wishlist() {
    return (
        <div className="min-h-screen bg-blue-50 text-gray-800">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-12 min-h-[60vh]">
                <section className="flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm md:p-14">
                    <Heart className="h-24 w-24 text-gray-300 md:h-32 md:w-32" />
                    <h1 className="mt-6 text-3xl font-bold text-gray-900 md:text-4xl">Danh sách yêu thích trống</h1>
                    <p className="mx-auto mt-4 max-w-xl text-gray-600">
                        Lưu lại những cuốn sách bạn quan tâm để dễ dàng quay lại và mượn khi cần.
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

export default Wishlist;
