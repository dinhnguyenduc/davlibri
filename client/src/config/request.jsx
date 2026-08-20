import axios from 'axios';
import cookies from 'js-cookie';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const request = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

const refreshRequest = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

export const requestLogin = async (data) => {
    const res = await request.post('/api/users/login', data);
    return res.data;
};

export const requestRegister = async (data) => {
    const res = await request.post('/api/users/register', data);
    return res.data;
};

export const requestAuth = async (data) => {
    const res = await request.post('/api/users/auth', data);
    return res.data;
};

export const requestRefreshToken = async (data) => {
    const res = await request.post('/api/users/refresh-token', data);
    return res.data;
};

export const requestUpdateUser = async (data) => {
    const res = await request.post('/api/users/update', data);
    return res.data;
};

export const requestUpdatePassword = async (data) => {
    const res = await request.post('/api/users/update-password', data);
    return res.data;
};

export const requestUploadAvatar = async (data) => {
    const res = await request.post('/api/users/upload-avatar', data);
    return res.data;
};

export const requestForgotPassword = async (data) => {
    const res = await request.post('/api/users/forgot-password', data);
    return res.data;
};

export const requestResetPassword = async (data) => {
    const res = await request.post('/api/users/reset-password', data);
    return res.data;
};

export const requestLogout = async () => {
    const res = await request.post('/api/users/logout');
    return res.data;
};

/// category

export const requestCreateCategory = async (data) => {
    const res = await request.post('/api/category/create', data);
    return res.data;
};

export const requestDeleteCategory = async (id) => {
    const res = await request.post('/api/category/delete', { id });
    return res.data;
};

export const requestGetCategory = async () => {
    const res = await request.get('/api/category/get');
    return res.data;
};

export const requestUpdateCategory = async (data) => {
    const res = await request.post('/api/category/update', data);
    return res.data;
};

export const requestGetCategoryById = async (id) => {
    const res = await request.get(`/api/category/get-category-by-id`, { params: { id } });
    return res.data;
};

export const requestUpdateCategoryDeposit = async (data) => {
    const res = await request.post('/api/category/update-deposit', data);
    return res.data;
};

export const requestGetGlobalDeposit = async () => {
    const res = await request.get('/api/category/get-global-deposit');
    return res.data;
};

export const requestUpdateGlobalDeposit = async (data) => {
    const res = await request.post('/api/category/update-global-deposit', data);
    return res.data;
};

// books (refactored from product)
export const requestCreateBook = async (data) => {
    const res = await request.post('/api/books/create', data);
    return res.data;
};

export const requestGetBooks = async () => {
    const res = await request.get('/api/books/get-all');
    return res.data;
};

export const requestUploadImages = async (data) => {
    const res = await request.post('/api/books/upload-images', data);
    return res.data;
};

export const requestUpdateBook = async (data) => {
    const res = await request.post('/api/books/update', data);
    return res.data;
};

export const requestDeleteImage = async (data) => {
    const res = await request.post('/api/books/delete-image', data);
    return res.data;
};

export const requestDeleteBook = async (data) => {
    const res = await request.post('/api/books/delete', data);
    return res.data;
};

export const requestGetBookById = async (id) => {
    const res = await request.get(`/api/books/get-by-id`, { params: { id } });
    return res.data;
};

export const requestSearchBook = async (data) => {
    const res = await request.get(`/api/books/search`, { params: data });
    return res.data;
};

export const requestAdmin = async () => {
    const res = await request.get('/api/users/admin');
    return res.data;
};

//// borrowing-cart (refactored from cart)

export const requestCreateCart = async (data) => {
    const res = await request.post('/api/borrowing-cart/add', data);
    return res.data;
};

export const requestGetCart = async () => {
    const res = await request.get('/api/borrowing-cart/get');
    return res.data;
};

export const requestUpdateQuantity = async (data) => {
    const res = await request.put('/api/borrowing-cart/update-quantity', data);
    return res.data;
};

export const requestDeleteItem = async (data) => {
    const res = await request.post('/api/borrowing-cart/remove-item', data);
    return res.data;
};

export const requestUpdateInfoCart = async (data) => {
    const res = await request.post('/api/borrowing-cart/update-info', data);
    return res.data;
};

export const requestUpdateRentalDates = async (data) => {
    const res = await request.put('/api/borrowing-cart/update-dates', data);
    return res.data;
};

