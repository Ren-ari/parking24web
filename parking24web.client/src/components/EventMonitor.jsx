import React, { useState, useEffect, useRef, useCallback } from 'react';

const EventMonitor = ({ sensorData }) => {
    const [activeTab, setActiveTab] = useState('recent');
    const [recentEvents, setRecentEvents] = useState([]);
    const [currentParked, setCurrentParked] = useState([]);
    const [exitedCars, setExitedCars] = useState([]);
    const [searchCarNumber, setSearchCarNumber] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [statistics, setStatistics] = useState({
        todayIn: 0,
        todayOut: 0,
        currentTotal: 0,
        monthlyIn: 0,
        monthlyOut: 0
    });

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

    return (
        <div className="rounded-2xl p-4 border border-white/20 shadow-xl relative" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(25px)'
        }}>
            {/* 토스트 알림 */}
            {toastMessage && (
                <div className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
                    {toastMessage}
                </div>
            )}

            {/* 헤더 */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-bold text-white">입출차 현황 모니터링</h2>
                    <span className="text-white/90 text-sm">
                        {new Date().toLocaleTimeString('ko-KR')} - 이벤트 그리드 업데이트
                    </span>
                </div>

                <div className="flex gap-6 text-white mb-3">
                    <div>현재 주차중: <span className="text-orange-300 font-bold text-lg">{statistics.currentTotal}대</span></div>
                    <div>금일 입차: <span className="text-green-300 font-bold">{statistics.todayIn}건</span></div>
                    <div>금일 출차: <span className="text-red-300 font-bold">{statistics.todayOut}건</span></div>
                </div>

                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        placeholder="차량번호 검색 (예: 5430)"
                        value={searchCarNumber}
                        onChange={(e) => setSearchCarNumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchCar()}
                        className="px-3 py-1 rounded text-black w-48"
                    />
                    <button onClick={searchCar} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                        🔍 검색
                    </button>
                    <button onClick={downloadExcel} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                        📊 엑셀
                    </button>
                    <button onClick={() => window.location.reload()} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">
                        🔄 새로고침
                    </button>
                    <button onClick={clearAllData} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                        🗑️ 초기화
                    </button>
                </div>
            </div>

            <div className="flex gap-4">
                {/* 왼쪽 통계 */}
                <div className="w-64 bg-gradient-to-b from-green-50 to-green-100 rounded-xl p-4">
                    <h3 className="font-bold text-green-800 mb-3">
                        📅 {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 통계
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div>🚙 입차: <span className="font-bold">{statistics.monthlyIn}대</span></div>
                        <div>🚗 출차: <span className="font-bold">{statistics.monthlyOut}대</span></div>
                        <div>🅿️ 현재: <span className="font-bold">{statistics.currentTotal}대</span></div>
                    </div>

                    <hr className="my-4 border-green-300" />

                    <h3 className="font-bold text-green-800 mb-3">
                        📊 오늘 ({new Date().toLocaleDateString('ko-KR')})
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div>🚙 입차: <span className="font-bold text-blue-600">{statistics.todayIn}대</span></div>
                        <div>🚗 출차: <span className="font-bold text-red-600">{statistics.todayOut}대</span></div>
                        <div>📈 점유율: <span className="font-bold">{((statistics.currentTotal / 80) * 100).toFixed(1)}%</span></div>
                    </div>

                    <div className="mt-4 p-2 bg-white rounded-lg">
                        <div className="text-xs text-gray-600">최대 주차: 80대</div>
                        <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
                            <div
                                className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all"
                                style={{ width: `${Math.min((statistics.currentTotal / 80) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* 메인 테이블 */}
                <div className="flex-1">
                    <div className="flex gap-2 mb-3">
                        {['recent', 'parked', 'exited'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === tab
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                                        : 'bg-gray-200 hover:bg-gray-300'
                                    }`}>
                                {tab === 'recent' && '📋 최근 이벤트'}
                                {tab === 'parked' && '🅿️ 현재 주차중'}
                                {tab === 'exited' && '🚗 출차된 차량'}
                            </button>
                        ))}
                    </div>

                    <div className="border rounded-lg overflow-hidden bg-white" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left">시간</th>
                                    <th className="px-4 py-2 text-left">구분</th>
                                    <th className="px-4 py-2 text-center">층</th>
                                    <th className="px-4 py-2 text-center">차량번호</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getTabData().length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-8 text-gray-500">
                                            데이터가 없습니다
                                        </td>
                                    </tr>
                                ) : (
                                    getTabData().map((item, idx) => (
                                        <tr key={idx} className={`border-b hover:bg-gray-50 transition-colors ${item.구분 === '입차' ? 'bg-blue-50' :
                                                item.구분 === '출차' ? 'bg-red-50' :
                                                    'bg-green-50'
                                            }`}>
                                            <td className="px-4 py-2 text-sm">{item.시간}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${item.구분 === '입차' ? 'bg-blue-200 text-blue-800' :
                                                        item.구분 === '출차' ? 'bg-red-200 text-red-800' :
                                                            'bg-green-200 text-green-800'
                                                    }`}>
                                                    {item.구분}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-center font-semibold">{item.층}</td>
                                            <td className="px-4 py-2 text-center font-bold text-lg">{item.차번}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventMonitor;