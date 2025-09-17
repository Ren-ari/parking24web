import { useState, useEffect } from 'react';
import {
    validateLogin,
    checkAutoLogin,
    startSessionTimeout,
    clearSessionTimeout,
    logout as authLogout
} from '../components/auth';

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 세션 타임아웃 핸들러
    const handleSessionTimeout = () => {
        handleLogout();
        alert('세션이 만료되어 로그아웃됩니다.');
    };

    // 컴포넌트 마운트 시 자동 로그인 체크
    useEffect(() => {
        const autoLoginCheck = checkAutoLogin();

        if (autoLoginCheck.success) {
            setUser(autoLoginCheck.user);
            setIsAuthenticated(true);

            // 세션 타임아웃 시작
            startSessionTimeout(handleSessionTimeout);

            console.log('자동 로그인 성공:', autoLoginCheck.user.name);
        } else {
            console.log('자동 로그인 실패:', autoLoginCheck.error);
        }

        setIsLoading(false);
    }, []);

    // 로그인 처리
    const handleLogin = (userInfo) => {
        console.log('로그인 시도:', userInfo.username);
        // 이미 LoginPage에서 검증 완료된 user 객체가 옴
        setUser(userInfo);
        setIsAuthenticated(true);
        // 세션 타임아웃 시작
        startSessionTimeout(handleSessionTimeout);
        console.log('로그인 성공:', userInfo.name, '권한:', userInfo.role);
        return true;
    };

    // 로그아웃 처리
    const handleLogout = () => {
        authLogout(); // authSystem의 logout 함수 호출
        clearSessionTimeout(); // 세션 타임아웃 정리
        setUser(null);
        setIsAuthenticated(false);
        console.log('로그아웃 완료');
    };

    // 사용자 권한 체크 함수들
    const hasPermission = (component) => {
        if (!user || !user.permissions) return false;
        return user.permissions.includes(component);
    };

    const isAdmin = () => user?.role === 'admin';
    const isService = () => user?.role === 'service';
    const isClient = () => user?.role === 'client';

    return {
        // 상태
        isAuthenticated,
        user,
        isLoading,

        // 액션
        handleLogin,
        handleLogout,

        // 권한 체크
        hasPermission,
        isAdmin,
        isService,
        isClient
    };
};