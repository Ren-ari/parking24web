import React, { useState, useEffect } from 'react';
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
    });
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');
    const [particles, setParticles] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // 실시간 시계 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 파티클 효과 생성 - 그라데이션 색상들
    useEffect(() => {
        const colors = ['#9333ea', '#3b82f6', '#4338ca']; // 보라색, 파란색, 인디고
        const generateParticles = () => {
            const newParticles = [];
            for (let i = 0; i < 100; i++) { // 더 많이 생성
                newParticles.push({
                    id: i,
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    size: Math.random() * 4 + 1, // 크기 다양화
                    speed: Math.random() * 3 + 0.5, // 속도 다양화
                    opacity: Math.random() * 0.8 + 0.2, // 더 선명하게
                    color: colors[Math.floor(Math.random() * colors.length)] // 그라데이션 색상들
                });
            }
            setParticles(newParticles);
        };

        generateParticles();
        const interval = setInterval(() => {
            setParticles(prev => prev.map(particle => ({
                ...particle,
                y: particle.y > window.innerHeight ? -10 : particle.y + particle.speed,
                x: particle.x + (Math.random() - 0.5) * 1 // 더 활발한 움직임
            })));
        }, 30); // 더 빠른 업데이트

        return () => clearInterval(interval);
    }, []);

    // 파티클 효과 함수들
    const createParticle = (x, y, type) => {
        const particle = document.createElement('particle');
        document.body.appendChild(particle);

        const size = Math.floor(Math.random() * 20 + 5);

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        const destinationX = x + (Math.random() - 0.5) * 2 * 75;
        const destinationY = y + (Math.random() - 0.5) * 2 * 75;

        // 제목과 비슷한 색상들 (보라색, 파란색, 인디고)
        const colors = ['#9333ea', '#3b82f6', '#4338ca'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        switch (type) {
            case "square":
                particle.style.background = randomColor;
                particle.style.borderRadius = "50%";
                particle.style.border = "1px solid white";
                break;
            case "circle":
                particle.style.background = randomColor;
                particle.style.borderRadius = "50%";
                break;
            default:
                particle.style.background = randomColor;
                particle.style.borderRadius = "50%";
        }

        const animation = particle.animate(
            [
                {
                    transform: `translate(${x - size / 2}px, ${y - size / 2}px)`,
                    opacity: 1,
                },
                {
                    transform: `translate(${destinationX}px, ${destinationY}px)`,
                    opacity: 0,
                },
            ],
            {
                duration: 500 + Math.random() * 1000,
                easing: "cubic-bezier(0, .9, .57, 1)",
                delay: Math.random() * 200,
            }
        );

        animation.onfinish = () => {
            particle.remove();
        };
    };

    const pop = (e) => {
        for (let i = 0; i < 30; i++) {
            createParticle(e.clientX, e.clientY, e.target.dataset.type);
        }
    };

    // 버튼 클릭 이벤트 리스너 추가
    useEffect(() => {
        const buttons = document.querySelectorAll('.login-button');
        buttons.forEach((button) => {
            button.addEventListener('click', pop);
        });

        return () => {
            buttons.forEach((button) => {
                button.removeEventListener('click', pop);
            });
        };
    }, []);

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

                            // 화면 줌 리셋
                            const resetZoom = () => {
                                // 모든 input 필드에서 포커스 제거
                                const activeElement = document.activeElement;
                                if (activeElement && activeElement.blur) {
                                    activeElement.blur();
                                }
                                
                                // 화면 줌 리셋
                                setTimeout(() => {
                                    window.scrollTo(0, 0);
                                    document.body.style.zoom = '1';
                                    document.body.style.transform = 'scale(1)';
                                    
                                    // 뷰포트 리셋
                                    const viewport = document.querySelector('meta[name="viewport"]');
                                    if (viewport) {
                                        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                                    }
                                }, 100);
                            };

                            resetZoom();

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

    const formatTime = (date) => {
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    return (
        <div className={`wrapper ${isFormSuccess ? 'form-success' : ''}`}>
            {/* 배경 비디오 */}
            <video
                className="background-video"
                autoPlay
                muted
                loop
                playsInline
            >
                <source src="/video/background.mp4" type="video/mp4" />
            </video>

            {/* 파티클 효과 - 그라데이션 색상들 */}
            <div className="particles-container">
                {particles.map(particle => (
                    <div
                        key={particle.id}
                        className="particle"
                        style={{
                            left: `${particle.x}px`,
                            top: `${particle.y}px`,
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            opacity: particle.opacity,
                            backgroundColor: particle.color,
                            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
                        }}
                    />
                ))}
            </div>

            {/* 메인 컨테이너 */}
            <div className="container">

                {/* 로고 및 타이틀 */}
                <div className="logo-section">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <svg viewBox="0 0 100 100" className="logo-svg">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2"/>
                                <path d="M30 50 L45 35 L70 60 L85 45" stroke="currentColor" strokeWidth="3" fill="none"/>
                                <circle cx="30" cy="50" r="4" fill="currentColor"/>
                                <circle cx="45" cy="35" r="4" fill="currentColor"/>
                                <circle cx="70" cy="60" r="4" fill="currentColor"/>
                                <circle cx="85" cy="45" r="4" fill="currentColor"/>
                            </svg>
                        </div>
                        <h1 className="main-title">
                            <span className="title-text">EPSAI</span>
                            <span className="title-subtitle">Parking Management System</span>
                        </h1>
                    </div>
                </div>

                {/* 로그인 폼 */}
                <form className="form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message">
                            <svg className="error-icon" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="input-group">
                        <div className="input-wrapper">
                            <div className="input-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                            <input
                                type="text"
                                name="username"
                                placeholder="사용자명을 입력하세요"
                                value={formData.username}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('username')}
                                onBlur={() => setFocusedField('')}
                                disabled={isLoading}
                                className={`${focusedField === 'username' ? 'focused' : ''}`}
                            />
                            <div className="input-border"></div>
                        </div>
                        {fieldErrors.username && (
                            <div className="field-error">
                                <svg className="field-error-icon" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                {fieldErrors.username}
                            </div>
                        )}
                    </div>

                    <div className="input-group">
                        <div className="input-wrapper">
                            <div className="input-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                                </svg>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="비밀번호를 입력하세요"
                                value={formData.password}
                                onChange={handleInputChange}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField('')}
                                disabled={isLoading}
                                className={`${focusedField === 'password' ? 'focused' : ''}`}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24">
                                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                    </svg>
                                )}
                            </button>
                            <div className="input-border"></div>
                        </div>
                        {fieldErrors.password && (
                            <div className="field-error">
                                <svg className="field-error-icon" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                {fieldErrors.password}
                            </div>
                        )}
                    </div>

                    <button type="submit" className="login-button" disabled={isLoading} data-type="square">
                        {isLoading ? "로그인 중..." : "로그인"}
                    </button>
                </form>

                {/* 하단 정보 */}
                <div className="footer-info">
                    <div className="version-info">v1.0.0</div>
                    <div className="copyright">© 2025 EPSAI Parking System</div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
