import { CheckCircle, CircleAlert, Home, RotateCcw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const demoOrder = {
    code: 'VNPAY-DEMO-20260819',
    amount: 150000,
    method: 'VNPAY Sandbox',
};

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);
}

function PaymentDemo() {
    const [searchParams, setSearchParams] = useSearchParams();
    const isFailure = searchParams.get('status') === 'failure';
    const responseCode = searchParams.get('code');

    const setDemoStatus = (status) => {
        setSearchParams(status === 'success' ? {} : { status });
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8 text-center">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                        VNPay Sandbox Demo
                    </p>
                    <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Kết quả thanh toán</h1>
                    <p className="mt-3 text-slate-600">Màn hình mô phỏng để trình bày luồng thành công và thất bại.</p>
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className={`px-6 py-10 text-center ${isFailure ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                        {isFailure ? (
                            <CircleAlert className="mx-auto h-16 w-16 text-rose-600" />
                        ) : (
                            <CheckCircle className="mx-auto h-16 w-16 text-emerald-600" />
                        )}
                        <h2 className={`mt-5 text-2xl font-bold ${isFailure ? 'text-rose-800' : 'text-emerald-800'}`}>
                            {isFailure ? 'Thanh toán chưa hoàn tất' : 'Thanh toán thành công'}
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-slate-600">
                            {isFailure
                                ? `Giao dịch bị từ chối hoặc đã được hủy. Mã phản hồi: ${responseCode || 'demo'}.`
                                : 'Giao dịch Sandbox đã được xác thực và ghi nhận thành công.'}
                        </p>
                    </div>

                    <div className="grid gap-4 px-6 py-8 sm:grid-cols-3">
                        <div>
                            <p className="text-sm text-slate-500">Mã giao dịch</p>
                            <p className="mt-1 font-semibold text-slate-900">{demoOrder.code}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Số tiền</p>
                            <p className="mt-1 font-semibold text-slate-900">{formatCurrency(demoOrder.amount)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Cổng thanh toán</p>
                            <p className="mt-1 font-semibold text-slate-900">{demoOrder.method}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 border-t border-slate-100 px-6 py-6">
                        <button
                            type="button"
                            onClick={() => setDemoStatus('success')}
                            className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
                        >
                            Mô phỏng thành công
                        </button>
                        <button
                            type="button"
                            onClick={() => setDemoStatus('failure')}
                            className="rounded-lg bg-rose-600 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-700"
                        >
                            Mô phỏng thất bại
                        </button>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            <Home className="h-4 w-4" />
                            Trang chủ
                        </Link>
                        <button
                            type="button"
                            onClick={() => setDemoStatus('success')}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Đặt lại
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default PaymentDemo;
