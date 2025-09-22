import React, { useState, useEffect, useCallback } from 'react';
import sokcho1Config from '../../config/sokcho1Config.js';

const EventMonitor = () => {
    const [activeTab, setActiveTab] = useState('recent');
    const [recentEvents, setRecentEvents] = useState([]);
    const [currentParked, setCurrentParked] = useState([]);
    const [exitedCars, setExitedCars] = useState([]);
    const [searchCarNumber, setSearchCarNumber] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [isStatisticsExpanded, setIsStatisticsExpanded] = useState(true);
    const [isStatisticsAnimatingOut, setIsStatisticsAnimatingOut] = useState(false);
    const [statistics, setStatistics] = useState({
        todayIn: 0,
        todayOut: 0,
        currentTotal: 0,
        monthlyIn: 0,
        monthlyOut: 0
    });

    // 토스트 알림 표시
    const showToast = useCallback((message) => {
        setToastMessage(message);
    }, []);

    // 토스트 메시지 타이머 관리
    useEffect(() => {
        if (!toastMessage) return;

        const timer = setTimeout(() => {
            setToastMessage('');
        }, 3000);

        return () => clearTimeout(timer);
    }, [toastMessage]);

    // API 호출 함수들
    const fetchRecentEvents = async () => {
        try {
            const response = await fetch(`${sokcho1Config.api.baseUrl}${sokcho1Config.api.endpoints.recent}`);
            const data = await response.json();

            const formattedEvents = data.map(event => ({
                시간: new Date(event.timestamp).toLocaleTimeString('ko-KR'),
                날짜: new Date(event.timestamp).toLocaleDateString('ko-KR'),
                구분: event.eventType,
                층: event.floor,
                차번: event.carNumber,
                슬롯: event.slotNumber
            }));

            setRecentEvents(formattedEvents);

            const exited = formattedEvents.filter(e => e.구분 === '출차');
            setExitedCars(exited);
        } catch (error) {
            console.error('최근 이벤트 로드 실패:', error);
        }
    };

    const fetchParkedVehicles = async () => {
        try {
            const response = await fetch(`${sokcho1Config.api.baseUrl}${sokcho1Config.api.endpoints.parked}`);
            const data = await response.json();

            const formattedParked = data.map(vehicle => ({
                시간: new Date().toLocaleTimeString('ko-KR'),
                구분: '주차중',
                층: vehicle.floor,
                차번: vehicle.carNumber,
                슬롯: `${vehicle.slotNumber}번`
            }));

            setCurrentParked(formattedParked);
        } catch (error) {
            console.error('주차중 차량 로드 실패:', error);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await fetch(`${sokcho1Config.api.baseUrl}${sokcho1Config.api.endpoints.statistics}`);
            const data = await response.json();
            setStatistics(data);
        } catch (error) {
            console.error('통계 로드 실패:', error);
        }
    };

    // 차량 검색 (API 연동)
    const searchCar = async () => {
        if (!searchCarNumber) {
            alert('차량번호를 입력하세요');
            return;
        }

        try {
            const response = await fetch(`${sokcho1Config.api.baseUrl}${sokcho1Config.api.endpoints.search}/${searchCarNumber}`);
            const result = await response.json();

            if (result.found) {
                alert(result.message);
            } else {
                alert('해당 차량을 찾을 수 없습니다');
            }
        } catch (error) {
            console.error('차량 검색 실패:', error);
            alert('검색 중 오류가 발생했습니다');
        }
    };

    // 엑셀 다운로드
    const downloadExcel = () => {
        const BOM = '\uFEFF'; // UTF-8 BOM for Korean
        const csvContent = BOM + "시간,날짜,구분,층,차량번호,슬롯\n" +
            recentEvents.map(e =>
                `${e.시간},${e.날짜},${e.구분},${e.층},${e.차번},${e.슬롯}`
            ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `입출차현황_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '-')}.csv`;
        a.click();

        showToast('📊 엑셀 다운로드 완료!');
    };

    // 초기 데이터 로드 및 주기적 업데이트
    useEffect(() => {
        const loadAllData = async () => {
            await Promise.all([
                fetchRecentEvents(),
                fetchParkedVehicles(),
                fetchStatistics()
            ]);
        };

        loadAllData();

        // 30초마다 데이터 새로고침
        const interval = setInterval(loadAllData, 30000);
        return () => clearInterval(interval);
    }, []);

    // 데이터 새로고침
    const refreshData = async () => {
        await Promise.all([
            fetchRecentEvents(),
            fetchParkedVehicles(),
            fetchStatistics()
        ]);
        showToast('🔄 데이터 새로고침 완료');
    };

    // 데이터 초기화 (DB 초기화는 서버에서 처리해야 함)
    const clearAllData = () => {
        alert('⚠️ 데이터 초기화는 서버 관리자만 가능합니다.');
    };

    // 탭별 데이터
    const getTabData = () => {
        switch (activeTab) {
            case 'recent':
                return recentEvents;
            case 'parked':
                return currentParked;
            case 'exited':
                return exitedCars;
            default:
                return [];
        }
    };

    // 통계 섹션 토글
    const handleToggleStatistics = () => {
        if (isStatisticsExpanded) {
            setIsStatisticsAnimatingOut(true);
            setIsStatisticsExpanded(false);
            setTimeout(() => setIsStatisticsAnimatingOut(false), 500);
        } else {
            setIsStatisticsExpanded(true);
        }
    };

    return (
        <>
            <style>
                {`
                    @keyframes slideInFromTop {
                        0% {
                            transform: translateY(-100px);
                            opacity: 0;
                        }
                        100% {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }
                    
                    @keyframes slideInFromLeft {
                        0% {
                            transform: translateX(-100px);
                            opacity: 0;
                        }
                        100% {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    
                    @keyframes slideInFromRight {
                        0% {
                            transform: translateX(100px);
                            opacity: 0;
                        }
                        100% {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    
                    @keyframes zoomIn {
                        0% {
                            transform: scale(0.5);
                            opacity: 0;
                        }
                        100% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                    
                    @keyframes bounceIn {
                        0% {
                            transform: scale(0.3);
                            opacity: 0;
                        }
                        50% {
                            transform: scale(1.1);
                            opacity: 1;
                        }
                        100% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                    
                    @keyframes zoomInBounce {
                        0% {
                            transform: scale(0);
                            opacity: 0;
                        }
                        50% {
                            transform: scale(1.2);
                            opacity: 1;
                        }
                        100% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                    
                    @keyframes progressFill {
                        0% {
                            width: 0%;
                        }
                        100% {
                            width: var(--target-width);
                        }
                    }
                `}
            </style>
            <div className="rounded-2xl p-6 border border-gray-200 shadow-xl relative" style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)'
            }}>
                {/* 토스트 알림 */}
                {toastMessage && (
                    <div className="absolute top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse" style={{
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)'
                    }}>
                        <span className="text-white text-sm font-medium">{toastMessage}</span>
                    </div>
                )}

                {/* 헤더 */}
                <div className="rounded-xl p-6 mb-6" style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(99, 102, 241, 0.8) 100%)',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.2)'
                }}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white mb-8">입출차 현황 모니터링</h2>
                    </div>

                    {/* 검색창 */}
                    <div className="flex gap-2 md:gap-3 items-center">
                        <input
                            type="text"
                            value={searchCarNumber}
                            onChange={(e) => setSearchCarNumber(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchCar()}
                            className="flex-1 px-2 md:px-4 py-3 md:py-2 rounded-lg text-gray-800 border-0 focus:ring-2 focus:ring-blue-300 text-sm md:text-base"
                            style={{
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)'
                            }}
                            placeholder="차량번호 입력"
                        />
                        <button
                            onClick={searchCar}
                            className="px-2 md:px-4 py-3 md:py-2 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 text-sm md:text-base"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.3)',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                            }}
                        >
                            검색
                        </button>
                    </div>

                    {/* 모바일용 액션 버튼들 */}
                    <div className="flex gap-1 sm:hidden mt-4">
                        <button
                            onClick={downloadExcel}
                            className="flex-1 px-2 py-1 rounded-lg text-white font-bold transition-all duration-200 hover:scale-105 text-xs"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.3)',
                                fontSize: '0.75rem',
                                fontWeight: '700'
                            }}
                        >
                            엑셀 다운로드
                        </button>
                        <button
                            onClick={refreshData}
                            className="flex-1 px-2 py-1 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 text-xs"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.3)',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                            }}
                        >
                            새로고침
                        </button>
                        <button
                            onClick={clearAllData}
                            className="flex-1 px-2 py-1 rounded-lg text-white font-bold transition-all duration-200 hover:scale-105 text-xs"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.3)',
                                fontSize: '0.75rem',
                                fontWeight: '700'
                            }}
                        >
                            데이터 초기화
                        </button>
                    </div>

                    {/* 데스크탑용 액션 버튼들 */}
                    <div className="hidden sm:flex gap-3 mt-4">
                        <button
                            onClick={downloadExcel}
                            className="px-4 py-2 rounded-lg text-white font-bold transition-all duration-200 hover:scale-105 text-base"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.3)',
                                fontSize: '0.75rem',
                                fontWeight: '700'
                            }}
                        >
                            엑셀 다운로드
                        </button>
                        <button
                            onClick={refreshData}
                            className="px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 text-base"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.3)',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                            }}
                        >
                            새로고침
                        </button>
                        <button
                            onClick={clearAllData}
                            className="px-4 py-2 rounded-lg text-white font-bold transition-all duration-200 hover:scale-105 text-base"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.3)',
                                fontSize: '0.75rem',
                                fontWeight: '700'
                            }}
                        >
                            데이터 초기화
                        </button>
                    </div>
                </div>

                {/* 통계 섹션 헤더 */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">통계 및 점유율</h2>
                    <button
                        onClick={handleToggleStatistics}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-800 transition-colors"
                        style={{
                            background: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                    >
                        <span className="text-sm font-medium">
                            {isStatisticsExpanded ? '숨기기' : '보기'}
                        </span>
                        <svg
                            className={`w-4 h-4 transition-transform duration-200 ${isStatisticsExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* 통계 카드 그리드 */}
                {(isStatisticsExpanded || isStatisticsAnimatingOut) && (
                    <div
                        className={`grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 overflow-hidden transition-all duration-500 ease-in-out ${isStatisticsExpanded
                                ? 'opacity-100 max-h-[1000px] translate-y-0'
                                : 'opacity-0 max-h-0 -translate-y-6'
                            }`}
                        style={isStatisticsExpanded ? {
                            animation: 'slideInFromTop 1s ease-out, zoomIn 1s ease-out'
                        } : {}}
                    >
                        {/* 월간 통계 */}
                        <div className="lg:col-span-1 rounded-xl p-4 sm:p-7 transform transition-all duration-700 ease-out hover:scale-105 hover:shadow-xl" style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
                            backdropFilter: 'blur(15px)',
                            WebkitBackdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
                            animation: 'slideInFromLeft 0.8s ease-out 0.2s both, bounceIn 0.6s ease-out 0.4s both'
                        }}>
                            <div className="mb-4">
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg">월간 통계</h3>
                            </div>
                            <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-12">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">입차</span>
                                    <span className="font-bold text-black text-lg sm:text-xl" style={{ animation: 'zoomInBounce 0.8s ease-out 0.8s both' }}>{statistics.monthlyIn}대</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">출차</span>
                                    <span className="font-bold text-black text-lg sm:text-xl" style={{ animation: 'zoomInBounce 0.8s ease-out 1.0s both' }}>{statistics.monthlyOut}대</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">현재</span>
                                    <span className="font-bold text-black text-lg sm:text-xl" style={{ animation: 'zoomInBounce 0.8s ease-out 1.2s both' }}>{statistics.currentTotal}대</span>
                                </div>
                            </div>
                        </div>

                        {/* 일간 통계 */}
                        <div className="lg:col-span-1 rounded-xl p-4 sm:p-7 transform transition-all duration-700 ease-out hover:scale-105 hover:shadow-xl" style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
                            backdropFilter: 'blur(15px)',
                            WebkitBackdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
                            animation: 'slideInFromLeft 0.8s ease-out 0.4s both, bounceIn 0.6s ease-out 0.6s both'
                        }}>
                            <div className="mb-4">
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg">일간 통계</h3>
                            </div>
                            <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-12">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">입차</span>
                                    <span className="font-bold text-black text-lg sm:text-xl" style={{ animation: 'zoomInBounce 0.8s ease-out 1.0s both' }}>{statistics.todayIn}대</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">출차</span>
                                    <span className="font-bold text-black text-lg sm:text-xl" style={{ animation: 'zoomInBounce 0.8s ease-out 1.2s both' }}>{statistics.todayOut}대</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">점유율</span>
                                    <span className="font-bold text-black text-lg sm:text-xl" style={{ animation: 'zoomInBounce 0.8s ease-out 1.4s both' }}>{((statistics.currentTotal / 80) * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* 점유율 차트 */}
                        <div className="lg:col-span-2 rounded-xl p-6 transform transition-all duration-700 ease-out hover:scale-105 hover:shadow-xl" style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
                            backdropFilter: 'blur(15px)',
                            WebkitBackdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
                            animation: 'slideInFromRight 0.8s ease-out 0.6s both, bounceIn 0.6s ease-out 0.8s both'
                        }}>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">주차장 점유율</h3>
                            </div>
                            <div className="flex justify-end mb-6">
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-black">{statistics.currentTotal}/80</div>
                                    <div className="text-sm text-gray-600">현재 주차중</div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="w-full rounded-full h-4 mb-2" style={{
                                    background: 'rgba(156, 163, 175, 0.3)',
                                    backdropFilter: 'blur(5px)'
                                }}>
                                    <div
                                        className="h-4 rounded-full transition-all duration-1000 ease-out"
                                        style={{
                                            '--target-width': `${Math.min((statistics.currentTotal / 80) * 100, 100)}%`,
                                            width: '0%',
                                            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.8) 0%, rgba(99, 102, 241, 0.8) 100%)',
                                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                                            animation: 'progressFill 2s ease-out 1.0s both'
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>0%</span>
                                    <span className="font-semibold text-black">{((statistics.currentTotal / 80) * 100).toFixed(1)}%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-black">80</div>
                                    <div className="text-xs text-gray-600">전체</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-black">{statistics.currentTotal}</div>
                                    <div className="text-xs text-gray-600">주차중</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-black">{80 - statistics.currentTotal}</div>
                                    <div className="text-xs text-gray-600">빈 자리</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 메인 테이블 섹션 */}
                <div className="space-y-6">
                    {/* 탭 네비게이션 */}
                    <div className="flex justify-center">
                        <div className="inline-flex rounded-xl p-1 gap-2 sm:gap-4" style={{
                            background: 'rgba(255, 255, 255, 0.3)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            {['recent', 'parked', 'exited'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base ${activeTab === tab
                                        ? 'text-white shadow-lg scale-105'
                                        : 'text-gray-600 hover:scale-105'
                                        }`}
                                    style={activeTab === tab ? {
                                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(99, 102, 241, 0.8) 100%)',
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.3)'
                                    } : {
                                        background: 'transparent',
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)'
                                    }}
                                >
                                    {tab === 'recent' && '최근 이벤트'}
                                    {tab === 'parked' && '현재 주차중'}
                                    {tab === 'exited' && '출차된 차량'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 테이블 컨테이너 */}
                    <div className="rounded-xl overflow-hidden" style={{
                        maxHeight: '500px',
                        overflowY: 'auto',
                        background: 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(15px)',
                        WebkitBackdropFilter: 'blur(15px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)'
                    }}>
                        <table className="w-[100%] table-fixed">
                            <thead className="sticky top-0 bg-gray-300 z-10">
                                <tr>
                                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-center text-gray-700 font-semibold w-1/4 text-xs sm:text-base">시간</th>
                                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-center text-gray-700 font-semibold w-1/4 text-xs sm:text-base">구분</th>
                                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-center text-gray-700 font-semibold w-1/4 text-xs sm:text-base">층</th>
                                    <th className="px-2 sm:px-4 py-3 sm:py-4 text-center text-gray-700 font-semibold w-1/4 text-xs sm:text-base">차량번호</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getTabData().length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-lg">
                                            데이터가 없습니다
                                        </td>
                                    </tr>
                                ) : (
                                    getTabData().map((item, idx) => (
                                        <tr key={idx} className={`border-b transition-all duration-200 hover:scale-[1.01] hover:bg-blue-50/50`}
                                            style={{
                                                background: 'rgba(59, 130, 246, 0.05)'
                                            }}>
                                            <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 w-1/4">{item.시간}</td>
                                            <td className="px-2 sm:px-4 py-3 sm:py-4 w-1/4">
                                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-blue-800`}
                                                    style={{
                                                        background: 'rgba(59, 130, 246, 0.2)',
                                                        backdropFilter: 'blur(5px)',
                                                        WebkitBackdropFilter: 'blur(5px)'
                                                    }}>
                                                    {item.구분}
                                                </span>
                                            </td>
                                            <td className="px-2 sm:px-4 py-3 sm:py-4 text-center font-semibold text-gray-700 w-1/4 text-xs sm:text-sm">{item.층}</td>
                                            <td className="px-2 sm:px-4 py-3 sm:py-4 text-center font-bold text-lg sm:text-xl text-gray-800 w-1/4">{item.차번}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EventMonitor;