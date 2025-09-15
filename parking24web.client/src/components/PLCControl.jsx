import React, { useState } from 'react';
import { usePLCConnection } from '../hooks/usePLCConnection';
import ConnectionPanel from './ConnectionPanel';
import SensorMonitor from './SensorMonitor';
import ManualControl from './ManualControl';
import ParkingMonitor from './ParkingMonitor';

const PLCControl = () => {
    const [activeTab, setActiveTab] = useState('connection');
    const [showLogs, setShowLogs] = useState(false);
    const [isDataPanelExpanded, setIsDataPanelExpanded] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // PLC 연결 훅 사용
    const {
        // 상태
        isSignalRConnected,
        isPLCConnected,
        isConnecting,
        isAuthenticated,
        error,
        sensorData,
        logs,

        // 설정
        plcConfig,
        setPLCConfig,

        // 액션
        connectToPLC,
        disconnectFromPLC,
        sendCommand,
        clearError,
        clearLogs
    } = usePLCConnection();

    // 차량번호 편집 핸들러
    const handleVehicleEdit = async (address, value, description) => {
        try {
            const deviceType = address.substring(0, 1);  // D
            const addressNum = parseInt(address.substring(1));  // 4001~

            const result = await sendCommand('WriteAddress', {
                deviceType: deviceType,
                address: addressNum,
                value: value
            });

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
        setIsClosing(true);
        setTimeout(() => {
            setActiveTab(tabName);
            setIsMobileMenuOpen(false);
            setIsClosing(false);
        }, 300);
    };

    // 탭 스타일 - 화려한 애니메이션 적용
    const getTabStyle = (tabName) => {
        const baseStyle = "relative px-8 py-4 font-bold rounded-2xl transition-all duration-300 ease-in-out text-sm transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl border-2 tablet-tab-button";
        if (activeTab === tabName) {
            return `${baseStyle} bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-2xl border-blue-300 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700`;
        }
        return `${baseStyle} bg-gradient-to-r from-white to-gray-50 text-gray-600 hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 border-gray-200 hover:border-blue-300 hover:shadow-lg`;
    };

    return (
        <>
            <style jsx>{`
                /* 태블릿에서 탭 버튼 크기 조정 */
                @media (min-width: 768px) and (max-width: 1024px) {
                    .tablet-tab-button {
                        padding: 0.5rem 1rem !important;
                        font-size: 0.75rem !important;
                        border-radius: 1rem !important;
                    }
                }
            `}</style>
            {/* 상단 네비게이션 헤더 - 완전 전체 화면 너비 */}
            <header className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 w-full z-50">
                <div className="flex items-center justify-between px-4 py-3">
                    {/* 로고/제목 (왼쪽) */}
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300">
                            <span className="text-white font-black text-sm tracking-wider">E</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-wider">
                                EPSAI
                            </h1>
                            <div className="text-xs text-gray-500 font-medium tracking-widest">
                                PARKING SYSTEM
                            </div>
                        </div>
                    </div>
                    
                    {/* 탭 네비게이션 (중앙) - 화려한 애니메이션 */}
                    <nav className="hidden md:flex space-x-4 flex-1 justify-center">
                        <button
                            onClick={() => setActiveTab('connection')}
                            className={`${getTabStyle('connection')} group overflow-hidden`}
                        >
                            <span className="relative z-10">연결 관리</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('monitor')}
                            className={`${getTabStyle('monitor')} group overflow-hidden`}
                        >
                            <span className="relative z-10">센서 모니터</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('control')}
                            className={`${getTabStyle('control')} group overflow-hidden`}
                        >
                            <span className="relative z-10">수동 제어</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('parking')}
                            className={`${getTabStyle('parking')} group overflow-hidden`}
                        >
                            <span className="relative z-10">주차장 모니터</span>
                        </button>
                    </nav>
                    

                    {/* 상태 표시 (데스크톱) */}
                    <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${isSignalRConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium text-gray-700">SignalR</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${isPLCConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium text-gray-700">PLC</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-sm font-medium text-gray-700">인증</span>
                        </div>
                        
                    </div>
                    
                    {/* 모바일 햄버거 메뉴 (오른쪽) */}
                    <div className="md:hidden flex-shrink-0">
                        <button 
                            onClick={() => {
                                if (isMobileMenuOpen) {
                                    setIsClosing(true);
                                    setTimeout(() => {
                                        setIsMobileMenuOpen(false);
                                        setIsClosing(false);
                                    }, 300);
                                } else {
                                    setIsMobileMenuOpen(true);
                                }
                            }}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                {/* 모바일 탭 메뉴 */}
                {isMobileMenuOpen && (
                    <div className={`md:hidden fixed inset-0 top-16 z-40 overflow-hidden mobile-menu-bg transition-all duration-300 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                        
                        {/* 메뉴 컨테이너 */}
                        <div className="h-full flex items-start justify-center p-4 pt-16 relative z-10">
                            <div className={`w-full max-w-sm transform transition-all duration-500 ease-out ${isClosing ? 'animate-out slide-out-to-top-8 fade-out-0' : 'animate-in slide-in-from-top-8 fade-in-0'}`}>
                                <nav className="grid grid-cols-2 gap-6 w-full">
                                    <button
                                        onClick={() => handleMobileTabClick('connection')}
                                        className={`${getTabStyle('connection')} w-full h-20 flex items-center justify-center text-center transform transition-all duration-300 hover:scale-105 hover:rotate-1`}
                                        style={{ 
                                            animationName: isClosing ? 'slideOutToLeft' : 'slideInFromLeft',
                                            animationDuration: isClosing ? '0.3s' : '0.6s',
                                            animationTimingFunction: isClosing ? 'ease-in' : 'ease-out',
                                            animationDelay: isClosing ? '0s' : '0.1s',
                                            animationFillMode: 'both'
                                        }}
                                    >
                                        <span className="text-base font-semibold">연결 관리</span>
                                    </button>
                                    <button
                                        onClick={() => handleMobileTabClick('monitor')}
                                        className={`${getTabStyle('monitor')} w-full h-20 flex items-center justify-center text-center transform transition-all duration-300 hover:scale-105 hover:-rotate-1`}
                                        style={{ 
                                            animationName: isClosing ? 'slideOutToRight' : 'slideInFromRight',
                                            animationDuration: isClosing ? '0.3s' : '0.6s',
                                            animationTimingFunction: isClosing ? 'ease-in' : 'ease-out',
                                            animationDelay: isClosing ? '0s' : '0.2s',
                                            animationFillMode: 'both'
                                        }}
                                    >
                                        <span className="text-base font-semibold">센서 모니터</span>
                                    </button>
                                    <button
                                        onClick={() => handleMobileTabClick('control')}
                                        className={`${getTabStyle('control')} w-full h-20 flex items-center justify-center text-center transform transition-all duration-300 hover:scale-105 hover:rotate-1`}
                                        style={{ 
                                            animationName: isClosing ? 'slideOutToLeft' : 'slideInFromLeft',
                                            animationDuration: isClosing ? '0.3s' : '0.6s',
                                            animationTimingFunction: isClosing ? 'ease-in' : 'ease-out',
                                            animationDelay: isClosing ? '0s' : '0.3s',
                                            animationFillMode: 'both'
                                        }}
                                    >
                                        <span className="text-base font-semibold">수동 제어</span>
                                    </button>
                                    <button
                                        onClick={() => handleMobileTabClick('parking')}
                                        className={`${getTabStyle('parking')} w-full h-20 flex items-center justify-center text-center transform transition-all duration-300 hover:scale-105 hover:-rotate-1`}
                                        style={{ 
                                            animationName: isClosing ? 'slideOutToRight' : 'slideInFromRight',
                                            animationDuration: isClosing ? '0.3s' : '0.6s',
                                            animationTimingFunction: isClosing ? 'ease-in' : 'ease-out',
                                            animationDelay: isClosing ? '0s' : '0.4s',
                                            animationFillMode: 'both'
                                        }}
                                    >
                                        <span className="text-base font-semibold">주차장 모니터</span>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </header>
            
            {/* 메인 컨텐츠 */}
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20" style={{width: '100vw'}}>
                <main className="p-2 md:p-4 max-w-6xl mx-auto">
                <div className="w-full">

            {/* 상단 상태 표시 탭들 */}
                                                                                                       <div className="mb-4 rounded-2xl shadow-lg overflow-hidden border border-white/20" style={{
                                                                                                           background: 'rgba(255, 255, 255, 0.1)',
                                                                                                           backdropFilter: 'blur(20px)',
                                                                                                           WebkitBackdropFilter: 'blur(20px)',
                                                                                                       }}>
                <div className="flex items-stretch">
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center ${sensorData.rawData[18] === 1 ? 'bg-blue-500' : 'bg-gray-400'}`} style={{
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}>
                            원격조작
                        </div>
                        <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${sensorData.rawData[18] === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {sensorData.rawData[18] === 1 ? '활성' : '비활성'}
                        </div>
                    </div>
                 
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="bg-green-500 text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center" style={{
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}>
                            위치정보
                        </div>
                        <div className="bg-green-100 text-green-800 text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center">
                            토로스 주차타워
                        </div>
                    </div>
        
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="bg-green-500 text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center" style={{
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}>
                            호기번호
                        </div>
                        <div className="bg-green-100 text-green-800 text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center">
                            1호기
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="bg-green-500 text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center" style={{
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}>
                            운전모드
                        </div>
                        <div className="bg-green-100 text-green-800 text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center">
                            {sensorData.rawData[15] === 1 ? '자동' : '수동'}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center ${sensorData.rawData[16] === 1 ? 'bg-red-500' : 'bg-green-500'}`} style={{
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}>
                            에러상태
                        </div>
                        <div className={`text-sm px-2 py-3 text-center border-r h-16 flex items-center justify-center ${sensorData.rawData[16] === 1 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {sensorData.rawData[16] === 1 ? '고장발생' : '정상'}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className={`text-white text-xs font-medium px-1 py-2 text-center h-10 flex items-center justify-center ${sensorData.rawData[0] === 1 ? 'bg-green-500' : 'bg-red-500'}`} style={{
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                        }}>
                            하트비트
                        </div>
                        <div className={`text-sm px-2 py-3 text-center h-16 flex items-center justify-center ${sensorData.rawData[0] === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {sensorData.rawData[0] === 1 ? '활성' : '비활성'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 차량 및 주차 현황 데이터 (개선된 버전) */}
            <div 
                className="mb-6 rounded-2xl relative overflow-hidden border border-white/20 shadow-xl shadow-black/20"
                style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                }}
            >
                {/* 1. 은은한 빛 효과 추가 */}
                <div 
                    className="absolute top-0 left-0 w-1/2 h-1/2"
                    style={{
                        background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.15), transparent 60%)',
                    }}
                />

                {/* 헤더 (그룹 호버 및 동적 효과 추가) */}
                <div 
                    className="group p-4 sm:p-6 flex justify-between items-center cursor-pointer rounded-t-2xl transition-all duration-300 relative overflow-hidden"
                    onClick={() => setIsDataPanelExpanded(!isDataPanelExpanded)}
                    style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                >
                    {/* 2. 동적인 '글린트(Glint)' 호버 효과 */}
                    <div 
                        className="absolute top-0 left-[-150%] h-full w-[50%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 ease-in-out group-hover:left-[150%]"
                    />
                        
                    <h3 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent relative z-10">
                        차량 및 주차 현황 데이터
                    </h3>
                    <button 
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 relative z-10"
                    >
                        <svg 
                            className={`w-5 h-5 transform transition-transform duration-500 ease-in-out ${
                                isDataPanelExpanded 
                                    ? 'rotate-180 text-purple-500' 
                                    : 'rotate-0 text-blue-500'
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* 컨텐츠 (접었다 폈다 가능) */}
                <div className={`overflow-hidden transition-all duration-700 ease-in-out ${
                    isDataPanelExpanded 
                        ? 'max-h-screen opacity-100 transform translate-y-0' 
                        : 'max-h-0 opacity-0 transform -translate-y-4'
                }`}>
                    <div className="px-4 sm:px-6 pt-4 pb-4 sm:pb-6 relative" style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.7) 100%)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)'
                    }}>
                        {/* 글래스모피즘 배경 그라데이션 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/3 to-white/2 rounded-b-2xl"></div>
                    {/* 첫 번째 행 */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                    <div className={`p-2 sm:p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${
                        isDataPanelExpanded 
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
                        {/* 글래스모피즘 효과 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-indigo-500/8 rounded-lg"></div>
                        <label className="block text-xs font-medium text-blue-700 mb-1 relative z-10">차량번호</label>
                        <div className="rounded-2xl px-2 sm:px-3 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold text-gray-700 relative z-10" style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                        }}>----</div>
                    </div>
                    
                    <div className={`p-2 sm:p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${
                        isDataPanelExpanded 
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
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-indigo-500/8 rounded-lg"></div>
                        <label className="block text-xs font-medium text-blue-700 mb-1 relative z-10">적재차판</label>
                        <div className="rounded-2xl px-2 sm:px-3 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                        }}>
                            {sensorData.rawData?.[75] || 0}
                        </div>
                    </div>
                    
                    <div className={`p-2 sm:p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${
                        isDataPanelExpanded 
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
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-indigo-500/8 rounded-lg"></div>
                        <label className="block text-xs font-medium text-blue-700 mb-1 relative z-10">출고차판</label>
                        <div className="rounded-2xl px-2 sm:px-3 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold text-black relative z-10" style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.15)'
                        }}>
                            {sensorData.rawData?.[76] || 0}
                        </div>
                    </div>
                </div>

                {/* 두 번째 행 */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                    <div className={`p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${
                        isDataPanelExpanded 
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
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-lg"></div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">전체주차</label>
                        <div className="text-gray-700 text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                        }}>
                            {sensorData.rawData?.[77] || 0}
                        </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${
                        isDataPanelExpanded 
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
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-lg"></div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">전체공차</label>
                        <div className="text-gray-700 text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                        }}>
                            {sensorData.rawData?.[78] || 0}
                        </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${
                        isDataPanelExpanded 
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
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-lg"></div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">일반입고</label>
                        <div className="text-gray-700 text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                        }}>
                            {sensorData.rawData?.[79] || 0}
                        </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${
                        isDataPanelExpanded 
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
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-lg"></div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">일반출차</label>
                        <div className="text-gray-700 text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                        }}>
                            {sensorData.rawData?.[80] || 0}
                        </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${
                        isDataPanelExpanded 
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
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-lg"></div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">RV입고</label>
                        <div className="text-gray-700 text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                        }}>
                            {sensorData.rawData?.[82] || 0}
                        </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg transition-all duration-700 ease-out transform relative overflow-hidden ${
                        isDataPanelExpanded 
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
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-lg"></div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 relative z-10">RV출차</label>
                        <div className="text-gray-700 text-center rounded-2xl px-1 sm:px-2 py-3 sm:py-5 text-lg sm:text-2xl md:text-3xl font-bold relative z-10" style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.75) 100%)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            boxShadow: '0 1px 6px 0 rgba(31, 38, 135, 0.12)'
                        }}>
                            {sensorData.rawData?.[81] || 0}
                        </div>
                    </div>
                </div>

                    </div>
                </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="space-y-6">
                {/* 연결 관리 탭 */}
                {activeTab === 'connection' && (
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
                    />
                )}

                {/* 센서 모니터 탭 */}
                {activeTab === 'monitor' && (
                    <SensorMonitor
                        sensorData={sensorData}
                        isPLCConnected={isPLCConnected}
                    />
                )}

                {/* 수동 제어 탭 */}
                {activeTab === 'control' && (
                    <ManualControl
                        isPLCConnected={isPLCConnected}
                        isAuthenticated={isAuthenticated}
                        sendCommand={sendCommand}
                        sensorData={sensorData}
                    />
                )}
                {/* 주차장 모니터 탭 */}
                {activeTab === 'parking' && (
                    <ParkingMonitor
                        sensorData={sensorData}
                        isPLCConnected={isPLCConnected}
                        onVehicleEdit={handleVehicleEdit}
                    />
                )}
            </div>

            {/* 개발자 정보 (개발 모드에서만) */}
            {/* eslint-disable-next-line no-undef */}
            {process.env.NODE_ENV === 'development' && (
                <div className="hidden sm:block mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg lg:w-4/5 mx-auto">
                    <h4 className="font-semibold text-yellow-800 mb-2">개발자 정보</h4>
                    <div className="text-xs text-yellow-700 space-y-1">
                        <div>SignalR Hub: https://localhost:7229/plcHub</div>
                        <div>PLC IP: {plcConfig.ip}:{plcConfig.port}</div>
                        <div>센서 데이터 수: {sensorData.rawData?.length || 0}</div>
                        <div>활성 센서: {sensorData.rawData?.filter(v => v > 0).length || 0}</div>
                        <div>로그 수: {logs.length}</div>
                    </div>
                </div>
            )}

                    {/* Footer */}
                    <footer className="mt-8 text-center text-sm text-gray-500">
                        <p>PLC 웹 제어 시스템 v1.0 - Parking24web</p>
                    </footer>
                    </div>
                </main>
            </div>
        </>
    );
};

export default PLCControl;