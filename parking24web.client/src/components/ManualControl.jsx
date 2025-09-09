import React, { useState, useEffect } from 'react';

const ManualControl = ({ isPLCConnected, isAuthenticated, sendCommand, sensorData }) => {
    const [activeCommand, setActiveCommand] = useState(null);
    const [isEmergencyMode, setIsEmergencyMode] = useState(false);
    const [activeTab, setActiveTab] = useState('page1');
    const [showSensors, setShowSensors] = useState(true);
    const [sensorStates, setSensorStates] = useState({
        C28: false, // 턴 0도 확인정지
        C29: false, // 턴 180도 확인정지
        C31: false, // 턴 상승확인
        C32: false, // 턴 하강확인
        C39: false, // 도어열림확인
        C40: false, // 도어닫힘확인
        C41: false, // 도어잠확인
        C42: false, // 좌측동작감지확인1
        C43: false, // 우측동작감지확인1
        C44: false, // 좌도어확인
        C45: false, // 우도어확인
        C53: false, // 도어내확인
    });

    // 센서모니터에서 사용하는 비트 매핑을 활용한 센서 상태 업데이트
    const updateSensorStates = () => {
        if (!sensorData || !sensorData.rawData) return;
        
        // 센서모니터의 비트 매핑에서 필요한 센서들만 추출
        const sensorMappings = [
            { wordIndex: 62, bitIndex: 0, address: 'C28', name: '턴0도확인' },
            { wordIndex: 62, bitIndex: 1, address: 'C29', name: '턴180확인' },
            { wordIndex: 61, bitIndex: 10, address: 'C31', name: '턴상승확인' },
            { wordIndex: 61, bitIndex: 11, address: 'C32', name: '턴하강확인' },
            { wordIndex: 60, bitIndex: 10, address: 'C39', name: '도어열림확인' },
            { wordIndex: 60, bitIndex: 11, address: 'C40', name: '도어닫힘확인' },
            { wordIndex: 60, bitIndex: 9, address: 'C41', name: '도어잠확인' },
            { wordIndex: 60, bitIndex: 14, address: 'C42', name: '좌측동작감지확인1' },
            { wordIndex: 60, bitIndex: 15, address: 'C43', name: '우측동작감지확인1' },
            { wordIndex: 60, bitIndex: 12, address: 'C44', name: '좌도어확인' },
            { wordIndex: 60, bitIndex: 13, address: 'C45', name: '우도어확인' },
            { wordIndex: 60, bitIndex: 8, address: 'C53', name: '도어내확인' },
        ];
        
        const newStates = {};
        
        sensorMappings.forEach(mapping => {
            if (mapping.wordIndex < sensorData.rawData.length) {
                const wordValue = sensorData.rawData[mapping.wordIndex];
                const bitValue = (wordValue >> mapping.bitIndex) & 1;
                newStates[mapping.address] = bitValue === 1;
            } else {
                newStates[mapping.address] = false;
            }
        });
        
        setSensorStates(newStates);
    };

    // sensorData가 변경될 때마다 센서 상태 업데이트
    useEffect(() => {
        updateSensorStates();
    }, [sensorData]);

    const handleCommand = async (commandName) => {  // displayName 파라미터 제거
        if (!isPLCConnected || !isAuthenticated) return;
        try {
            setActiveCommand(commandName);
            await sendCommand(commandName);
            // 명령 실행 후 1초 뒤 활성 상태 해제
            setTimeout(() => setActiveCommand(null), 1000);
        } catch (error) {
            console.error('명령 실행 실패:', error);
            setActiveCommand(null);
        }
    };

    const handleEmergencyStop = async () => {
        try {
            setIsEmergencyMode(true);
            await sendCommand('emergencyStop');

            // 비상정지는 5초간 활성 표시
            setTimeout(() => setIsEmergencyMode(false), 5000);
        } catch (error) {
            console.error('비상정지 실행 실패:', error);
            setIsEmergencyMode(false);
        }
    };

    const isDisabled = !isPLCConnected || !isAuthenticated;

    return (
        <>
            <style jsx>{`
                @import url("https://fonts.googleapis.com/css?family=Rubik:700&display=swap");
                
                .learn-more {
                    font-weight: 600;
                    color: #1e3a8a;
                    text-transform: uppercase;
                    padding: 20px 32px;
                    background: #dbeafe;
                    border: 1px solid #3b82f6;
                    border-radius: 24px;
                    transform-style: preserve-3d;
                    transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), background 150ms cubic-bezier(0, 0, 0.58, 1);
                    position: relative;
                    display: inline-block;
                    cursor: pointer;
                    outline: none;
                    vertical-align: middle;
                    text-decoration: none;
                    font-size: 0.875rem;
                    font-family: inherit;
                    min-width: 120px;
                }
                
                @media (min-width: 768px) {
                    .learn-more {
                        min-width: 160px;
                        padding: 24px 48px;
                    }
                }
                
                .learn-more::before {
                    position: absolute;
                    content: "";
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: #93c5fd;
                    border-radius: inherit;
                    box-shadow: 0 0 0 1px #3b82f6, 0 0.625em 0 0 #bfdbfe;
                    transform: translate3d(0, 0.75em, -1em);
                    transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), box-shadow 150ms cubic-bezier(0, 0, 0.58, 1);
                }
                
                .learn-more:hover {
                    background: #bfdbfe;
                    transform: translate(0, 0.25em);
                }
                
                .learn-more:hover::before {
                    box-shadow: 0 0 0 1px #3b82f6, 0 0.5em 0 0 #bfdbfe;
                    transform: translate3d(0, 0.5em, -1em);
                }
                
                .learn-more:active {
                    background: #bfdbfe;
                    transform: translate(0em, 0.75em);
                }
                
                .learn-more:active::before {
                    box-shadow: 0 0 0 1px #3b82f6, 0 0 #bfdbfe;
                    transform: translate3d(0, 0, -1em);
                }


                .emergency-button {
                    color: #7f1d1d;
                    background: #fecaca;
                    border: 1px solid #dc2626;
                    min-width: 120px;
                    text-align: center;
                    font-size: 0.875rem;
                }
                
                .emergency-button::before {
                    background: #fca5a5;
                    box-shadow: 0 0 0 1px #dc2626, 0 0.625em 0 0 #fecaca;
                }
                
                .emergency-button:hover {
                    background: #fca5a5;
                }
                
                .emergency-button:hover::before {
                    box-shadow: 0 0 0 1px #dc2626, 0 0.5em 0 0 #fecaca;
                }
                
                .emergency-button:active {
                    background: #fca5a5;
                }
                
                .emergency-button:active::before {
                    box-shadow: 0 0 0 1px #dc2626, 0 0 #fecaca;
                }

                .common-button {
                    color: #374151;
                    background: #f3f4f6;
                    border: 1px solid #9ca3af;
                    min-width: 120px;
                    text-align: center;
                    font-size: 0.75rem;
                }
                
                .common-button::before {
                    background: #e5e7eb;
                    box-shadow: 0 0 0 1px #9ca3af, 0 0.625em 0 0 #f3f4f6;
                }
                
                .common-button:hover {
                    background: #e5e7eb;
                }
                
                .common-button:hover::before {
                    box-shadow: 0 0 0 1px #9ca3af, 0 0.5em 0 0 #f3f4f6;
                }
                
                .common-button:active {
                    background: #e5e7eb;
                }
                
                .common-button:active::before {
                    box-shadow: 0 0 0 1px #9ca3af, 0 0 #f3f4f6;
                }

                .common-buttons-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    max-width: 300px;
                    margin: 0 auto;
                }

                @media (min-width: 768px) {
                    .common-buttons-grid {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 16px;
                        justify-content: center;
                        max-width: none;
                    }
                }
                
                .mobile-locking-btn {
                    padding: 16px 20px;
                    font-size: 0.75rem;
                    min-width: 100px;
                }
                @media (min-width: 768px) {
                    .mobile-locking-btn {
                        padding: 12px 20px;
                        font-size: 0.75rem;
                        min-width: 80px;
                    }
                }
                
                .mobile-move-btn {
                    padding: 16px 24px;
                    font-size: 0.8rem;
                    min-width: 100px;
                }
                @media (min-width: 768px) {
                    .mobile-move-btn {
                        padding: 20px 32px;
                        font-size: 0.875rem;
                        min-width: 120px;
                    }
                }

                .tab-navigation {
                    display: flex;
                    gap: 8px;
                    margin: 40px 0 20px 0;
                    justify-content: center;
                }
                
                .sensor-panel-right {
                    position: fixed;
                    top: 50%;
                    right: -300px;
                    width: 300px;
                    height: 60vh;
                    transform: translateY(-50%);
                    background: white;
                    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1);
                    transition: right 0.3s ease-in-out;
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 20px;
                    border-radius: 20px 0 0 20px;
                }
                
                .sensor-panel-right.show {
                    right: 0;
                }
                
                .sensor-panel-left {
                    position: fixed;
                    top: 50%;
                    left: -300px;
                    width: 300px;
                    height: 60vh;
                    transform: translateY(-50%);
                    background: white;
                    box-shadow: 5px 0 20px rgba(0, 0, 0, 0.1);
                    transition: left 0.3s ease-in-out;
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 20px;
                    border-radius: 0 20px 20px 0;
                }
                
                .sensor-panel-left.show {
                    left: 0;
                }
                
                .sensor-panel h3 {
                    color: #1e40af;
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-bottom: 20px;
                    text-align: center;
                    border-bottom: 2px solid #3b82f6;
                    padding-bottom: 10px;
                }
                
                .sensor-item {
                    background: white;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                }
                
                .sensor-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }
                
                .sensor-item.active {
                    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
                    border-color: #10b981;
                    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
                }
                
                .sensor-item.inactive {
                    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                    border-color: #9ca3af;
                    color: #6b7280;
                }
                
                .sensor-item.inactive .sensor-code {
                    color: #6b7280;
                }
                
                .sensor-item.inactive .sensor-name {
                    color: #6b7280;
                }
                
                .sensor-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .sensor-code {
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    color: #1e40af;
                    font-size: 1.1rem;
                    min-width: 50px;
                }
                
                .sensor-name {
                    font-weight: bold;
                    color: #374151;
                    font-size: 0.9rem;
                    flex: 1;
                }
                
                

                @media (max-width: 768px) {
                    .tab-navigation {
                        margin: 20px 0 20px 0;
                    }
                }

                .tab-button {
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                    background: #f3f4f6;
                    color: #6b7280;
                    cursor: pointer;
                    font-size: 14px;
                }

                .tab-button.active {
                    background: #3b82f6;
                    color: white;
                    border-color: #2563eb;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .tab-button:hover:not(.active) {
                    background: #e5e7eb;
                    color: #374151;
                }

                .tab-content {
                    animation: fadeIn 0.3s ease-in-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .turn-table-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    grid-template-rows: 1fr 1fr 1fr;
                    gap: 20px;
                    max-width: 300px;
                    margin: 0 auto;
                }

                @media (max-width: 768px) {
                    .turn-table-grid {
                        gap: 10px;
                        max-width: 250px;
                    }
                }

                .turn-table-btn {
                    min-width: 80px;
                    padding: 1em 1.5em;
                    font-size: 0.75rem;
                }

                @media (min-width: 768px) {
                    .turn-table-btn {
                        min-width: 100px;
                        padding: 1.25em 2em;
                        font-size: 0.875rem;
                    }
                }

                .turn-table-btn.up {
                    grid-column: 2;
                    grid-row: 1;
                }

                .turn-table-btn.down {
                    grid-column: 2;
                    grid-row: 3;
                }

                .turn-table-btn.left {
                    grid-column: 1;
                    grid-row: 2;
                }

                .turn-table-btn.right {
                    grid-column: 3;
                    grid-row: 2;
                }

                .page1-layout {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    align-items: center;
                    flex-wrap: wrap;
                }

                @media (min-width: 768px) {
                    .page1-layout {
                        gap: 80px;
                    }
                }

                @media (max-width: 768px) {
                    .page1-layout {
                        flex-direction: column;
                        gap: 120px;
                    }
                }

                .turn-table-section {
                    flex: 0 0 auto;
                    min-width: 300px;
                }

                .door-section {
                    flex: 0 0 auto;
                    min-width: 200px;
                }

                .door-vertical {
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                    align-items: center;
                }

                @media (max-width: 768px) {
                    .door-vertical {
                        flex-direction: row;
                        gap: 20px;
                    }
                }

                .door-btn {
                    min-width: 120px;
                    padding: 1em 2em;
                }

                @media (min-width: 768px) {
                    .door-btn {
                        min-width: 140px;
                        padding: 1.25em 2.5em;
                        font-size: 0.875rem;
                    }
                }

                @media (max-width: 768px) {
                    .page1-layout {
                        flex-direction: column;
                        gap: 30px;
                    }
                }

            `}</style>
            <div className="bg-white rounded-2xl shadow-lg p-3 md:p-4 overflow-hidden border-2 border-gray-300">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-4 space-y-2 md:space-y-0">
                <h2 className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 md:mb-0">수동 제어</h2>
                <div className="flex items-center flex-wrap gap-3 justify-end sm:justify-start">
                    {isDisabled && (
                        <div className="bg-red-100 border border-red-300 px-3 py-2 rounded-2xl shadow-md">
                            <span className="text-red-700 font-semibold text-sm">🚫 제어 불가</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 공용 버튼들 */}
            <div className="mb-12 md:mb-20">
                <div className="flex flex-wrap gap-4 justify-center common-buttons-grid">
                    <button
                        onClick={() => sendCommand('errorReset')}
                        disabled={isDisabled}
                        className={`learn-more common-button ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        에러 리셋
                    </button>
                    <button
                        onClick={() => sendCommand('operationMode')}
                        disabled={isDisabled}
                        className={`learn-more common-button ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        운전 모드 전환
                    </button>
                    <button
                        onClick={() => sendCommand('recovery')}
                        disabled={isDisabled}
                        className={`learn-more common-button ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        복귀 운전
                    </button>
                    <button
                        onClick={handleEmergencyStop}
                        disabled={!isPLCConnected}
                        className={`learn-more emergency-button ${!isPLCConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        비상정지
                    </button>
                </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="tab-content">
                {/* 1페이지: 도어/턴테이블 */}
                {activeTab === 'page1' && (
                    <div className="page1-layout">
                        {/* 턴테이블 제어 - 상하좌우 배치 */}
                        <div className="turn-table-section">
                            <div className="turn-table-grid">
                                <button
                                    onMouseDown={() => sendCommand('turnTableUp', 1)}
                                    onMouseUp={() => sendCommand('turnTableUp', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more turn-table-btn up ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    상승
                                </button>
                                <button
                                    onMouseDown={() => sendCommand('turnTableLeft', 1)}
                                    onMouseUp={() => sendCommand('turnTableLeft', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more turn-table-btn left ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    좌회전
                                </button>
                                <button
                                    onMouseDown={() => sendCommand('turnTableRight', 1)}
                                    onMouseUp={() => sendCommand('turnTableRight', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more turn-table-btn right ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    우회전
                                </button>
                                <button
                                    onMouseDown={() => sendCommand('turnTableDown', 1)}
                                    onMouseUp={() => sendCommand('turnTableDown', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more turn-table-btn down ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    하강
                                </button>
                            </div>
                        </div>

                        {/* 도어 제어 - 상하 배치 */}
                        <div className="door-section">
                            <div className="door-vertical">
                                <button
                                    onMouseDown={() => sendCommand('doorOpen', 1)}
                                    onMouseUp={() => sendCommand('doorOpen', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more door-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    도어 열림
                                </button>
                                <button
                                    onMouseDown={() => sendCommand('doorClose', 1)}
                                    onMouseUp={() => sendCommand('doorClose', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more door-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    도어 닫힘
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2페이지: 승강 제어 */}
                {activeTab === 'page2' && (
                    <div className="space-y-6">
                        {/* 승강 제어 */}
                        <div>
                            <div className="flex flex-col gap-6 md:gap-8 justify-center items-center">
                                <button
                                    onMouseDown={() => sendCommand('liftUp', 1)}
                                    onMouseUp={() => sendCommand('liftUp', 0)}
                                    onMouseLeave={() => sendCommand('liftUp', 0)}
                                    onTouchStart={() => sendCommand('liftUp', 1)}
                                    onTouchEnd={() => sendCommand('liftUp', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    상승
                                </button>

                                <button
                                    onMouseDown={() => sendCommand('liftDown', 1)}
                                    onMouseUp={() => sendCommand('liftDown', 0)}
                                    onMouseLeave={() => sendCommand('liftDown', 0)}
                                    onTouchStart={() => sendCommand('liftDown', 1)}
                                    onTouchEnd={() => sendCommand('liftDown', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    하강
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3페이지: 횡행/락킹 */}
                {activeTab === 'page3' && (
                    <div className="space-y-7 md:space-y-12">
                        {/* 횡행 제어 */}
                        <div>
                            <div className="flex flex-wrap gap-6 md:gap-8 justify-center">
                                <button
                                    onMouseDown={() => sendCommand('moveLeft', 1)}
                                    onMouseUp={() => sendCommand('moveLeft', 0)}
                                    onMouseLeave={() => sendCommand('moveLeft', 0)}
                                    onTouchStart={() => sendCommand('moveLeft', 1)}
                                    onTouchEnd={() => sendCommand('moveLeft', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more mobile-move-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    좌행
                                </button>

                                <button
                                    onMouseDown={() => sendCommand('moveRight', 1)}
                                    onMouseUp={() => sendCommand('moveRight', 0)}
                                    onMouseLeave={() => sendCommand('moveRight', 0)}
                                    onTouchStart={() => sendCommand('moveRight', 1)}
                                    onTouchEnd={() => sendCommand('moveRight', 0)}
                                    disabled={isDisabled}
                                    className={`learn-more mobile-move-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    우행
                                </button>
                            </div>
                        </div>

                        {/* 락킹 제어 */}
                        <div>
                            <div className="flex justify-center">
                                {/* 모바일용 그리드 레이아웃 */}
                                <div className="md:hidden grid grid-cols-2 gap-4 max-w-xs">
                                    {/* 좌측 열 */}
                                    <div className="flex flex-col gap-6">
                                        <button
                                            onMouseDown={() => sendCommand('leftLiftLock', 1)}
                                            onMouseUp={() => sendCommand('leftLiftLock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more mobile-locking-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            좌측락킹 잠금
                                        </button>
                                        <button
                                            onMouseDown={() => sendCommand('leftLiftUnlock', 1)}
                                            onMouseUp={() => sendCommand('leftLiftUnlock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more mobile-locking-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            좌측락킹 해제
                                        </button>
                                    </div>
                                    
                                    {/* 우측 열 */}
                                    <div className="flex flex-col gap-6">
                                        <button
                                            onMouseDown={() => sendCommand('rightLiftLock', 1)}
                                            onMouseUp={() => sendCommand('rightLiftLock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more mobile-locking-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            우측락킹 잠금
                                        </button>
                                        <button
                                            onMouseDown={() => sendCommand('rightLiftUnlock', 1)}
                                            onMouseUp={() => sendCommand('rightLiftUnlock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more mobile-locking-btn ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            우측락킹 해제
                                        </button>
                                    </div>
                                </div>

                                {/* PC용 좌우 배치 */}
                                <div className="hidden md:flex gap-12 justify-center">
                                    {/* 좌측 락킹 */}
                                    <div className="flex flex-col gap-8 items-center">
                                        <button
                                            onMouseDown={() => sendCommand('leftLiftLock', 1)}
                                            onMouseUp={() => sendCommand('leftLiftLock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            좌측락킹 잠금
                                        </button>
                                        <button
                                            onMouseDown={() => sendCommand('leftLiftUnlock', 1)}
                                            onMouseUp={() => sendCommand('leftLiftUnlock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            좌측락킹 해제
                                        </button>
                                    </div>

                                    {/* 우측 락킹 */}
                                    <div className="flex flex-col gap-8 items-center">
                                        <button
                                            onMouseDown={() => sendCommand('rightLiftLock', 1)}
                                            onMouseUp={() => sendCommand('rightLiftLock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            우측락킹 잠금
                                        </button>
                                        <button
                                            onMouseDown={() => sendCommand('rightLiftUnlock', 1)}
                                            onMouseUp={() => sendCommand('rightLiftUnlock', 0)}
                                            disabled={isDisabled}
                                            className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            우측락킹 해제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 탭 네비게이션 */}
            <div className="tab-navigation" style={{ marginTop: window.innerWidth <= 768 ? '40px' : '120px' }}>
                <button
                    onClick={() => { setActiveTab('page1'); setShowSensors(true); }}
                    className={`tab-button ${activeTab === 'page1' ? 'active' : ''}`}
                >
                    도어/턴테이블
                </button>
                <button
                    onClick={() => { setActiveTab('page2'); setShowSensors(true); }}
                    className={`tab-button ${activeTab === 'page2' ? 'active' : ''}`}
                >
                    승강 제어
                </button>
                <button
                    onClick={() => { setActiveTab('page3'); setShowSensors(true); }}
                    className={`tab-button ${activeTab === 'page3' ? 'active' : ''}`}
                >
                    횡행/락킹
                </button>
            </div>

            {/* 사용법 안내 */}
            <div className="mt-8 md:mt-12 p-3 md:p-4 bg-blue-50 rounded-2xl">
                <h4 className="text-xs md:text-sm font-semibold text-blue-800 mb-2">사용법</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>• PLC 연결과 인증이 완료되어야 제어 가능합니다</li>
                    <li>• 버튼을 누르면 해당 명령이 PLC로 전송됩니다</li>
                    <li>• 명령 실행 중에는 버튼이 강조 표시됩니다</li>
                    <li>• 비상정지는 PLC 연결만 되어도 실행 가능합니다</li>
                </ul>
            </div>

            {/* 디버그 정보 (개발용) */}
            {/* eslint-disable-next-line no-undef */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-gray-100 rounded-2xl text-xs">
                    <div>PLC 연결: {isPLCConnected ? 'O' : 'X'}</div>
                    <div>인증 상태: {isAuthenticated ? 'O' : 'X'}</div>
                    <div>활성 명령: {activeCommand || 'None'}</div>
                    <div>비상모드: {isEmergencyMode ? 'O' : 'X'}</div>
                </div>
            )}

            {/* 좌측 센서 패널 (PC만) */}
            {showSensors && (
                <div className="sensor-panel-left show">
                    {activeTab === 'page1' && (
                        <div>
                            <div className={`sensor-item ${sensorStates.C39 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C39</div>
                                <div className="sensor-name">도어열림확인</div>
                            </div>
                            <div className={`sensor-item ${sensorStates.C40 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C40</div>
                                <div className="sensor-name">도어닫힘확인</div>
                            </div>
                            <div className={`sensor-item ${sensorStates.C41 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C41</div>
                                <div className="sensor-name">도어잠확인</div>
                            </div>
                            <div className={`sensor-item ${sensorStates.C44 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C44</div>
                                <div className="sensor-name">좌도어확인</div>
                            </div>
                            <div className={`sensor-item ${sensorStates.C45 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C45</div>
                                <div className="sensor-name">우도어확인</div>
                            </div>
                            <div className={`sensor-item ${sensorStates.C53 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C53</div>
                                <div className="sensor-name">도어내확인</div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'page2' && (
                        <div>
                            <div className={`sensor-item ${sensorStates.C31 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C31</div>
                                <div className="sensor-name">턴 상승확인</div>
                            </div>
                            <div className={`sensor-item ${sensorStates.C32 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C32</div>
                                <div className="sensor-name">턴 하강확인</div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'page3' && (
                        <div>
                            <div className={`sensor-item ${sensorStates.C28 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C28</div>
                                <div className="sensor-name">턴 0도 확인정지</div>
                            </div>
                            <div className={`sensor-item ${sensorStates.C29 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C29</div>
                                <div className="sensor-name">턴 180도 확인정지</div>
                            </div>
                            <div className={`sensor-item ${sensorStates.C42 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C42</div>
                                <div className="sensor-name">좌측동작감지확인1</div>
                            </div>
                            <div className={`sensor-item ${sensorStates.C43 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C43</div>
                                <div className="sensor-name">우측동작감지확인1</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 우측 센서 패널 (PC만) */}
            {showSensors && (
                <div className="sensor-panel-right show">
                    
                    {activeTab === 'page1' && (
                        <div>
                            <div className={`sensor-item ${sensorStates.C28 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C28</div>
                                <div className="sensor-name">턴테이블 0도 확인</div>
                            </div>
                            <div className={`sensor-item ${sensorStates.C29 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C29</div>
                                <div className="sensor-name">턴테이블 180도 확인</div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'page2' && (
                        <div>
                            <div className={`sensor-item ${sensorStates.C31 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C31</div>
                                <div className="sensor-name">리프트 상승확인</div>
                            </div>
                            <div className={`sensor-item ${sensorStates.C32 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C32</div>
                                <div className="sensor-name">리프트 하강확인</div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'page3' && (
                        <div>
                            <div className={`sensor-item ${sensorStates.C42 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C42</div>
                                <div className="sensor-name">좌측동작감지확인</div>
                            </div>
                            <div className={`sensor-item ${sensorStates.C43 ? 'active' : 'inactive'}`}>
                                <div className="sensor-code">C43</div>
                                <div className="sensor-name">우측동작감지확인</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            </div>
        </>
    );
};

export default ManualControl;