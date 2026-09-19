import { BookOpen, GraduationCap, Library, Target } from 'lucide-react';
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import Chatbot from '../Components/Chatbot/Chatbot';

function About() {
    return (
        <div className="min-h-screen bg-blue-50 text-gray-800">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-12 min-h-[60vh]">
                <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                    <div className="grid gap-8 p-6 md:grid-cols-2 md:p-10 lg:p-12">
                        <div className="flex flex-col justify-center">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                                DAVLibri Library
                            </p>
                            <h1 className="text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
                                Giới thiệu DAVLibri
                            </h1>
                            <p className="mt-5 text-base leading-8 text-gray-600 md:text-lg">
                                DAVLibri được xây dựng như một không gian thư viện học thuật hiện đại, hỗ trợ sinh viên,
                                giảng viên và nhà nghiên cứu tiếp cận tài liệu nhanh chóng, có hệ thống và thuận tiện.
                            </p>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                    <Target className="mb-3 h-7 w-7 text-blue-600" />
                                    <h2 className="font-bold text-gray-900">Sứ mệnh</h2>
                                    <p className="mt-2 text-sm leading-6 text-gray-600">
                                        Kết nối tri thức học thuật với nhu cầu học tập và nghiên cứu hằng ngày.
                                    </p>
                                </div>
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                    <GraduationCap className="mb-3 h-7 w-7 text-blue-600" />
                                    <h2 className="font-bold text-gray-900">Tầm nhìn</h2>
                                    <p className="mt-2 text-sm leading-6 text-gray-600">
                                        Trở thành nền tảng thư viện số thân thiện, đáng tin cậy cho cộng đồng học thuật.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 p-6">
                            <div className="absolute inset-x-8 top-8 h-32 rounded-2xl bg-white shadow-sm" />
                            <div className="absolute bottom-8 left-8 right-8 rounded-2xl bg-white p-6 shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                                        <Library className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-600">Academic Library</p>
                                        <p className="mt-1 text-xl font-bold text-gray-900">Không gian tri thức số</p>
                                    </div>
                                </div>
                                <div className="mt-6 grid grid-cols-3 gap-3">
                                    {[1, 2, 3].map((item) => (
                                        <div key={item} className="rounded-xl bg-blue-50 p-4 text-center">
                                            <BookOpen className="mx-auto h-6 w-6 text-blue-600" />
                                            <div className="mt-3 h-2 rounded bg-blue-100" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
            <Chatbot />
        </div>
    );
}

export default About;
