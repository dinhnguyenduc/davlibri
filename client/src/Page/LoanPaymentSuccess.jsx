import { useEffect, useState } from 'react';
import { CheckCircle, Home, LoaderCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { requestGetLoanById } from '../config/request';

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value || 0);
}

function LoanPaymentSuccess() {
    const { id } = useParams();
    const [loan, setLoan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        requestGetLoanById(id)
            .then((response) => setLoan(response.metadata))
            .catch(() => setError('Không thể tải thông tin phiếu mượn.'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50">
                <LoaderCircle className="h-10 w-10 animate-spin text-blue-600" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12">
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl md:p-10">
                {error || !loan ? (
                    <>
                        <h1 className="text-2xl font-bold text-rose-700">Không tải được phiếu mượn</h1>
                        <p className="mt-3 text-slate-600">{error || 'Phiếu mượn không tồn tại.'}</p>
                    </>
                ) : (
                    <>
                        <CheckCircle className="mx-auto h-16 w-16 text-emerald-600" />
                        <h1 className="mt-5 text-3xl font-bold text-emerald-800">Thanh toán thành công</h1>
                        <p className="mt-3 text-slate-600">
                            Yêu cầu mượn sách đã được ghi nhận và chờ thủ thư phê duyệt.
                        </p>
                        <div className="mt-8 grid gap-4 rounded-xl bg-slate-50 p-5 text-left sm:grid-cols-3">
                            <div>
                                <p className="text-sm text-slate-500">Mã phiếu</p>
                                <p className="mt-1 break-all font-semibold text-slate-900">{loan._id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Phương thức</p>
                                <p className="mt-1 font-semibold text-slate-900">{loan.feePaymentMethod}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Tổng tiền</p>
                                <p className="mt-1 font-semibold text-slate-900">{formatCurrency(loan.totalAmount)}</p>
                            </div>
                        </div>
                    </>
                )}
                <Link
                    to="/"
                    className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                    <Home className="h-4 w-4" />
                    Về trang chủ
                </Link>
            </div>
        </main>
    );
}

export default LoanPaymentSuccess;
