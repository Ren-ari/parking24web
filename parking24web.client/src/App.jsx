import './index.css';
import PLCControl from './components/PLCControl';
import LoginPage from './components/LoginPage';
import './App.css';
import { useState } from 'react';

document.body.style.fontFamily = "'Noto Sans KR', sans-serif";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleLogin = (credentials) => {
        console.log('Login credentials:', credentials);
        // 실제 인증 로직 구현
        setIsAuthenticated(true);
    };

    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div className="App">
            <PLCControl />
        </div>
    );
}
export default App;