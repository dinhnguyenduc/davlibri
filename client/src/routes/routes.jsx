import App from '../App';
import CartUser from '../Page/CartUser';
import DetailProduct from '../Page/DetailProduct';
import LoginUser from '../Page/Login';
import Register from '../Page/Register';
import Checkout from '../Page/Checkout';
import InfoUser from '../Page/infoUser';
import Dashboard from '../Page/Admin/Index';
import PaymentsSuccess from '../Page/PaymentsSuccess';
import ForgotPassword from '../Page/ForgotPassword';
import AIChatPage from '../Page/AIChatPage';
import PaymentDemo from '../Page/PaymentDemo';
import LoanPaymentSuccess from '../Page/LoanPaymentSuccess';
import About from '../Page/About';
import Pricing from '../Page/Pricing';
import Bookshelf from '../Page/Bookshelf';
import Products from '../Page/Products';
import Blog from '../Page/Blog';
import Wishlist from '../Page/Wishlist';
import Guide from '../Page/Guide';

export const routes = [
    { path: '/', component: <App /> },
    {
        path: '/login',
        component: <LoginUser />,
    },
    {
        path: '/register',
        component: <Register />,
    },
    {
        path: '/book/:id',
        component: <DetailProduct />,
    },
    {
        path: '/cart',
        component: <CartUser />,
    },
    {
        path: '/checkout',
        component: <Checkout />,
    },
    {
        path: '/info-user',
        component: <InfoUser />,
    },
    {
        path: '/admin',
        component: <Dashboard />,
    },
    {
        path: '/payments/:id',
        component: <PaymentsSuccess />,
    },
    {
        path: '/loan/:id',
        component: <LoanPaymentSuccess />,
    },
    {
        path: '/payment-demo',
        component: <PaymentDemo />,
    },
    {
        path: '/forgot-password',
        component: <ForgotPassword />,
    },
    {
        path: '/ai-chat',
        component: <AIChatPage />,
    },
    {
        path: '/about',
        component: <About />,
    },
    {
        path: '/packages',
        component: <Pricing />,
    },
    {
        path: '/products',
        component: <Products />,
    },
    {
        path: '/bookshelf',
        component: <Bookshelf />,
    },
    {
        path: '/blog',
        component: <Blog />,
    },
    {
        path: '/wishlist',
        component: <Wishlist />,
    },
    {
        path: '/guide',
        component: <Guide />,
    },
];