/// loans (refactored from payments)
export const requestCreateLoan = async (data) => {
    const res = await request.post('/api/loans/create', data);
    return res.data;
};

export const requestGetLoanById = async (id) => {
    const res = await request.get(`/api/loans/get-by-id`, { params: { id } });
    return res.data;
};

export const requestGetLoansByUserId = async () => {
    const res = await request.get('/api/loans/get-by-user');
    return res.data;
};

export const requestCancelLoan = async (data) => {
    const res = await request.post('/api/loans/cancel', data);
    return res.data;
};

export const requestGetLoansAdmin = async () => {
    const res = await request.get('/api/loans/get-all');
    return res.data;
};

export const requestUpdateLoanStatus = async (data) => {
    const res = await request.post('/api/loans/update-status', data);
    return res.data;
};

export const requestCreateLoanByAdmin = async (data) => {
    const res = await request.post('/api/loans/create-by-admin', data);
    return res.data;
};

export const requestDeleteLoan = async (loanId) => {
    const res = await request.post('/api/loans/delete', { loanId });
    return res.data;
};

/// view book (refactored from view product)
export const requestCreateViewBook = async (data) => {
    const res = await request.post('/api/view-book/create', data);
    return res.data;
};

export const requestGetViewBook = async () => {
    const res = await request.get('/api/view-book/get-view-book');
    return res.data;
};

// users

export const requestGetUsers = async () => {
    const res = await request.get('/api/users/get-users');
    return res.data;
};

export const requestUpdateRoleUser = async (data) => {
    const res = await request.post('/api/users/update-role-user', data);
    return res.data;
};

export const requestCreateUserByAdmin = async (data) => {
    const res = await request.post('/api/users/create-user-by-admin', data);
    return res.data;
};

export const requestResetUserPasswordByAdmin = async (data) => {
    const res = await request.post('/api/users/reset-user-password', data);
    return res.data;
};

export const requestDeleteUser = async (userId) => {
    const res = await request.post('/api/users/delete-user', { userId });
    return res.data;
};

/// dashboard

export const requestDashboard = async (data) => {
    const res = await request.get('/api/users/get-dashboard', { params: data });
    return res.data;
};

export const requestGetOrderStats = async (data) => {
    const res = await request.get('/api/users/get-dashboard', { params: data });
    return res.data;
};

// coupon

export const requestCreateCoupon = async (data) => {
    const res = await request.post('/api/coupon/create', data);
    return res.data;
};

export const requestGetAllCoupons = async () => {
    const res = await request.get('/api/coupon/get-all');
    return res.data;
};

export const requestGetCouponById = async (id) => {
    const res = await request.get('/api/coupon/get-by-id', { params: { id } });
    return res.data;
};

export const requestUpdateCoupon = async (data) => {
    const res = await request.post('/api/coupon/update', data);
    return res.data;
};

export const requestDeleteCoupon = async (id) => {
    const res = await request.post('/api/coupon/delete', { id });
    return res.data;
};

export const requestToggleCouponStatus = async (id) => {
    const res = await request.post('/api/coupon/toggle-status', { id });
    return res.data;
};

export const requestApplyCoupon = async (data) => {
    const res = await request.post('/api/coupon/apply', data);
    return res.data;
};

export const requestIncrementCouponUsage = async (couponId) => {
    const res = await request.post('/api/coupon/increment-usage', { couponId });
    return res.data;
};

let isRefreshing = false;
let failedRequestsQueue = [];

request.interceptors.response.use(
    (response) => response, // Trả về nếu không có lỗi
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || '';
        const isAuthEndpoint =
            requestUrl.includes('/api/users/login') || requestUrl.includes('/api/users/refresh-token');

        // Nếu lỗi 401 (Unauthorized) hoặc 403 (Forbidden) và request chưa từng thử refresh
        if (
            !isAuthEndpoint &&
            window.location.pathname !== '/login' &&
            (error.response?.status === 401 || error.response?.status === 403) &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;

                try {
                    // Gửi yêu cầu refresh token
                    const token = cookies.get('logged');
                    if (!token) {
                        localStorage.clear();
                        window.location.href = '/login';
                        return;
                    }
                    await refreshRequest.post('/api/users/refresh-token');

                    // Xử lý lại tất cả các request bị lỗi 401/403 trước đó
                    failedRequestsQueue.forEach((req) => req.resolve());
                    failedRequestsQueue = [];
                } catch (refreshError) {
                    // Nếu refresh thất bại, đăng xuất
                    failedRequestsQueue.forEach((req) => req.reject(refreshError));
                    failedRequestsQueue = [];
                    localStorage.clear();
                    window.location.href = '/login'; // Chuyển về trang đăng nhập
                } finally {
                    isRefreshing = false;
                }
            }

            // Trả về một Promise để retry request sau khi token mới được cập nhật
            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    resolve: () => {
                        resolve(request(originalRequest));
                    },
                    reject: (err) => reject(err),
                });
            });
        }

        return Promise.reject(error);
    },
);

