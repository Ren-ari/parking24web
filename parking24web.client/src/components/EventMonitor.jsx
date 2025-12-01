import React, { useState, useEffect, useCallback, useMemo } from 'react';
import siteConfig from '../../config/sokcho2Config.js';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import signalRService from '../services/SignalRService';
import AnalyticsDashboard from './AnalyticsDashboard';

const EventMonitor = ({ sensorData, isPLCConnected }) => {
    console.log('EventMonitor 렌더링됨:', { sensorData, isPLCConnected });

    const { theme } = useTheme();
    const { isClient } = useAuth();
    const [showConnectionButtons, setShowConnectionButtons] = useState(false);
    const [activeTab, setActiveTab] = useState('recent');
    const [recentEvents, setRecentEvents] = useState([]);
    const [currentParked, setCurrentParked] = useState([]);
    const [exitedCars, setExitedCars] = useState([]);
    const [searchCarNumber, setSearchCarNumber] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchResultExpanded, setIsSearchResultExpanded] = useState(false);
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
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // 날짜 범위 계산
    const getDateRanges = () => {
        const now = new Date();
        const today = now.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        const monthEnd = now.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

        return { today, monthStart, monthEnd };
    };

    const dateRanges = getDateRanges();

    // 토스트 알림 표시
    const showToast = useCallback((message) => {
        setToastMessage(message);
    }, []);

    // 토스트 메시지 타이머 관리
    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(''), 3000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    // API 호출 함수들
    const fetchRecentEvents = async () => {
        try {
            const apiBaseUrl = window.location.host.includes(':5173')
                ? `http://localhost:${siteConfig.api.devPort}`
                : siteConfig.api.baseUrl;
            const response = await fetch(`${apiBaseUrl}${siteConfig.api.endpoints.recent}`);
            const data = await response.json();

            const formattedEvents = data.map(event => ({
                시간: new Date(event.timestamp).toLocaleTimeString('ko-KR'),
                날짜: new Date(event.timestamp).toLocaleDateString('ko-KR'),
                구분: event.eventType,
                차판: event.slotNumber,
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
            const apiBaseUrl = window.location.host.includes(':5173')
                ? `http://localhost:${siteConfig.api.devPort}`
                : siteConfig.api.baseUrl;
            const response = await fetch(`${apiBaseUrl}${siteConfig.api.endpoints.parked}`);
            const data = await response.json();

            const formattedParked = data.map(vehicle => ({
                시간: new Date().toLocaleTimeString('ko-KR'),
                구분: '주차중',
                차판: vehicle.slotNumber,
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
            const apiBaseUrl = window.location.host.includes(':5173')
                ? `http://localhost:${siteConfig.api.devPort}`
                : siteConfig.api.baseUrl;
            const response = await fetch(`${apiBaseUrl}${siteConfig.api.endpoints.statistics}`);
            const data = await response.json();
            setStatistics(data);
        } catch (error) {
            console.error('통계 로드 실패:', error);
        }
    };

    const searchCar = async () => {
        if (!searchCarNumber) {
            showToast('⚠️ 차량번호를 입력하세요');
            return;
        }

        try {
            const apiBaseUrl = window.location.host.includes(':5173')
                ? `http://localhost:${siteConfig.api.devPort}`
                : siteConfig.api.baseUrl;

            // 1. 과거 이벤트 검색
            const eventsResponse = await fetch(`${apiBaseUrl}${siteConfig.api.endpoints.search}/${searchCarNumber}`);
            const eventsData = await eventsResponse.json();
            console.log('📜 DB 이벤트 데이터:', eventsData);
            console.log('📜 events 배열:', eventsData.events);
            console.log('📜 events 길이:', eventsData.events?.length);

            // 2. 현재 주차중 차량 검색
            const parkedResponse = await fetch(`${apiBaseUrl}${siteConfig.api.endpoints.parked}`);
            const parkedData = await parkedResponse.json();
            console.log('🔍 검색 차량번호:', searchCarNumber, '(타입:', typeof searchCarNumber, ')');
            console.log('📦 주차중 데이터:', parkedData);
            const currentParked = parkedData.filter(v => {
                console.log(`  비교: ${v.carNumber} (${typeof v.carNumber}) === ${searchCarNumber} (${typeof searchCarNumber})`);
                return v.carNumber === searchCarNumber;
            });
            console.log('✅ 검색 결과:', currentParked);

            // 3. 결과 합치기
            const allResults = [];

            // 현재 주차중이면 맨 위에 추가
            if (currentParked.length > 0) {
                currentParked.forEach(vehicle => {
                    allResults.push({
                        시간: new Date().toLocaleTimeString('ko-KR'),
                        날짜: new Date().toLocaleDateString('ko-KR'),
                        구분: '주차중',
                        차판: vehicle.slotNumber,
                        차번: vehicle.carNumber
                    });
                });
            }

            // 과거 이벤트 추가 (배열 처리)
            if (eventsData && eventsData.found && eventsData.events) {
                eventsData.events.forEach(event => {
                    allResults.push({
                        시간: new Date(event.timestamp).toLocaleTimeString('ko-KR'),
                        날짜: new Date(event.timestamp).toLocaleDateString('ko-KR'),
                        구분: event.eventType,
                        차판: event.slotNumber || '-',
                        차번: event.carNumber
                    });
                });
            }

            if (allResults.length > 0) {
                setSearchResults(allResults);
                setIsSearchResultExpanded(true);
                showToast(`🔍 ${searchCarNumber}번 차량 ${allResults.length}건 검색 완료`);
            } else {
                setSearchResults([]);
                showToast('⚠️ 해당 차량을 찾을 수 없습니다');
            }
        } catch (error) {
            console.error('차량 검색 실패:', error);
            showToast('❌ 검색 중 오류가 발생했습니다');
        }
    };

    // 엑셀 다운로드
    const downloadExcel = () => {
        const BOM = '\uFEFF';
        const csvContent = BOM + "시간,날짜,구분,차판번호,차량번호,슬롯\n" +
            recentEvents.map(e => `${e.시간},${e.날짜},${e.구분},${e.차판},${e.차번},${e.슬롯}`).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `입출차현황_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '-')}.csv`;
        a.click();
        showToast('📊 엑셀 다운로드 완료!');
    };

    // loadAllData를 useCallback으로 정의
    const loadAllData = useCallback(async () => {
        await Promise.all([fetchRecentEvents(), fetchParkedVehicles(), fetchStatistics()]);
    }, []);

    // 초기 데이터 로드 및 주기적 업데이트
    useEffect(() => {
        loadAllData();
        const interval = setInterval(loadAllData, 30000);
        return () => clearInterval(interval);
    }, [loadAllData]);

    // PLC 연결 완료 시 데이터 다시 로드
    useEffect(() => {
        if (isPLCConnected && isClient()) {
            console.log('PLC 연결 완료 - 1초 후 데이터 로드');
            setTimeout(() => {
                loadAllData();
            }, 1000);
        }
    }, [isPLCConnected]);

    // CLIENT 자동연결 로직
    useEffect(() => {
        if (!isClient()) return;
        if (isPLCConnected) return;
        const buttons = siteConfig.connectionConfig.buttons;
        if (buttons.length === 1) {
            console.log('CLIENT 자동연결 시작:', buttons[0].name);
            signalRService.connectToPLC(buttons[0].ip, buttons[0].port).catch(err => console.error('자동연결 실패:', err));
        } else if (buttons.length > 1) {
            setShowConnectionButtons(true);
        }
    }, [isClient]);

    // 데이터 초기화 (ADMIN만)
    const clearAllData = () => {
        showToast('⚠️ 데이터 초기화는 서버 관리자만 가능합니다.');
    };

    // 정렬 함수
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // 데이터 정렬
    const sortData = (data) => {
        if (!sortConfig.key) return data;
        return [...data].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];
            if (sortConfig.key === '시간') {
                aValue = new Date(`2000-01-01 ${aValue}`);
                bValue = new Date(`2000-01-01 ${bValue}`);
            } else if (sortConfig.key === '차판' || sortConfig.key === '차번') {
                aValue = parseInt(aValue) || 0;
                bValue = parseInt(bValue) || 0;
            }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    // 탭별 데이터
    const getTabData = () => {
        let data = [];
        switch (activeTab) {
            case 'recent': data = recentEvents; break;
            case 'parked': data = currentParked; break;
            case 'exited': data = exitedCars; break;
            default: data = [];
        }
        return sortData(data);
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

    // 테마별 스타일 메모이제이션
    const searchInputStyle = useMemo(() => 
        theme === 'space' 
            ? {
                background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }
            : {}
    , [theme]);

    const buttonStyle = useMemo(() => 
        theme === 'space'
            ? {
                background: 'linear-gradient(145deg, #e5e7eb 0%, #d1d5db 40%, #9ca3af 100%)',
                border: '1px solid rgba(156, 163, 175, 0.8)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5), 0 4px 12px rgba(0,0,0,0.2)'
            }
            : {}
    , [theme]);

    const desktopButtonStyle = useMemo(() =>
        theme === 'space'
            ? {
                background: 'linear-gradient(145deg, #e5e7eb 0%, #9ca3af 100%)',
                border: '1px solid rgba(156, 163, 175, 0.8)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.7), 0 6px 16px rgba(0,0,0,0.25)',
                fontSize: '0.75rem'
            }
            : {
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                fontSize: '0.75rem'
            }
    , [theme]);

    const searchResultContainerStyle = useMemo(() =>
        theme === 'space'
            ? {
                background: 'rgba(20, 20, 20, 0.95)',
                backdropFilter: 'blur(25px)',
                border: '1px solid rgba(75, 85, 99, 0.3)'
            }
            : {
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(25px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }
    , [theme]);

    const searchResultHeaderStyle = useMemo(() =>
        theme === 'space'
            ? {
                background: 'rgba(20, 20, 20, 0.95)',
                borderBottom: '1px solid rgba(75, 85, 99, 0.3)'
            }
            : {
                background: 'rgba(255, 255, 255, 0.9)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
            }
    , [theme]);

    const statisticsToggleStyle = useMemo(() =>
        theme === 'space'
            ? { background: 'transparent' }
            : {
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }
    , [theme]);

    const tabContainerStyle = useMemo(() =>
        theme === 'space'
            ? {}
            : {
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }
    , [theme]);

    const getTabButtonStyle = useCallback((isActive) => {
        if (isActive) {
            return theme === 'space'
                ? {
                    background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.9) 0%, rgba(167, 139, 250, 0.9) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }
                : {
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(99, 102, 241, 0.8) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                };
        }
        return { background: 'transparent' };
    }, [theme]);

    const tableContainerStyle = useMemo(() =>
        theme === 'space'
            ? {}
            : {
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }
    , [theme]);

    return (
        <>
            <style>
                {`
                    @keyframes slideInFromTop { 0% { transform: translateY(-100px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
                    @keyframes slideInFromLeft { 0% { transform: translateX(-100px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
                    @keyframes slideInFromRight { 0% { transform: translateX(100px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
                    @keyframes zoomIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                    @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
                    @keyframes zoomInBounce { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
                    @keyframes progressFill { 0% { width: 0%; } 100% { width: var(--target-width); } }
                `}
            </style>
            <div className={`rounded-2xl p-6 border shadow-xl relative ${theme === 'space' ? 'border-gray-700' : 'border-gray-200'}`} style={{

                ...(theme === 'space'
                    ? {
                        background: 'rgba(20, 20, 20, 0.95)',
                        backdropFilter: 'blur(25px)',
                        WebkitBackdropFilter: 'blur(25px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
                    }
                    : {
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
                    })
            }}>


                {/* 토스트 알림 */}
                {toastMessage && (
                    <div className="absolute top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
                        <span className="text-white text-sm font-medium">{toastMessage}</span>
                    </div>
                )}

                {/* CLIENT 연결 선택 버튼 */}
                {showConnectionButtons && !isPLCConnected && (
                    <div className="mb-6 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                        <h3 className="text-xl font-bold mb-4 text-center text-purple-700">연결할 주차장을 선택하세요</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {siteConfig.connectionConfig.buttons.map((button, index) => (
                                <button key={index} onClick={() => { console.log('CLIENT 수동 연결:', button.name); signalRService.connectToPLC(button.ip, button.port).then(() => setShowConnectionButtons(false)).catch(err => console.error('연결 실패:', err)); }} className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all">
                                    {button.name}
                                    <div className="text-xs mt-1 opacity-80">{button.ip}:{button.port}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {/* 헤더 */}
                <div className={`rounded-xl p-6 mb-6 ${theme === 'space' ? 'bg-gradient-to-br from-purple-600/80 via-purple-700/70 to-purple-800/80 shadow-lg shadow-purple-600/30' : 'bg-gradient-to-br from-blue-500/90 via-indigo-500/80 to-blue-600/90 shadow-lg'}`}>
                    <div className="flex justify-center mb-4">
                        <h2 className="text-2xl font-bold mb-8 text-center text-white">입출차 현황 모니터링</h2>
                    </div>


                    {/* 검색창 */}
                    <div className="flex gap-2 md:gap-3 items-center">
                        <input
                            type="text"
                            value={searchCarNumber}
                            onChange={(e) => setSearchCarNumber(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchCar()}
                            className={`flex-1 min-w-0 px-2 md:px-4 py-3 md:py-2 rounded-lg focus:outline-none text-sm md:text-base ${theme === 'space' ? 'text-white' : 'text-gray-700 border border-gray-300 bg-white focus:ring-2 focus:ring-blue-300'}`}
                            style={searchInputStyle}
                            placeholder=""
                        />
                        <button
                            onClick={searchCar}
                            className={`flex-shrink-0 px-3 md:px-4 py-3 md:py-2 rounded-lg font-medium transition-all duration-300 ease-in-out hover:scale-105 text-sm md:text-base text-white`}
                            style={{
                                background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)'
                            }}
                        >
                            검색
                        </button>
                    </div>


                    {/* 액션 버튼들 - 모바일 */}
                    <div className="flex gap-1 sm:hidden mt-4">

                        <button
                            onClick={downloadExcel}
                            className="h-6 w-16 min-h-0 min-w-0 p-0 m-0 rounded-full text-gray-800 font-bold transition-all duration-200 hover:scale-105 text-xs leading-none flex items-center justify-center"
                            style={theme === 'space' ? {
                                background: 'linear-gradient(145deg, #e5e7eb 0%, #d1d5db 40%, #9ca3af 100%)',
                                border: '1px solid rgba(156, 163, 175, 0.8)',
                                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -1px 2px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2)'
                            } : {
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            엑셀
                        </button>
                        <button
                            onClick={loadAllData}
                            className="h-6 w-16 min-h-0 min-w-0 p-0 m-0 rounded-full text-gray-800 font-bold transition-all duration-200 hover:scale-105 text-xs leading-none flex items-center justify-center"
                            style={theme === 'space' ? {
                                background: 'linear-gradient(145deg, #e5e7eb 0%, #d1d5db 40%, #9ca3af 100%)',
                                border: '1px solid rgba(156, 163, 175, 0.8)',
                                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -1px 2px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2)'
                            } : {
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            새로고침
                        </button>
                        <button
                            onClick={clearAllData}
                            className="h-6 w-16 min-h-0 min-w-0 p-0 m-0 rounded-full text-gray-800 font-bold transition-all duration-200 hover:scale-105 text-xs leading-none flex items-center justify-center"
                            style={theme === 'space' ? {
                                background: 'linear-gradient(145deg, #e5e7eb 0%, #d1d5db 40%, #9ca3af 100%)',
                                border: '1px solid rgba(156, 163, 175, 0.8)',
                                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -1px 2px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2)'
                            } : {
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            초기화
                        </button>
                    </div>

                    {/* 액션 버튼들 - 데스크탑 */}
                    <div className="hidden sm:flex gap-3 mt-4">
                        <button onClick={downloadExcel} className="px-4 py-2 rounded-full text-gray-800 font-bold hover:scale-105" style={desktopButtonStyle}>엑셀 다운로드</button>
                        <button onClick={loadAllData} className="px-4 py-2 rounded-full text-gray-800 font-bold hover:scale-105" style={desktopButtonStyle}>새로고침</button>
                        {!isClient() && (
                            <button onClick={clearAllData} className="px-4 py-2 rounded-full text-gray-800 font-bold hover:scale-105" style={desktopButtonStyle}>데이터 초기화</button>
                        )}
                    </div>
                </div>

                {/* 검색 결과 섹션 */}
                {searchResults.length > 0 && (
                    <div className={`mb-6 rounded-2xl overflow-hidden shadow-xl ${theme === 'space' ? 'border-gray-700' : 'border-gray-200'}`} style={searchResultContainerStyle}>
                        <div className="p-4 sm:p-6 flex justify-between items-center cursor-pointer" onClick={() => setIsSearchResultExpanded(!isSearchResultExpanded)} style={searchResultHeaderStyle}>
                            <h3 className={`text-lg font-bold ${theme === 'space' ? 'bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>{searchCarNumber}번 차량 검색 결과 ({searchResults.length}건)</h3>
                            <svg className={`w-5 h-5 transition-transform duration-500 ${isSearchResultExpanded ? 'rotate-180' : ''} ${theme === 'space' ? 'text-purple-500' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        <div className={`overflow-hidden transition-all duration-700 ${isSearchResultExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-4 sm:p-6">
                                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                    <table className="w-full">
                                        <thead className={`text-white ${theme === 'space' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
                                            <tr>
                                                <th className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap">날짜</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap">시간</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap">구분</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap">차판</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold whitespace-nowrap">차량번호</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${theme === 'space' ? 'divide-purple-600/30 bg-gray-900/95' : 'divide-gray-200 bg-white'}`}>
                                            {searchResults.map((item, idx) => (
                                                <tr key={idx} className={`transition-all ${theme === 'space' ? 'hover:bg-purple-800/50' : 'hover:bg-blue-50/50'}`}>
                                                    <td className="px-4 py-3 text-center"><span className={`text-sm ${theme === 'space' ? 'text-purple-300' : 'text-gray-600'}`}>{item.날짜}</span></td>
                                                    <td className="px-4 py-3 text-center"><span className={`text-sm font-mono ${theme === 'space' ? 'text-purple-300' : 'text-gray-600'}`}>{item.시간}</span></td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                                            theme === 'space'
                                                                ? (item.구분 === '입차' ? 'bg-purple-500 text-white border-2 border-purple-600' :
                                                                    item.구분 === '주차중' ? 'bg-green-500 text-white border-2 border-green-600' :
                                                                        'bg-cyan-500 text-white border-2 border-cyan-600')
                                                                : (item.구분 === '입차' ? 'bg-blue-500 text-white border-2 border-blue-600' :
                                                                    item.구분 === '주차중' ? 'bg-green-500 text-white border-2 border-green-600' :
                                                                        'bg-red-500 text-white border-2 border-red-600')
                                                            }`}>{item.구분}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`text-sm font-bold ${theme === 'space' ? 'text-purple-300' : 'text-gray-600'}`}>{item.차판}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center"><div className={`text-lg font-bold ${theme === 'space' ? 'text-purple-300' : 'text-gray-800'}`}>{item.차번}</div></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 통계 섹션 헤더 */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-bold ${theme === 'space' ? 'bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>통계 및 점유율</h2>
                    <button onClick={handleToggleStatistics} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === 'space' ? 'text-gray-300 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`} style={statisticsToggleStyle}>
                        <span className="text-sm font-medium">{isStatisticsExpanded ? '숨기기' : '보기'}</span>
                        <svg className={`w-4 h-4 transition-transform ${isStatisticsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                </div>

                {/* 분석 대시보드 */}
                {(isStatisticsExpanded || isStatisticsAnimatingOut) && (
                    <div className={`transition-all duration-500 mb-8 ${isStatisticsExpanded ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0'} overflow-hidden`}>
                        <AnalyticsDashboard />
                    </div>
                )}


                {/* 메인 테이블 섹션 */}
                <div className="space-y-6">
                    {/* 탭 네비게이션 */}
                    <div className="flex justify-center">
                        <div className={`inline-flex rounded-2xl p-1 gap-1 shadow-lg ${theme === 'space' ? 'bg-gradient-to-br from-purple-600/80 via-purple-700/70 to-purple-800/80' : ''}`} style={tabContainerStyle}>
                            {['recent', 'parked', 'exited'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 sm:px-8 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all transform ${activeTab === tab ? 'text-white shadow-lg scale-105' : 'text-gray-300 hover:text-gray-200'}`} style={getTabButtonStyle(activeTab === tab)}>
                                    {tab === 'recent' && '최근 이벤트'}
                                    {tab === 'parked' && '현재 주차중'}
                                    {tab === 'exited' && '출차된 차량'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 테이블 */}
                    <div className={`rounded-xl overflow-hidden shadow-2xl ${theme === 'space' ? 'bg-gradient-to-br from-purple-900/80 to-indigo-900/80' : 'bg-white'}`} style={tableContainerStyle}>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={`text-white ${theme === 'space' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
                                    <tr>
                                        <th className={`px-4 py-3 text-center text-xs font-semibold cursor-pointer whitespace-nowrap ${theme === 'space' ? 'hover:bg-purple-700' : 'hover:bg-blue-700'}`} onClick={() => handleSort('날짜')}><div className="flex items-center justify-center space-x-1"><span>날짜</span>{sortConfig.key === '날짜' && <span className="text-yellow-300">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</div></th>
                                        <th className={`px-4 py-3 text-center text-xs font-semibold cursor-pointer whitespace-nowrap ${theme === 'space' ? 'hover:bg-purple-700' : 'hover:bg-blue-700'}`} onClick={() => handleSort('시간')}><div className="flex items-center justify-center space-x-1"><span>시간</span>{sortConfig.key === '시간' && <span className="text-yellow-300">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</div></th>
                                        <th className={`px-4 py-3 text-center text-xs font-semibold cursor-pointer whitespace-nowrap ${theme === 'space' ? 'hover:bg-purple-700' : 'hover:bg-blue-700'}`} onClick={() => handleSort('구분')}><div className="flex items-center justify-center space-x-1"><span>구분</span>{sortConfig.key === '구분' && <span className="text-yellow-300">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</div></th>
                                        <th className={`px-4 py-3 text-center text-xs font-semibold cursor-pointer whitespace-nowrap ${theme === 'space' ? 'hover:bg-purple-700' : 'hover:bg-blue-700'}`} onClick={() => handleSort('차판')}><div className="flex items-center justify-center space-x-1"><span>차판번호</span>{sortConfig.key === '차판' && <span className="text-yellow-300">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</div></th>
                                        <th className={`px-4 py-3 text-center text-xs font-semibold cursor-pointer whitespace-nowrap ${theme === 'space' ? 'hover:bg-purple-700' : 'hover:bg-blue-700'}`} onClick={() => handleSort('차번')}><div className="flex items-center justify-center space-x-1"><span>차량번호</span>{sortConfig.key === '차번' && <span className="text-yellow-300">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</div></th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${theme === 'space' ? 'divide-purple-600/30 bg-gray-900/95' : 'divide-gray-200 bg-white'}`}>
                                    {getTabData().length === 0 ? (
                                        <tr><td colSpan="5" className={`text-center py-12 text-lg ${theme === 'space' ? 'text-purple-400' : 'text-gray-500'}`}>데이터가 없습니다</td></tr>
                                    ) : (
                                        getTabData().map((item, idx) => (
                                            <tr key={idx} className={`transition-all ${theme === 'space' ? 'hover:bg-purple-800/50' : 'hover:bg-blue-50/50'}`}>
                                                <td className="px-4 py-3 whitespace-nowrap"><span className={`text-sm ${theme === 'space' ? 'text-purple-300' : 'text-gray-600'}`}>{item.날짜}</span></td>
                                                <td className="px-4 py-3 whitespace-nowrap"><span className={`text-sm font-mono font-semibold ${theme === 'space' ? 'text-purple-300' : 'text-gray-600'}`}>{item.시간}</span></td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                                        theme === 'space'
                                                            ? (item.구분 === '입차' ? 'bg-purple-500 text-white border-2 border-purple-600' :
                                                                item.구분 === '주차중' ? 'bg-green-500 text-white border-2 border-green-600' :
                                                                    'bg-cyan-500 text-white border-2 border-cyan-600')
                                                            : (item.구분 === '입차' ? 'bg-blue-500 text-white border-2 border-blue-600' :
                                                                item.구분 === '주차중' ? 'bg-green-500 text-white border-2 border-green-600' :
                                                                    'bg-red-500 text-white border-2 border-red-600')
                                                        }`}>{item.구분}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                                    <span className={`text-sm font-bold ${theme === 'space' ? 'text-purple-300' : 'text-gray-600'}`}>{item.차판}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center whitespace-nowrap"><div className={`text-lg font-bold ${theme === 'space' ? 'text-purple-300' : 'text-gray-800'}`}>{item.차번}</div></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EventMonitor;    