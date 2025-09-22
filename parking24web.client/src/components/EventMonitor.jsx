import React, { useState, useEffect, useRef, useCallback } from 'react';

const EventMonitor = ({ sensorData }) => {
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
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const prevDataRef = useRef(null);
    const STORAGE_KEY = 'parkingEvents';

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

    // 차량 검색
    const searchCar = () => {
        if (!searchCarNumber) {
            alert('차량번호를 입력하세요');
            return;
        }

        const found = currentParked.find(car =>
            car.차번.includes(searchCarNumber)
        );

        if (found) {
            alert(`🚗 ${found.차번}번 차량\n📍 위치: ${found.층}층\n🎯 슬롯: ${found.슬롯}`);
        } else {
            // 최근 출차 기록에서 찾기
            const recentExit = exitedCars.find(car =>
                car.차번.includes(searchCarNumber)
            );

            if (recentExit) {
                alert(`🚗 ${recentExit.차번}번 차량\n❌ 출차 완료\n⏰ 출차시간: ${recentExit.시간}`);
            } else {
                alert('해당 차량을 찾을 수 없습니다');
            }
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

    // 초기 데이터 로드
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const events = JSON.parse(stored);
            setRecentEvents(events);
            updateStatistics(events);

            // 출차 차량만 필터
            const exited = events.filter(e => e.구분 === '출차');
            setExitedCars(exited);
        }
    }, []);

    // PLC 데이터 변화 감지
    useEffect(() => {
        if (!sensorData?.rawData) return;

        // 현재 주차중 차량 추출
        const parked = [];
        for (let i = 101; i <= 180; i++) {
            const value = sensorData.rawData[i];
            if (value !== 0) {
                const slotNumber = i - 100;
                const floor = Math.ceil(slotNumber / 2);
                const isOdd = slotNumber % 2 === 1;

                parked.push({
                    시간: new Date().toLocaleTimeString('ko-KR'),
                    구분: '주차중',
                    층: floor,
                    차번: value.toString().padStart(4, '0'),
                    슬롯: `${slotNumber}번 (${isOdd ? '홀수' : '짝수'})`
                });
            }
        }
        setCurrentParked(parked);

        // 이전 데이터와 비교
        if (prevDataRef.current) {
            detectParkingEvents(prevDataRef.current, sensorData.rawData);
        }

        prevDataRef.current = [...sensorData.rawData];

        setStatistics(prev => ({
            ...prev,
            currentTotal: parked.length
        }));

    }, [sensorData]);

    // 입출차 이벤트 감지
    const detectParkingEvents = (prevData, currentData) => {
        const newEvents = [];
        const now = new Date();

        for (let i = 101; i <= 180; i++) {
            const prev = prevData[i] || 0;
            const curr = currentData[i] || 0;

            if (prev === 0 && curr !== 0) {
                // 입차
                const slotNumber = i - 100;
                const floor = Math.ceil(slotNumber / 2);

                const event = {
                    id: Date.now() + Math.random(),
                    timestamp: now.toISOString(),
                    시간: now.toLocaleTimeString('ko-KR'),
                    날짜: now.toLocaleDateString('ko-KR'),
                    구분: '입차',
                    층: floor,
                    차번: curr.toString().padStart(4, '0'),
                    슬롯: slotNumber
                };

                newEvents.push(event);
                showToast(`🚗 입차: ${event.차번} (${event.층}층)`);

            } else if (prev !== 0 && curr === 0) {
                // 출차
                const slotNumber = i - 100;
                const floor = Math.ceil(slotNumber / 2);

                const event = {
                    id: Date.now() + Math.random(),
                    timestamp: now.toISOString(),
                    시간: now.toLocaleTimeString('ko-KR'),
                    날짜: now.toLocaleDateString('ko-KR'),
                    구분: '출차',
                    층: floor,
                    차번: prev.toString().padStart(4, '0'),
                    슬롯: slotNumber
                };

                newEvents.push(event);
                showToast(`🚙 출차: ${event.차번} (${event.층}층)`);
            }
        }

        if (newEvents.length > 0) {
            const updatedEvents = [...newEvents, ...recentEvents].slice(0, 100);
            setRecentEvents(updatedEvents);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
            updateStatistics(updatedEvents);

            const exited = newEvents.filter(e => e.구분 === '출차');
            setExitedCars(prev => [...exited, ...prev].slice(0, 50));
        }
    };

    // 통계 업데이트
    const updateStatistics = (events) => {
        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();

        const todayEvents = events.filter(e =>
            new Date(e.timestamp).toDateString() === today
        );

        const monthEvents = events.filter(e =>
            new Date(e.timestamp).getMonth() === thisMonth
        );

        setStatistics(prev => ({
            ...prev,
            todayIn: todayEvents.filter(e => e.구분 === '입차').length,
            todayOut: todayEvents.filter(e => e.구분 === '출차').length,
            monthlyIn: monthEvents.filter(e => e.구분 === '입차').length,
            monthlyOut: monthEvents.filter(e => e.구분 === '출차').length
        }));
    };

    // 데이터 초기화
    const clearAllData = () => {
        if (window.confirm('⚠️ 모든 입출차 데이터를 초기화하시겠습니까?\n복구할 수 없습니다!')) {
            localStorage.removeItem(STORAGE_KEY);
            setRecentEvents([]);
            setExitedCars([]);
            updateStatistics([]);
            showToast('🗑️ 데이터 초기화 완료');
        }
    };

    // 정렬 함수
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // 데이터 정렬 함수
    const sortData = (data) => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // 시간 정렬을 위한 특별 처리
            if (sortConfig.key === '시간') {
                aValue = new Date(`2000-01-01 ${aValue}`);
                bValue = new Date(`2000-01-01 ${bValue}`);
            }
            // 층 정렬을 위한 숫자 변환
            else if (sortConfig.key === '층') {
                aValue = parseInt(aValue) || 0;
                bValue = parseInt(bValue) || 0;
            }
            // 차량번호 정렬을 위한 숫자 변환
            else if (sortConfig.key === '차번') {
                aValue = parseInt(aValue) || 0;
                bValue = parseInt(bValue) || 0;
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    // 탭별 데이터
    const getTabData = () => {
        let data = [];
        switch (activeTab) {
            case 'recent':
                data = recentEvents;
                break;
            case 'parked':
                data = currentParked;
                break;
            case 'exited':
                data = exitedCars;
                break;
            default:
                data = [];
        }
        return sortData(data);
    };

    // 통계 섹션 토글 (펼침: 기존 애니메이션, 숨김: 접힘 애니메이션 후 언마운트)
    const handleToggleStatistics = () => {
        if (isStatisticsExpanded) {
            setIsStatisticsAnimatingOut(true);
            setIsStatisticsExpanded(false);
            // 접힘 트랜지션 시간과 맞춤 (500ms)
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
                <div className="flex justify-center mb-4">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">입출차 현황 모니터링</h2>
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

                {/* 모바일용 액션 버튼들 - 입력칸 바로 아래 */}
                <div className="flex gap-3 sm:hidden mt-3 justify-start">
                    <button 
                        onClick={downloadExcel} 
                        className="h-6 w-16 min-h-0 min-w-0 p-0 m-0 rounded-full text-gray-700 font-bold transition-all duration-200 hover:scale-105 text-xs leading-none flex items-center justify-center"
                        style={{
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
                        onClick={() => {
                            // 데이터 새로고침
                            const stored = localStorage.getItem(STORAGE_KEY);
                            if (stored) {
                                const events = JSON.parse(stored);
                                setRecentEvents(events);
                                updateStatistics(events);
                                const exited = events.filter(e => e.구분 === '출차');
                                setExitedCars(exited);
                            }
                            showToast(' 데이터 새로고침 완료');
                        }} 
                        className="h-6 w-16 min-h-0 min-w-0 p-0 m-0 rounded-full text-gray-700 font-medium transition-all duration-200 hover:scale-105 text-xs leading-none flex items-center justify-center"
                        style={{
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
                        className="h-6 w-16 min-h-0 min-w-0 p-0 m-0 rounded-full text-gray-700 font-bold transition-all duration-200 hover:scale-105 text-xs leading-none flex items-center justify-center"
                        style={{
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

                {/* 데스크탑용 액션 버튼들 */}
                <div className="hidden sm:flex gap-3 mt-4">
                    <button 
                        onClick={downloadExcel} 
                        className="px-4 py-2 rounded-full text-gray-700 font-bold transition-all duration-200 hover:scale-105 text-base"
                        style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
                            fontSize: '0.75rem',
                            fontWeight: '700'
                        }}
                    >
                        엑셀 다운로드
                    </button>
                    <button 
                        onClick={() => {
                            // 데이터 새로고침
                            const stored = localStorage.getItem(STORAGE_KEY);
                            if (stored) {
                                const events = JSON.parse(stored);
                                setRecentEvents(events);
                                updateStatistics(events);
                                const exited = events.filter(e => e.구분 === '출차');
                                setExitedCars(exited);
                            }
                            showToast(' 데이터 새로고침 완료');
                        }} 
                        className="px-4 py-2 rounded-full text-gray-700 font-medium transition-all duration-200 hover:scale-105 text-base"
                        style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                        }}
                    >
                        새로고침
                    </button>
                    <button 
                        onClick={clearAllData} 
                        className="px-4 py-2 rounded-full text-gray-700 font-bold transition-all duration-200 hover:scale-105 text-base"
                        style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
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
                    className={`grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 overflow-hidden transition-all duration-500 ease-in-out ${
                        isStatisticsExpanded 
                            ? 'opacity-100 max-h-[1000px] translate-y-0' 
                            : 'opacity-0 max-h-0 -translate-y-6'
                    }`}
                    style={isStatisticsExpanded ? {
                        // 펼침: 기존 애니메이션 유지 (각 카드들도 자체 애니메이션 유지)
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
                        <thead className="sticky top-0 bg-gray-500 text-white z-10">
                            <tr>
                                <th 
                                    className="px-2 sm:px-4 py-3 sm:py-4 text-center text-white font-semibold w-1/4 text-xs sm:text-base cursor-pointer hover:bg-gray-600 transition-colors duration-200 select-none"
                                    onClick={() => handleSort('시간')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        시간
                                        {sortConfig.key === '시간' && (
                                            <span className="text-xs">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-2 sm:px-4 py-3 sm:py-4 text-center text-white font-semibold w-1/4 text-xs sm:text-base cursor-pointer hover:bg-gray-600 transition-colors duration-200 select-none"
                                    onClick={() => handleSort('구분')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        구분
                                        {sortConfig.key === '구분' && (
                                            <span className="text-xs">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-2 sm:px-4 py-3 sm:py-4 text-center text-white font-semibold w-1/4 text-xs sm:text-base cursor-pointer hover:bg-gray-600 transition-colors duration-200 select-none"
                                    onClick={() => handleSort('층')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        층
                                        {sortConfig.key === '층' && (
                                            <span className="text-xs">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-2 sm:px-4 py-3 sm:py-4 text-center text-white font-semibold w-1/4 text-xs sm:text-base cursor-pointer hover:bg-gray-600 transition-colors duration-200 select-none"
                                    onClick={() => handleSort('차번')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        차량번호
                                        {sortConfig.key === '차번' && (
                                            <span className="text-xs">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
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
                                    <tr key={idx} className={`border-b transition-all duration-200 hover:scale-[1.01] hover:bg-purple-50/50`}
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