/// Chatbot
export const requestAskChatbot = async (data) => {
    const res = await request.post('/api/chatbot/ask', data);
    return res.data;
};

export const requestGetPublicFAQs = async (category) => {
    const res = await request.get('/api/chatbot/faqs', { params: { category } });
    return res.data;
};

export const requestGetAnswerById = async (id) => {
    const res = await request.get(`/api/chatbot/answer/${id}`);
    return res.data;
};

// Admin Chatbot
export const requestCreateFAQ = async (data) => {
    const res = await request.post('/api/chatbot/admin/faq', data);
    return res.data;
};

export const requestGetAllFAQs = async (params) => {
    const res = await request.get('/api/chatbot/admin/faqs', { params });
    return res.data;
};

export const requestUpdateFAQ = async (id, data) => {
    const res = await request.put(`/api/chatbot/admin/faq/${id}`, data);
    return res.data;
};

export const requestDeleteFAQ = async (id) => {
    const res = await request.delete(`/api/chatbot/admin/faq/${id}`);
    return res.data;
};

export const requestToggleFAQStatus = async (id) => {
    const res = await request.patch(`/api/chatbot/admin/faq/${id}/toggle`);
    return res.data;
};

export const requestBulkDeleteFAQs = async (ids) => {
    const res = await request.post('/api/chatbot/admin/faqs/bulk-delete', { ids });
    return res.data;
};

export const requestImportFAQs = async (faqs) => {
    const res = await request.post('/api/chatbot/admin/faqs/import', { faqs });
    return res.data;
};

// ============ CHATBOT CONFIG - API KEYS ============
export const requestCreateApiKey = async (data) => {
    const res = await request.post('/api/chatbot/config/api-keys', data);
    return res.data;
};

export const requestGetAllApiKeys = async () => {
    const res = await request.get('/api/chatbot/config/api-keys');
    return res.data;
};

export const requestGetActiveApiKey = async (provider) => {
    const res = await request.get('/api/chatbot/config/api-keys/active', { params: { provider } });
    return res.data;
};

export const requestUpdateApiKey = async (id, data) => {
    const res = await request.put(`/api/chatbot/config/api-keys/${id}`, data);
    return res.data;
};

export const requestDeleteApiKey = async (id) => {
    const res = await request.delete(`/api/chatbot/config/api-keys/${id}`);
    return res.data;
};

export const requestGetApiKeyStats = async (id) => {
    const res = await request.get(`/api/chatbot/config/api-keys/${id}/stats`);
    return res.data;
};

// ============ CHATBOT CONFIG - POLICIES ============
export const requestCreatePolicy = async (data) => {
    const res = await request.post('/api/chatbot/config/policies', data);
    return res.data;
};

export const requestGetAllPolicies = async () => {
    const res = await request.get('/api/chatbot/config/policies');
    return res.data;
};

export const requestGetActivePolicy = async () => {
    const res = await request.get('/api/chatbot/config/policies/active');
    return res.data;
};

export const requestUpdatePolicy = async (id, data) => {
    const res = await request.put(`/api/chatbot/config/policies/${id}`, data);
    return res.data;
};

export const requestDeletePolicy = async (id) => {
    const res = await request.delete(`/api/chatbot/config/policies/${id}`);
    return res.data;
};

// ============ CHATBOT CONFIG - CONTEXT DICTIONARY ============
export const requestAddContextTerm = async (data) => {
    const res = await request.post('/api/chatbot/config/context-terms', data);
    return res.data;
};

export const requestGetAllContextTerms = async (params) => {
    const res = await request.get('/api/chatbot/config/context-terms', { params });
    return res.data;
};

export const requestUpdateContextTerm = async (id, data) => {
    const res = await request.put(`/api/chatbot/config/context-terms/${id}`, data);
    return res.data;
};

export const requestDeleteContextTerm = async (id) => {
    const res = await request.delete(`/api/chatbot/config/context-terms/${id}`);
    return res.data;
};

