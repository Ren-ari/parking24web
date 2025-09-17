import React, { useState } from 'react';
import './LoginPage.css';
import { validateLogin } from './auth';

const LoginPage = ({ onLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [isFormSuccess, setIsFormSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({
        username: '',
        password: ''
    }); // 필드별 에러 상태 추가

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // 실시간 밸리데이션
        setFieldErrors(prev => ({
            ...prev,
            [name]: validateField(name, value)
        }));

        // 전체 에러 메시지 클리어 (사용자가 입력 중이면)
        if (error) {
            setError('');
        }
    };

    // 필드별 밸리데이션 함수
    const validateField = (name, value) => {
        switch (name) {
            case 'username':
                if (!value.trim()) return '사용자명을 입력해주세요';
                return '';
            case 'password':
                if (!value.trim()) return '비밀번호를 입력해주세요';
                return '';
            default:
                return '';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(''); // 에러 초기화

        // 사전 밸리데이션 체크
        const usernameError = validateField('username', formData.username);
        const passwordError = validateField('password', formData.password);

        if (usernameError || passwordError) {
            setFieldErrors({
                username: usernameError,
                password: passwordError
            });
            setError('입력 정보를 확인해주세요.');
            return;
        }

        setIsLoading(true); // 로딩 시작
        console.log('로그인 시도:', formData.username); // 디버깅

        // 실제로는 API 호출이므로 약간의 딜레이 시뮬레이션
        setTimeout(() => {
            try {
                const result = validateLogin(formData.username, formData.password);
                console.log('validateLogin 결과:', result); // 디버깅
                setIsLoading(false); // 로딩 끝

                if (result.success) {
                    // 성공 애니메이션
                    const form = document.querySelector('.form');
                    if (form) {
                        form.style.transition = 'opacity 0.5s ease-out';
                        form.style.opacity = '0';

                        setTimeout(() => {
                            setIsFormSuccess(true);
                            console.log('로그인 성공:', result.user);

                            setTimeout(() => {
                                onLogin(result.user);
                            }, 1000);
                        }, 500);
                    }
                } else {
                    // 실패 시 에러만 표시 (애니메이션 없음)
                    setError(result.error);
                }
            } catch (error) {
                console.error('로그인 처리 중 에러:', error); // 디버깅
                setIsLoading(false);
                setError('로그인 처리 중 오류가 발생했습니다.');
            }
        }, 300); // API 호출 시뮬레이션
    };

    return (
        <div className={`wrapper ${isFormSuccess ? 'form-success' : ''}`}>
            <video
                className="background-video"
                autoPlay
                muted
                loop
                playsInline
            >
                <source src="/video/background.mp4" type="video/mp4" />
            </video>

            <div className="container">
                <h1>EPSAI</h1>

                <form className="form" onSubmit={handleSubmit}>
                    {error && <div className="error-message">{error}</div>}
                    <div className="input-group">
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className={fieldErrors.username ? 'error-input' : ''}
                        />
                        {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className={fieldErrors.password ? 'error-input' : ''}
                        />
                        {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
                    </div>
                    <button type="submit" id="login-button" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <span className="loading-spinner"></span>
                                로그인 중...
                            </>
                        ) : 'Login'}
                    </button>
                </form>
            </div>

        </div>
    );
};

export default LoginPage;
