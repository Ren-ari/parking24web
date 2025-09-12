import './index.css';
import PLCControl from './components/PLCControl';
import LoginPage from './components/LoginPage';
import './App.css';
import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

document.body.style.fontFamily = "'Noto Sans KR', sans-serif";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleLogin = (credentials) => {
        console.log('Login credentials:', credentials);
        // 실제 인증 로직 구현
        setIsAuthenticated(true);
    };

    if (!isAuthenticated) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <LoginPage onLogin={handleLogin} />
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="App"
        >
            <PLCControl />
        </motion.div>
    );
}
export default App;