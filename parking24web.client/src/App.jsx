import './index.css';
import PLCControl from './components/PLCControl';
import LoginPage from './components/LoginPage';
import './App.css';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
// 커스텀 인증 훅 import
import { useAuth } from './hooks/useAuth';

document.body.style.fontFamily = "'Noto Sans KR', sans-serif";

function App() {
    // useAuth 훅으로 모든 인증 로직 처리
    const {
        isAuthenticated,
        user,
        isLoading,
        handleLogin,
        handleLogout
    } = useAuth();

    // 자동 로그인 체크 중
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">시스템 초기화 중...</p>
                </div>
            </div>
        );
    }

    // 인증되지 않은 경우 로그인 페이지 표시
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

    // 인증된 경우 메인 앱 표시
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="App"
        >
            {/* 사용자 정보를 PLCControl에 props로 전달 */}
            <PLCControl
                currentUser={user}
                onLogout={handleLogout}
            />
        </motion.div>
    );
}

export default App;