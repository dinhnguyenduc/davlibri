import './App.css';
import Header from './Components/Header/Header';
import HomePage from './Components/HomePage/HomePage';
import Footer from './Components/Footer/Footer';
import Chatbot from './Components/Chatbot/Chatbot';

function App() {
    return (
        <div className="w-full">
            <header>
                <Header />
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
