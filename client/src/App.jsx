import './App.css';
import HeaderNew from './Components/Header/HeaderNew';
import HomePage from './Components/HomePage/HomePage';
import Footer from './Components/Footer/Footer';
import Chatbot from './Components/Chatbot/Chatbot';

function App() {
    return (
        <div className="w-full">
            <header>
                <HeaderNew />
            </header>

            <main className="w-full">
                <HomePage />
            </main>

            <footer>
                <Footer />
            </footer>

            {/* Chatbot floating button */}
            <Chatbot />
        </div>
    );
}

export default App;
