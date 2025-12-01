import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { usePLCConnection } from '../hooks/usePLCConnection';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import ConnectionPanel from './ConnectionPanel';
import SensorMonitor from './SensorMonitor';
import ManualControl from './ManualControl';
import ParkingMonitor from './ParkingMonitor';
import EventMonitor from './EventMonitor';
import ServiceRecordTab from './ServiceRecordTab';
const CCTVMonitor = React.lazy(() => import('./CCTVMonitor'));
import signalRService from '../services/signalrService';
// 속초 1호기 config import 추가
import siteConfig from '../../config/sokcho2Config.js';
import { ROLE_TABS } from './auth';
import './PLCControl.css';

const PLCControl = ({ currentUser, onLogout }) => {
    const { isClient } = useAuth();
    const { theme, isSpaceTheme, setTheme } = useTheme();
    const rotateTheme = useCallback(() => {
        setTheme(theme === 'space' ? 'light' : 'space');
    }, [theme, setTheme]);
    
    // 탭 ID 매핑 테이블 (ROLE_TABS -> PLCControl 탭)
    const TAB_MAPPING = {
        'parking': 'parking',      // 주차 현황
        'events': 'events',        // 입출차 이벤트
        'service': 'service',
        'cctv': 'cctv',
        'manual': 'control',       // 수동 제어  
        'sensor': 'monitor',       // 센서 모니터
        'config': 'connection'     // 연결 관리 (설정)
    };

    // 사용자 권한에 따른 허용된 탭들 계산
    const allowedTabs = useMemo(() => {
        if (!currentUser || !currentUser.role) return [];

        const userTabs = ROLE_TABS[currentUser.role] || [];
        return userTabs.map(tab => ({
            id: TAB_MAPPING[tab.id],
            name: tab.name,
            originalId: tab.id
        })).filter(tab => tab.id); // 매핑되지 않은 탭 제외
    }, [currentUser]);

    // 첫 번째 허용된 탭을 기본값으로 설정
    const getDefaultTab = () => {
        if (allowedTabs.length === 0) return 'parking';

        // Client는 events를 기본으로
        if (currentUser?.role === 'client') {
            return 'events';
        }

        // admin/service는 connection을 기본으로
        if (currentUser?.role === 'admin' || currentUser?.role === 'service') {
            return 'connection';
        }

        return allowedTabs[0].id;
    };

    const defaultTab = getDefaultTab();
    const [activeTab, setActiveTab] = useState(defaultTab);

    const [isDataPanelExpanded, setIsDataPanelExpanded] = useState(true);
    // 역할 기반 고정 모드: client=요약, 그 외(관리자/서비스 등)=상세
    const isSummaryMode = currentUser?.role === 'client';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(1);

    // PLC 연결 훅 사용
    const {
        isSignalRConnected,
        isPLCConnected,
        isConnecting,
        isAuthenticated,
        error,
        sensorData,
        plcConfig,
        setPLCConfig,
        connectToPLC,
        disconnectFromPLC,
        clearError
    } = usePLCConnection();

    // 모바일 메뉴 애니메이션 타이머 관리
    useEffect(() => {
        if (!isClosing || !pendingAction) return;

        const timer = setTimeout(() => {
            pendingAction.action();
            setPendingAction(null);
            setIsClosing(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [isClosing, pendingAction]);

    // 권한 체크 함수
    const hasTabAccess = (tabId) => {
        return allowedTabs.some(tab => tab.id === tabId);
    };

    // 차량번호 편집 핸들러
    const handleVehicleEdit = async (address, value, description) => {
        try {
            const deviceType = address.substring(0, 1);
            const addressNum = parseInt(address.substring(1));

            const result = await signalRService.writeAddress(deviceType, addressNum, value);

            if (result.success) {
                console.log(`${description} 편집 완료: ${address} = ${value}`);
            } else {
                alert(`편집 실패: ${result.error || '알 수 없는 오류'}`);
            }
        } catch (error) {
            console.error('차량번호 편집 오류:', error);
            alert('편집 중 오류가 발생했습니다.');
        }
    };

    // 모바일 메뉴 탭 클릭 핸들러
    const handleMobileTabClick = (tabName) => {
        if (!hasTabAccess(tabName)) return; // 권한 없으면 무시

        setIsClosing(true);
        setPendingAction({
            action: () => {
                setActiveTab(tabName);
                setIsMobileMenuOpen(false);
            }
        });
    };

    // 탭 클릭 핸들러 (권한 체크 포함)
    const handleTabClick = (tabId) => {
        if (!hasTabAccess(tabId)) return; // 권한 없으면 무시
        setActiveTab(tabId);
    };

    // 테마에 따른 스타일 메모이제이션
    const mainBackgroundClass = useMemo(() => 
        theme === 'space'
            ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-black'
            : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    , [theme]);

    const headerClass = useMemo(() => 
        theme === 'space'
            ? 'bg-transparent border-gray-700'
            : 'bg-white border-gray-200'
    , [theme]);

    const headerStyle = useMemo(() => {
        if (theme === 'space') {
            return {
                background: 'rgba(20, 20, 20, 0.95)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)'
            };
        }
        return {};
    }, [theme]);

    const statusTextColorClass = useMemo(() => 
        theme === 'space' ? 'text-gray-300' : 'text-gray-700'
    , [theme]);

    const userBorderClass = useMemo(() => 
        theme === 'space' ? 'border-gray-600' : 'border-gray-200'
    , [theme]);

    const userNameColorClass = useMemo(() => 
        theme === 'space' ? 'text-gray-200' : 'text-gray-800'
    , [theme]);

    const userDescColorClass = useMemo(() => 
        theme === 'space' ? 'text-gray-400' : 'text-gray-500'
    , [theme]);

    const dataPanelBorderClass = useMemo(() => 
        theme === 'space' ? 'border border-gray-600/30' : 'border border-white/20'
    , [theme]);

    const dataPanelStyle = useMemo(() => 
        theme === 'space'
            ? { background: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)' }
            : { background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)' }
    , [theme]);

    const dataPanelHeaderStyle = useMemo(() => 
        theme === 'space'
            ? { background: 'rgba(20, 20, 20, 0.95)', borderBottom: '1px solid rgba(75, 85, 99, 0.3)' }
            : { background: 'rgba(255, 255, 255, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.3)' }
    , [theme]);

    const dataPanelContentStyle = useMemo(() => 
        theme === 'space'
            ? { background: 'rgba(20, 20, 20, 0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
            : { background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
    , [theme]);

    const glassmorphismClass = useMemo(() => 
        theme === 'space'
            ? 'bg-gradient-to-br from-gray-800/5 via-gray-700/3 to-gray-600/2'
            : 'bg-gradient-to-br from-white/5 via-white/3 to-white/2'
    , [theme]);

    const cardLabelColorClass = useMemo(() => 
        theme === 'space' ? 'text-white' : 'text-blue-700'
    , [theme]);

    const cardValueColorClass = useMemo(() => 
        theme === 'space' ? 'text-purple-800' : 'text-purple-900'
    , [theme]);

    // 탭 스타일 - 화려한 애니메이션 적용
    const getTabStyle = (tabName) => {
        const baseStyle = "relative px-8 py-4 font-bold rounded-2xl transition-all duration-300 ease-in-out text-sm transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl border-2";

        // 권한 없는 탭은 숨김
        if (!hasTabAccess(tabName)) {
            return `${baseStyle} hidden`;
        }

        if (activeTab === tabName) {
            if (theme === 'space') {
                return `${baseStyle} bg-gradient-to-br from-purple-800 via-purple-700 to-purple-900 text-white shadow-2xl border-purple-500 hover:from-purple-700 hover:via-purple-600 hover:to-purple-800`;
            }
            return `${baseStyle} bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-2xl border-blue-300 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700`;
        }
        // 비활성 탭 스타일을 테마에 따라 변경
        return getInactiveTabStyle(baseStyle);
    };

    // 테마에 따른 비활성 탭 스타일
    const getInactiveTabStyle = (baseStyle) => {
        return theme === 'space'
            ? `${baseStyle} bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700 hover:text-gray-200 border-gray-600 hover:border-purple-400 hover:shadow-lg`
            : `${baseStyle} bg-gradient-to-r from-white to-gray-50 text-gray-600 hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 border-gray-200 hover:border-blue-300 hover:shadow-lg`;
    };

    return (
        <>
            {/* 상단 네비게이션 헤더 - 완전 전체 화면 너비 */}
            <header className={`shadow-lg border-b fixed top-0 left-0 right-0 w-full z-50 ${headerClass}`} style={headerStyle}>
                <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3">
                    {/* 로고/제목 (왼쪽) */}
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 cursor-pointer" onClick={rotateTheme} title="테마 전환 (라이트/우주)">
                    <div className="w-28 sm:w-44 h-10 transform hover:scale-105 transition-all duration-300">
                    <img src={theme === 'space' ? "/Primary white.png" : "/Primary black.png"} alt="EPSAI Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>

                    {/* 탭 네비게이션 (중앙) - 데스크톱용만 */}
                    <nav className="hidden xl:flex space-x-4 flex-1 justify-center max-w-6xl transform translate-x-16">
                        {/* 연결 관리 - config 권한 */}
                        {hasTabAccess('connection') && (
                            <button
                                onClick={() => handleTabClick('connection')}
                                className={`${getTabStyle('connection')} group overflow-hidden`}
                            >
                                <span className="relative z-10">연결 관리</span>
                            </button>
                        )}

                        {/* 센서 모니터 - sensor 권한 */}
                        {hasTabAccess('monitor') && (
                            <button
                                onClick={() => handleTabClick('monitor')}
                                className={`${getTabStyle('monitor')} group overflow-hidden`}
                            >
                                <span className="relative z-10">센서 모니터</span>
                            </button>
                        )}

                        {/* 수동 제어 - manual 권한 */}
                        {hasTabAccess('control') && (
                            <button
                                onClick={() => handleTabClick('control')}
                                className={`${getTabStyle('control')} group overflow-hidden`}
                            >
                                <span className="relative z-10">수동 제어</span>
                            </button>
                        )}

                        {/* 주차장 모니터 - parking 권한 (모든 사용자) */}
                        {hasTabAccess('parking') && (
                            <button
                                onClick={() => handleTabClick('parking')}
                                className={`${getTabStyle('parking')} group overflow-hidden`}
                            >
                                <span className="relative z-10">주차장 모니터</span>
                            </button>
                        )}

                        {/* 입출차 이벤트 - events 권한 */}
                        {hasTabAccess('events') && (
                            <button
                                onClick={() => handleTabClick('events')}
                                className={`${getTabStyle('events')} group overflow-hidden`}
                            >
                                <span className="relative z-10">입출차 이벤트</span>
                            </button>
                        )}

                        {/* A/S 기록 - service 권한 */}
                        {hasTabAccess('service') && (
                            <button
                                onClick={() => handleTabClick('service')}
                                className={`${getTabStyle('service')} group overflow-hidden`}
                            >
                                <span className="relative z-10">A/S 기록</span>
                            </button>
                        )}

                        {/* CCTV - cctv 권한 */}
                        {hasTabAccess('cctv') && (
                            <button
                                onClick={() => handleTabClick('cctv')}
                                className={`${getTabStyle('cctv')} group overflow-hidden`}
                            >
                                <span className="relative z-10">CCTV</span>
                            </button>
                        )}

                    </nav>

                    {/* 사용자 정보 & 로그아웃 (오른쪽) - 데스크톱용만 */}
                    <div className="hidden xl:flex items-center space-x-4 flex-shrink-0">
                        
                        {/* 상태 표시 */}
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isSignalRConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={`text-sm font-medium ${statusTextColorClass}`}>SignalR</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isPLCConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={`text-sm font-medium ${statusTextColorClass}`}>PLC</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span className={`text-sm font-medium ${statusTextColorClass}`}>인증</span>
                            </div>
                        </div>

                        {/* 사용자 정보 */}
                        {currentUser && (
                            <div className={`flex items-center space-x-3 border-l pl-4 ${userBorderClass}`}>
                                <div className="text-right">
                                    <div className={`text-sm font-semibold ${userNameColorClass}`}>{currentUser.name}</div>
                                    <div className={`text-xs ${userDescColorClass}`}>{currentUser.description}</div>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-2xl transition-colors duration-200"
                                >
                                    로그아웃
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 모바일/태블릿 햄버거 메뉴 (오른쪽) */}
                    <div className="xl:hidden flex items-center space-x-2 flex-shrink-0">
                        {/* 모바일 사용자 정보 */}
                        {currentUser && (
                            <div className="text-right mr-2">
                                <div className={`text-sm font-semibold ${userNameColorClass}`}>{currentUser.name}</div>
                                <div className="text-xs text-gray-500">{currentUser.role}</div>
                            </div>
                        )}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('햄버거 버튼 클릭됨, 현재 상태:', isMobileMenuOpen);
                                if (isMobileMenuOpen) {
                                    setIsClosing(true);
                                    setPendingAction({
                                        action: () => setIsMobileMenuOpen(false)
                                    });
                                } else {
                                    setIsMobileMenuOpen(true);
                                }
                            }}
                            onTouchStart={(e) => {
                                e.currentTarget.style.transform = 'scale(0.9)';
                                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                            }}
                            onTouchEnd={(e) => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.backgroundColor = '';
                            }}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative z-[70] active:scale-90 transition-transform duration-150 hamburger-button"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

            </header>

            {/* 모바일/태블릿 탭 메뉴 - 헤더 밖에서 전체 화면 오버레이로 렌더링 */}
            {isMobileMenuOpen && (
                <div className={`fixed inset-x-0 bottom-0 top-16 xl:hidden z-[40] overflow-y-auto mobile-menu-overlay ${isSpaceTheme ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-black' : 'mobile-menu-bg'} transition-all duration-300 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                    {/* 우주 테마 전용 배경 효과들 */}
                    {isSpaceTheme && (
                        <>
                            {/* 어둡기 오버레이 */}
                            <div className="absolute inset-0 pointer-events-none space-dark-overlay"></div>
                            
                            {/* 우주 네뷸라 효과 */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className="absolute top-1/6 left-1/6 w-64 h-64 bg-purple-800/15 rounded-full blur-3xl animate-pulse"></div>
                                <div className="absolute bottom-1/6 right-1/6 w-48 h-48 bg-indigo-700/12 rounded-full blur-3xl animate-pulse space-nebula-delay-2s"></div>
                                <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl animate-pulse space-nebula-delay-4s"></div>
                            </div>

                            {/* 별들 */}
                            <div className="absolute inset-0 pointer-events-none">
                                {Array.from({ length: 60 }, (_, i) => {
                                    const seed = i * 97.3;
                                    const x = (Math.sin(seed) * 50 + 50) % 100;
                                    const y = (Math.cos(seed * 0.7) * 50 + 50) % 100;
                                    const size = Math.abs(Math.sin(seed * 1.1)) * 2 + 1;
                                    const opacity = Math.abs(Math.cos(seed * 0.9)) * 0.6 + 0.3;
                                    const delay = Math.abs(Math.sin(seed * 0.6)) * 5;
                                    return (
                                        <div
                                            key={`menu-star-${i}`}
                                            className="absolute animate-twinkle"
                                            style={{
                                                left: `${x}%`,
                                                top: `${y}%`,
                                                width: `${size}px`,
                                                height: `${size}px`,
                                                backgroundColor: 'white',
                                                borderRadius: '50%',
                                                opacity: opacity,
                                                animationDelay: `${delay}s`,
                                                boxShadow: `0 0 ${size * 3}px rgba(255,255,255,${opacity * 0.5})`
                                            }}
                                        />
                                    );
                                })}
                            </div>

                            {/* 코너 어둡기 */}
                            <div className="absolute inset-0 pointer-events-none corner-dark-top-right"></div>
                            <div className="absolute inset-0 pointer-events-none corner-dark-bottom-left"></div>
                        </>
                    )}
                    <div className="h-full flex items-start justify-center p-4 pt-6 relative z-10">
                        <div className={`w-full max-w-md md:max-w-lg transform transition-all duration-500 ease-out ${isClosing ? 'animate-out slide-out-to-top-8 fade-out-0' : 'animate-in slide-in-from-top-8 fade-in-0'}`}>
                            {/* 권한에 따른 동적 그리드 - 모바일/태블릿 모두 2열 */}
                            <nav className={`grid gap-4 md:gap-6 w-full grid-cols-2`}>
                                {allowedTabs.map((tab, index) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleMobileTabClick(tab.id)}
                                        onTouchStart={(e) => {
                                            e.currentTarget.style.transform = 'scale(0.95)';
                                        }}
                                        onTouchEnd={(e) => {
                                            e.currentTarget.style.transform = '';
                                        }}
                                        className={`tab-button-animated ${isClosing ? 'closing' : ''} ${isSpaceTheme
                                            ? `${activeTab === tab.id
                                                ? 'bg-purple-700 text-white border-purple-300 ring-1 ring-purple-300/50 shadow-2xl shadow-[0_0_30px_6px_rgba(167,139,250,0.35)]'
                                                : 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-200 border-gray-700 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800'} shadow-lg border-2 rounded-2xl relative px-4 overflow-hidden`
                                            : `${getTabStyle(tab.id)} w-full`} h-24 md:h-20 flex items-center justify-center text-center transform transition-all duration-300 hover:scale-105 hover:rotate-1 active:scale-95`}
                                        style={{
                                            animationName: isClosing ? 'slideOutToLeft' : (index % 2 === 0 ? 'slideInFromLeft' : 'slideInFromRight'),
                                            animationDuration: isClosing ? '0.3s' : '0.6s',
                                            animationDelay: isClosing ? '0s' : `${(index + 1) * 0.1}s`
                                        }}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg md:text-base font-semibold">{tab.name}</span>
                                        </div>
                                    </button>
                                ))}

                                {/* 모바일 로그아웃 버튼 */}
                                <button
                                    onClick={() => {
                                        setIsClosing(true);
                                        setPendingAction({
                                            action: () => onLogout()
                                        });
                                    }}
                                    className={`tab-button-animated ${isClosing ? 'closing' : ''} ${isSpaceTheme
                                        ? 'relative px-8 py-4 font-bold rounded-2xl transition-all duration-300 ease-in-out text-sm transform hover:scale-105 hover:-translate-y-1 shadow-xl border-2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-200 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 border-gray-700 w-full h-24 md:h-20 flex items-center justify-center text-center'
                                        : 'relative px-8 py-4 font-bold rounded-2xl transition-all duration-300 ease-in-out text-sm transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl border-2 bg-gradient-to-r from-white to-gray-50 text-gray-600 hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 border-gray-200 hover:border-blue-300 hover:shadow-lg w-full h-24 md:h-20 flex items-center justify-center text-center'}`}
                                    style={{
                                        animationName: isClosing ? 'slideOutToRight' : (allowedTabs.length % 2 === 0 ? 'slideInFromLeft' : 'slideInFromRight'),
                                        animationDuration: isClosing ? '0.3s' : '0.6s',
                                        animationDelay: isClosing ? '0s' : `${(allowedTabs.length + 1) * 0.1}s`
                                    }}
                                >
                                    <div className="flex flex-col items-center">
                                        <span className="text-lg md:text-base font-semibold relative z-10">로그아웃</span>
                                    </div>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* 메인 컨텐츠 */}
            <div className={`min-h-screen pt-20 ${mainBackgroundClass} bg-render-fix main-content-optimized`}>
                {/* 우주 테마 효과 */}
                {isSpaceTheme && (
                    <>
                        {/* 중앙 어둡기 오버레이 (전역, 컨텐츠 아래) */}
                        <div className="pointer-events-none fixed inset-0 central-dark-overlay"></div>
                        {/* 별들 - 클릭 방해 방지용 래퍼 */}
                        <div className="pointer-events-none fixed inset-0 stars-layer">
                        {Array.from({ length: 120 }, (_, i) => {
                            // 더 랜덤한 분포를 위한 시드 기반 랜덤
                            const seed = i * 137.5; // 황금각도 비율 사용
                            const x = (Math.sin(seed) * Math.cos(seed * 0.7) * 45 + 50) % 100;
                            const y = (Math.cos(seed) * Math.sin(seed * 0.3) * 45 + 50) % 100;
                            const size = Math.abs(Math.sin(seed * 1.3)) * 2.5 + 0.5;
                            const opacity = Math.abs(Math.sin(seed * 0.8)) * 0.5 + 0.15;
                            const delay = Math.abs(Math.sin(seed * 1.1)) * 6;
                            
                            return (
                                <div
                                    key={i}
                                    className="absolute animate-twinkle"
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        width: `${size}px`,
                                        height: `${size}px`,
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        animationDelay: `${delay}s`,
                                        opacity: opacity,
                                        boxShadow: `0 0 ${size * 1.5}px rgba(255, 255, 255, ${opacity * 0.35})`,
                                    }}
                                />
                            );
                        })}
                        </div>
                        
                        {/* 은하수 효과 */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none stars-layer">
                            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-700/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-700/10 rounded-full blur-3xl"></div>
                            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                        </div>

                        {/* 코너 어둡기 오버레이 (우상단, 좌하단) */}
                        <div className="pointer-events-none fixed inset-0 corner-dark-top-right-light"></div>
                        <div className="pointer-events-none fixed inset-0 corner-dark-bottom-left-light"></div>
                    </>
                )}
                
                <main className={`p-2 md:p-4 mt-4 md:mt-4 mx-auto relative z-10 ${activeTab === 'events' ? 'max-w-7xl' : 'max-w-6xl'}`}>
                    <div className="w-full">
                        {/* 상단 상태 표시 탭들 - 속초 config 적용 (클라이언트일 때 숨김) */}
                        {!isClient() && (
                        <div className={`mb-4 rounded-2xl shadow-lg overflow-hidden ${dataPanelBorderClass}`} style={dataPanelStyle}>
                            <div className="flex items-stretch">
                                <div className="flex-1 min-w-0 flex flex-col">

                                        <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center data-panel-header ${sensorData?.rawData?.[siteConfig.systemAddresses.remoteOp] === 1 ? (theme === 'space' ? 'bg-purple-600' : 'bg-blue-500') : 'bg-gray-400'}`}>
                                        원격조작
                                    </div>

                                        <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${sensorData.rawData[siteConfig.systemAddresses.remoteOp] === 1 ? (theme === 'space' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700') : 'bg-gray-100 text-gray-800'}`}>
                                            {sensorData.rawData[siteConfig.systemAddresses.remoteOp] === 1 ? '활성' : '비활성'}

                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center data-panel-header ${isPLCConnected ? (theme === 'space' ? 'bg-purple-600' : 'bg-blue-500') : 'bg-gray-400'}`}>
                                        위치정보
                                    </div>

                                    <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${isPLCConnected ? (theme === 'space' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700') : 'bg-gray-100 text-gray-800'}`}>
                                            {isPLCConnected ? siteConfig.siteInfo.location : '-'}

                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center data-panel-header ${isPLCConnected ? (theme === 'space' ? 'bg-purple-600' : 'bg-blue-500') : 'bg-gray-400'}`}>
                                        호기번호
                                    </div>
                                    <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${isPLCConnected ? (theme === 'space' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700') : 'bg-gray-100 text-gray-800'}`}>
                                        {isPLCConnected ? `${selectedUnit}호기` : '-'}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center data-panel-header ${isPLCConnected ? (theme === 'space' ? 'bg-purple-600' : 'bg-blue-500') : 'bg-gray-400'}`}>
                                        운전모드
                                    </div>

                                    <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${isPLCConnected ? (theme === 'space' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700') : 'bg-gray-100 text-gray-800'}`}>
                                            {isPLCConnected ? (sensorData.rawData[siteConfig.systemAddresses.manualMode] === 1 ? '수동' : '자동') : '-'}

                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                        <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center data-panel-header ${isPLCConnected ? (sensorData.rawData[siteConfig.systemAddresses.errorStatus] === 1 ? 'bg-red-500' : (theme === 'space' ? 'bg-purple-600' : 'bg-green-500')) : 'bg-gray-400'}`}>
                                        에러상태
                                    </div>
                                        <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${isPLCConnected ? (sensorData.rawData[siteConfig.systemAddresses.errorStatus] === 1 ? 'bg-red-50 text-red-700' : (theme === 'space' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700')) : 'bg-gray-100 text-gray-800'}`}>
                                            {isPLCConnected ? (sensorData.rawData[siteConfig.systemAddresses.errorStatus] === 1 ? '고장발생' : '정상') : '-'}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                        <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center data-panel-header ${sensorData.rawData[siteConfig.systemAddresses.plcComm] === 1 ? (theme === 'space' ? 'bg-purple-600' : 'bg-blue-500') : 'bg-red-500'}`}>
                                        PLC통신
                                    </div>

                                        <div className={`text-sm px-2 py-3 text-center h-16 flex items-center justify-center ${sensorData.rawData[siteConfig.systemAddresses.plcComm] === 1 ? (theme === 'space' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700') : 'bg-red-50 text-red-700'}`}>
                                            {sensorData.rawData[siteConfig.systemAddresses.plcComm] === 1 ? '활성' : '비활성'}

                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* 차량 및 주차 현황 데이터 - 속초 config 적용 */}
                        <div
                            className={`mb-6 rounded-2xl relative overflow-hidden shadow-xl shadow-black/20 ${dataPanelBorderClass}`}
                            style={dataPanelStyle}
                        >
                            {/* 헤더 */}
                            <div
                                className="group p-4 sm:p-6 flex justify-center items-center cursor-pointer rounded-t-2xl transition-all duration-300 relative overflow-hidden"
                                onClick={() => setIsDataPanelExpanded(!isDataPanelExpanded)}
                                style={dataPanelHeaderStyle}
                            >
                                <div
                                    className="absolute top-0 left-[-150%] h-full w-[50%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 ease-in-out group-hover:left-[150%]"
                                />

                                <h3 className={`text-lg font-bold relative z-10 text-center ${theme === 'space' ? 'bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>
                                    차량 및 주차 현황 데이터
                                </h3>
                                <button

                                    className={`p-2 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 absolute right-4 sm:right-6 z-10 ${isDataPanelExpanded ? '' : 'hover:bg-white/10 border border-white/10'}`}

                                    style={isDataPanelExpanded ? {
                                        background: theme === 'space' ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(25px)',
                                        WebkitBackdropFilter: 'blur(25px)',
                                        border: 'none'

                                    } : theme === 'space' ? {
                                        background: 'rgba(20, 20, 20, 0.95)',
                                        backdropFilter: 'blur(25px)',
                                        WebkitBackdropFilter: 'blur(25px)',
                                        border: 'none'

                                    } : {}}
                                >
                                    <svg
                                        className={`w-5 h-5 transform transition-transform duration-500 ease-in-out ${isDataPanelExpanded ? 'rotate-180' : 'rotate-0'} ${theme === 'space' ? 'text-purple-500' : 'text-blue-500'}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* 데이터 패널 내용 (기존과 동일) */}
                            <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isDataPanelExpanded
                                ? 'max-h-screen opacity-100 transform translate-y-0'
                                : 'max-h-0 opacity-0 transform -translate-y-4'
                                }`}>
                                <div className="px-4 sm:px-6 pt-4 pb-4 sm:pb-6 relative" style={dataPanelContentStyle}>
                                    {/* 글래스모피즘 배경 그라데이션 */}
                                    <div className={`absolute inset-0 rounded-b-2xl ${glassmorphismClass}`}></div>
                                    {/* 요약 KPI - client 전용 */}
                                    {isSummaryMode && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-2">
                                            {[
                                                { label: '전체주차', value: sensorData.rawData?.[siteConfig.dataAddresses.totalParked] || 0, delay: '100ms' },
                                                { label: '전체공차', value: sensorData.rawData?.[siteConfig.dataAddresses.totalEmpty] || 0, delay: '200ms' },
                                                { label: '일반입고', value: sensorData.rawData?.[siteConfig.dataAddresses.normalIn] || 0, delay: '300ms' },
                                                { label: '일반공차', value: sensorData.rawData?.[siteConfig.dataAddresses.normalEmpty] || 0, delay: '400ms' },
                                                { label: 'RV입고', value: sensorData.rawData?.[siteConfig.dataAddresses.rvIn] || 0, delay: '500ms' },
                                                { label: 'RV공차', value: sensorData.rawData?.[siteConfig.dataAddresses.rvEmpty] || 0, delay: '600ms' }
                                            ].map((kpi) => (
                                                <div
                                                    key={kpi.label}
                                                    className={`p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                                                    style={{
                                                        transitionDelay: isDataPanelExpanded ? kpi.delay : '0ms',
                                                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                        backdropFilter: 'blur(12px)',
                                                        WebkitBackdropFilter: 'blur(12px)',
                                                        border: '1px solid rgba(255, 255, 255, 0.18)',
                                                        boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                                    }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/6 to-indigo-500/6 rounded-2xl"></div>
                                                    <label className={`block text-xs font-medium mb-1 relative z-10 ${cardLabelColorClass}`}>{kpi.label}</label>
                                                    <div
                                                        className={`text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-xl sm:text-2xl md:text-3xl font-bold relative z-10 ${cardValueColorClass}`}
                                                        style={{
                                                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                            backdropFilter: 'blur(8px)',
                                                            WebkitBackdropFilter: 'blur(8px)',
                                                            border: '1px solid rgba(255, 255, 255, 0.25)',
                                                            boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                                        }}
                                                    >
                                                        {kpi.value}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}


                                    {/* 상세 그리드 (기존 레이아웃) - 관리자/서비스 등 */}
                                    {!isSummaryMode && (
                                    <>
                                    {/* 첫 번째 행 (차량번호/적재차판/출고차판) 복구 */}
                                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                                        <div className={`p-2 sm:p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded

                                                ? 'translate-y-0 opacity-100'
                                                : 'translate-y-4 opacity-0'
                                                }`}
                                                style={{
                                                    transitionDelay: isDataPanelExpanded ? '100ms' : '0ms',
                                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                                                    backdropFilter: 'blur(25px)',
                                                    WebkitBackdropFilter: 'blur(25px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.15)'
                                                }}>
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-indigo-500/8 rounded-2xl"></div>
                                                <label className={`block text-xs font-medium mb-1 relative z-10 text-center ${cardLabelColorClass}`}>차량번호</label>
                                                <div className={`rounded-2xl px-2 sm:px-3 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10 text-center ${cardValueColorClass}`} style={{
                                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                                                    backdropFilter: 'blur(10px)',
                                                    WebkitBackdropFilter: 'blur(10px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                                    boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                                                }}>
                                                    {sensorData?.rawData?.[siteConfig.dataAddresses.vehicleNumber] || '----'}
                                                </div>
                                            </div>

                                            <div className={`p-2 sm:p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100'
                                                : 'translate-y-4 opacity-0'
                                                }`}
                                                style={{
                                                    transitionDelay: isDataPanelExpanded ? '200ms' : '0ms',
                                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 100%)',
                                                    backdropFilter: 'blur(15px)',
                                                    WebkitBackdropFilter: 'blur(15px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)'
                                                }}>
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-indigo-500/8 rounded-2xl"></div>
                                                <label className={`block text-xs font-medium mb-1 relative z-10 text-center ${cardLabelColorClass}`}>적재차판</label>
                                                <div className={`rounded-2xl px-2 sm:px-3 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10 text-center ${cardValueColorClass}`} style={{
                                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                                                    backdropFilter: 'blur(10px)',
                                                    WebkitBackdropFilter: 'blur(10px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                                    boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                                                }}>
                                                    {sensorData.rawData?.[siteConfig.dataAddresses.loadedPallet] || 0}
                                                </div>
                                            </div>

                                            <div className={`p-2 sm:p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100'
                                                : 'translate-y-4 opacity-0'
                                                }`}
                                                style={{
                                                    transitionDelay: isDataPanelExpanded ? '300ms' : '0ms',
                                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.12) 100%)',
                                                    backdropFilter: 'blur(15px)',
                                                    WebkitBackdropFilter: 'blur(15px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)'
                                                }}>
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-indigo-500/8 rounded-2xl"></div>
                                                <label className={`block text-xs font-medium mb-1 relative z-10 text-center ${cardLabelColorClass}`}>출고차판</label>
                                                <div className={`rounded-2xl px-2 sm:px-3 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10 text-center ${cardValueColorClass}`} style={{
                                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                                                    backdropFilter: 'blur(10px)',
                                                    WebkitBackdropFilter: 'blur(10px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                                    boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                                                }}>
                                                    {sensorData.rawData?.[siteConfig.dataAddresses.unloadPallet] || 0}
                                                </div>
                                            </div>
                                        </div>
                                    

                                    {/* 두 번째 행 (개수 지표 6개) */}
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                                        <div className={`p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100 scale-100'
                                                : 'translate-y-4 opacity-0 scale-95'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '400ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-2xl"></div>
                                            <label className={`block text-xs font-medium mb-1 text-center relative z-10 ${cardLabelColorClass}`}>전체주차</label>
                                            <div className={`text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10 ${cardValueColorClass}`} style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                            }}>
                                                {sensorData.rawData?.[siteConfig.dataAddresses.totalParked] || 0}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100 scale-100'
                                                : 'translate-y-4 opacity-0 scale-95'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '500ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-2xl"></div>
                                            <label className={`block text-xs font-medium mb-1 text-center relative z-10 ${cardLabelColorClass}`}>전체공차</label>
                                            <div className={`text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10 ${cardValueColorClass}`} style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                            }}>
                                                {sensorData.rawData?.[siteConfig.dataAddresses.totalEmpty] || 0}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100 scale-100'
                                                : 'translate-y-4 opacity-0 scale-95'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '600ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-2xl"></div>
                                            <label className={`block text-xs font-medium mb-1 text-center relative z-10 ${cardLabelColorClass}`}>일반입고</label>
                                            <div className={`text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10 ${cardValueColorClass}`} style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                            }}>
                                                {sensorData.rawData?.[siteConfig.dataAddresses.normalIn] || 0}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100 scale-100'
                                                : 'translate-y-4 opacity-0 scale-95'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '700ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-2xl"></div>
                                            <label className={`block text-xs font-medium mb-1 text-center relative z-10 ${cardLabelColorClass}`}>일반출차</label>
                                            <div className={`text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10 ${cardValueColorClass}`} style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                            }}>
                                                {sensorData.rawData?.[siteConfig.dataAddresses.normalEmpty] || 0}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100 scale-100'
                                                : 'translate-y-4 opacity-0 scale-95'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '800ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-2xl"></div>
                                            <label className={`block text-xs font-medium mb-1 text-center relative z-10 ${cardLabelColorClass}`}>RV입고</label>
                                            <div className={`text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10 ${cardValueColorClass}`} style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                            }}>
                                                {sensorData.rawData?.[siteConfig.dataAddresses.rvIn] || 0}
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-2xl transition-all duration-700 ease-out transform relative overflow-hidden ${isDataPanelExpanded
                                                ? 'translate-y-0 opacity-100 scale-100'
                                                : 'translate-y-4 opacity-0 scale-95'
                                            }`}
                                            style={{
                                                transitionDelay: isDataPanelExpanded ? '900ms' : '0ms',
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                                                backdropFilter: 'blur(12px)',
                                                WebkitBackdropFilter: 'blur(12px)',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                boxShadow: '0 3px 12px 0 rgba(31, 38, 135, 0.18)'
                                            }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-2xl"></div>
                                            <label className={`block text-xs font-medium mb-1 text-center relative z-10 ${cardLabelColorClass}`}>RV출차</label>
                                            <div className={`text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10 ${cardValueColorClass}`} style={{
                                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                                boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                                            }}>
                                                {sensorData.rawData?.[siteConfig.dataAddresses.rvEmpty] || 0}
                                            </div>
                                        </div>
                                    </div>
                                    </>
                                    )}

                                </div>
                            </div>
                        </div>

                        {/* 탭 컨텐츠 - 권한 체크 적용 */}
                        <div className="space-y-6">
                            {/* 연결 관리 탭 - config 권한 필요 */}
                            {activeTab === 'connection' && hasTabAccess('connection') && (
                                <ConnectionPanel
                                    isSignalRConnected={isSignalRConnected}
                                    isPLCConnected={isPLCConnected}
                                    isConnecting={isConnecting}
                                    isAuthenticated={isAuthenticated}
                                    error={error}
                                    plcConfig={plcConfig}
                                    setPLCConfig={setPLCConfig}
                                    connectToPLC={connectToPLC}
                                    disconnectFromPLC={disconnectFromPLC}
                                    clearError={clearError}
                                    selectedUnit={selectedUnit}
                                    setSelectedUnit={setSelectedUnit}
                                    theme={theme}
                                />
                            )}

                            {/* 센서 모니터 탭 - sensor 권한 필요 */}
                            {activeTab === 'monitor' && hasTabAccess('monitor') && (
                                <SensorMonitor
                                    sensorData={sensorData}
                                    isPLCConnected={isPLCConnected}
                                />
                            )}

                        {/* 수동 제어 탭 - manual 권한 필요 */}
                        {activeTab === 'control' && hasTabAccess('control') && (
                            <ManualControl
                                isPLCConnected={isPLCConnected}
                                isAuthenticated={isAuthenticated}
                                sensorData={sensorData}
                                isMobileMenuOpen={isMobileMenuOpen}
                            />
                        )}

                            {/* 주차장 모니터 탭 - parking 권한 (모든 사용자) */}
                            {activeTab === 'parking' && hasTabAccess('parking') && (
                                <ParkingMonitor
                                    sensorData={sensorData}
                                    isPLCConnected={isPLCConnected}
                                    onVehicleEdit={handleVehicleEdit}
                                />
                            )}

                            {/* 입출차 이벤트 탭 - events 권한 */}
                            {activeTab === 'events' && hasTabAccess('events') && (
                                <EventMonitor
                                    sensorData={sensorData}
                                    isPLCConnected={isPLCConnected}
                                />
                            )}

                            {/* A/S 기록 탭 - service 권한 */}
                            {activeTab === 'service' && hasTabAccess('service') && (
                                <ServiceRecordTab />
                            )}

                            {/* CCTV 탭 */}
                            {activeTab === 'cctv' && hasTabAccess('cctv') && (
                                <React.Suspense fallback={<div className="text-center p-8">CCTV 로딩중...</div>}>
                                    <CCTVMonitor />
                                </React.Suspense>
                            )}

                            {/* 권한 없는 경우 안내 메시지 */}
                            {!hasTabAccess(activeTab) && (
                                <div className="flex items-center justify-center min-h-96">
                                    <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                        <div className="text-6xl mb-4">🔒</div>
                                        <h3 className={`text-xl font-bold mb-2 ${cardValueColorClass}`}>접근 권한이 없습니다</h3>
                                        <p className="text-gray-500">
                                            현재 계정({currentUser?.role})으로는 이 기능을 사용할 수 없습니다.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* Footer */}
                        <footer className="mt-8 text-center text-sm text-gray-500">
                            <p>PLC 웹 제어 시스템 v1.0 - Parking24web ({currentUser?.role} 모드)</p>
                        </footer>
                    </div>
                </main>
            </div>
        </>
    );
};

export default PLCControl;