// Live Chat APIs
export const requestCreateChatRequest = async () => {
    const res = await request.post('/api/live-chat/create-request');
    return res.data;
};

export const requestGetActiveChat = async () => {
    const res = await request.get('/api/live-chat/active');
    return res.data;
};

export const requestSendChatMessage = async (data) => {
    const res = await request.post('/api/live-chat/send-message', data);
    return res.data;
};

export const requestCloseChat = async (data) => {
    const res = await request.post('/api/live-chat/close', data);
    return res.data;
};

export const requestRateChat = async (data) => {
    const res = await request.post('/api/live-chat/rate', data);
    return res.data;
};

export const requestGetWaitingChats = async () => {
    const res = await request.get('/api/live-chat/waiting');
    return res.data;
};

export const requestAcceptChat = async (data) => {
    const res = await request.post('/api/live-chat/accept', data);
    return res.data;
};

export const requestGetLibrarianChats = async () => {
    const res = await request.get('/api/live-chat/my-chats');
    return res.data;
};

export const requestMarkChatAsRead = async (data) => {
    const res = await request.post('/api/live-chat/mark-read', data);
    return res.data;
};

// Banner APIs
export const requestGetBanners = async () => {
    const res = await request.get('/api/banner/get-banners');
    return res.data;
};

export const requestGetAllBanners = async () => {
    const res = await request.get('/api/banner/admin/get-all-banners');
    return res.data;
};

export const requestGetBannerById = async (id) => {
    const res = await request.get(`/api/banner/get-banner-by-id/${id}`);
    return res.data;
};

export const requestUploadBannerImage = async (formData) => {
    const res = await request.post('/api/banner/admin/upload-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const requestCreateBanner = async (data) => {
    const res = await request.post('/api/banner/admin/create', data);
    return res.data;
};

export const requestUpdateBanner = async (id, data) => {
    const res = await request.put(`/api/banner/admin/update/${id}`, data);
    return res.data;
};

export const requestDeleteBanner = async (id) => {
    const res = await request.delete(`/api/banner/admin/delete/${id}`);
    return res.data;
};

export const requestToggleBannerStatus = async (id) => {
    const res = await request.patch(`/api/banner/admin/toggle-status/${id}`);
    return res.data;
};

export const requestUpdateBannerOrder = async (data) => {
    const res = await request.post('/api/banner/admin/update-order', data);
    return res.data;
};

// Animated Headline APIs
export const requestGetHeadlines = async () => {
    const res = await request.get('/api/headline/get-headlines');
    return res.data;
};

export const requestGetAllHeadlines = async () => {
    const res = await request.get('/api/headline/admin/get-all-headlines');
    return res.data;
};

export const requestGetHeadlineById = async (id) => {
    const res = await request.get(`/api/headline/admin/get-headline/${id}`);
    return res.data;
};

export const requestCreateHeadline = async (data) => {
    const res = await request.post('/api/headline/admin/create', data);
    return res.data;
};

export const requestUpdateHeadline = async (id, data) => {
    const res = await request.put(`/api/headline/admin/update/${id}`, data);
    return res.data;
};

export const requestDeleteHeadline = async (id) => {
    const res = await request.delete(`/api/headline/admin/delete/${id}`);
    return res.data;
};

export const requestToggleHeadlineStatus = async (id) => {
    const res = await request.patch(`/api/headline/admin/toggle-status/${id}`);
    return res.data;
};

// Policy APIs
export const requestGetPolicies = async () => {
    const res = await request.get('/api/policy/get-policies');
    return res.data;
};

export const requestGetAllHomePolicies = async () => {
    const res = await request.get('/api/policy/admin/get-all-policies');
    return res.data;
};

export const requestGetHomePolicyById = async (id) => {
    const res = await request.get(`/api/policy/admin/get-policy/${id}`);
    return res.data;
};

export const requestCreateHomePolicy = async (data) => {
    const res = await request.post('/api/policy/admin/create', data);
    return res.data;
};

export const requestUpdateHomePolicy = async (id, data) => {
    const res = await request.put(`/api/policy/admin/update/${id}`, data);
    return res.data;
};

export const requestDeleteHomePolicy = async (id) => {
    const res = await request.delete(`/api/policy/admin/delete/${id}`);
    return res.data;
};

export const requestToggleHomePolicyStatus = async (id) => {
    const res = await request.patch(`/api/policy/admin/toggle-status/${id}`);
    return res.data;
};
