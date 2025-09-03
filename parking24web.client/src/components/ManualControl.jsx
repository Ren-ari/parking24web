import React, { useState } from 'react';

const ManualControl = ({ isPLCConnected, isAuthenticated, sendCommand }) => {
    const [activeCommand, setActiveCommand] = useState(null);
    const [isEmergencyMode, setIsEmergencyMode] = useState(false);

    const handleCommand = async (commandName, displayName) => {
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
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-2xl p-4 md:p-6 overflow-hidden border border-blue-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-2 md:space-y-0">
                <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">수동 제어</h2>
                <div className="flex items-center flex-wrap gap-3">
                    {isDisabled && (
                        <div className="bg-red-100 border border-red-300 px-3 py-2 rounded-full shadow-md">
                            <span className="text-red-700 font-semibold text-sm">🚫 제어 불가</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 승강 제어 */}
            <div className="mb-6">
                <h3 className="text-base md:text-lg font-semibold mb-3 text-gray-700">승강 제어</h3>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <button
                        onMouseDown={() => sendCommand('liftUp', 1)}
                        onMouseUp={() => sendCommand('liftUp', 0)}
                        onMouseLeave={() => sendCommand('liftUp', 0)} // 버튼 밖으로 나가도 0
                        onTouchStart={() => sendCommand('liftUp', 1)}
                        onTouchEnd={() => sendCommand('liftUp', 0)}
                        disabled={isDisabled}
                        className={`relative p-4 md:p-6 rounded-lg font-semibold text-white transition-all duration-200 ${isDisabled
                            ? 'bg-gray-400 cursor-not-allowed'
                            : activeCommand === 'liftUp'
                                ? 'bg-indigo-700 scale-95'
                                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                            }`}
                    >
                        <div className="flex flex-col items-center space-y-1 md:space-y-2">
                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            <span className="text-sm md:text-lg">상승</span>
                        </div>
                        {activeCommand === 'liftUp' && (
                            <div className="absolute inset-0 bg-indigo-300 rounded-lg animate-pulse"></div>
                        )}
                    </button>

                    <button
                        onMouseDown={() => sendCommand('liftDown', 1)}
                        onMouseUp={() => sendCommand('liftDown', 0)}
                        onMouseLeave={() => sendCommand('liftDown', 0)} // 버튼 밖으로 나가도 0
                        onTouchStart={() => sendCommand('liftDown', 1)}
                        onTouchEnd={() => sendCommand('liftDown', 0)}
                        disabled={isDisabled}
                        className={`relative p-4 md:p-6 rounded-lg font-semibold text-white transition-all duration-200 ${isDisabled
                            ? 'bg-gray-400 cursor-not-allowed'
                            : activeCommand === 'liftDown'
                                ? 'bg-indigo-700 scale-95'
                                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                            }`}
                    >
                        <div className="flex flex-col items-center space-y-1 md:space-y-2">
                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span className="text-sm md:text-lg">하강</span>
                        </div>
                        {activeCommand === 'liftDown' && (
                            <div className="absolute inset-0 bg-indigo-300 rounded-lg animate-pulse"></div>
                        )}
                    </button>
                </div>
            </div>

            {/* 횡행 제어 */}
            <div className="mb-6">
                <h3 className="text-base md:text-lg font-semibold mb-3 text-gray-700">횡행 제어</h3>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <button
                        onMouseDown={() => sendCommand('moveLeft', 1)}
                        onMouseUp={() => sendCommand('moveLeft', 0)}
                        onMouseLeave={() => sendCommand('moveLeft', 0)} // 버튼 밖으로 나가도 0
                        onTouchStart={() => sendCommand('moveLeft', 1)}
                        onTouchEnd={() => sendCommand('moveLeft', 0)}
                        disabled={isDisabled}
                        className={`relative p-4 md:p-6 rounded-lg font-semibold text-white transition-all duration-200 ${isDisabled
                            ? 'bg-gray-400 cursor-not-allowed'
                            : activeCommand === 'moveLeft'
                                ? 'bg-indigo-700 scale-95'
                                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                            }`}
                    >
                        <div className="flex flex-col items-center space-y-1 md:space-y-2">
                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="text-sm md:text-lg">좌행</span>
                        </div>
                        {activeCommand === 'moveLeft' && (
                            <div className="absolute inset-0 bg-indigo-300 rounded-lg animate-pulse"></div>
                        )}
                    </button>

                    <button
                        onMouseDown={() => sendCommand('moveRight', 1)}
                        onMouseUp={() => sendCommand('moveRight', 0)}
                        onMouseLeave={() => sendCommand('moveRight', 0)} // 버튼 밖으로 나가도 0
                        onTouchStart={() => sendCommand('moveRight', 1)}
                        onTouchEnd={() => sendCommand('moveRight', 0)}
                        disabled={isDisabled}
                        className={`relative p-4 md:p-6 rounded-lg font-semibold text-white transition-all duration-200 ${isDisabled
                            ? 'bg-gray-400 cursor-not-allowed'
                            : activeCommand === 'moveRight'
                                ? 'bg-indigo-700 scale-95'
                                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                            }`}
                    >
                        <div className="flex flex-col items-center space-y-1 md:space-y-2">
                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-sm md:text-lg">우행</span>
                        </div>
                        {activeCommand === 'moveRight' && (
                            <div className="absolute inset-0 bg-indigo-300 rounded-lg animate-pulse"></div>
                        )}
                    </button>
                </div>
            </div>

            {/* 비상정지 */}
            <div className="border-t pt-4 md:pt-6">
                <button
                    onClick={handleEmergencyStop}
                    disabled={!isPLCConnected}
                    className={`w-full p-4 md:p-6 rounded-lg font-bold text-white text-lg md:text-xl transition-all duration-200 ${!isPLCConnected
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isEmergencyMode
                            ? 'bg-red-800 animate-pulse'
                            : 'bg-red-600 hover:bg-red-700 active:scale-95'
                        }`}
                >
                    <div className="flex flex-col items-center space-y-1 md:space-y-2">
                        <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>비상정지</span>
                        {isEmergencyMode && <span className="text-xs md:text-sm">실행 중...</span>}
                    </div>
                </button>
            </div>

            {/* 사용법 안내 */}
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg">
                <h4 className="text-xs md:text-sm font-semibold text-blue-800 mb-2">사용법</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>• PLC 연결과 인증이 완료되어야 제어 가능합니다</li>
                    <li>• 버튼을 누르면 해당 명령이 PLC로 전송됩니다</li>
                    <li>• 명령 실행 중에는 버튼이 강조 표시됩니다</li>
                    <li>• 비상정지는 PLC 연결만 되어도 실행 가능합니다</li>
                </ul>
            </div>

            {/* 디버그 정보 (개발용) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                    <div>PLC 연결: {isPLCConnected ? 'O' : 'X'}</div>
                    <div>인증 상태: {isAuthenticated ? 'O' : 'X'}</div>
                    <div>활성 명령: {activeCommand || 'None'}</div>
                    <div>비상모드: {isEmergencyMode ? 'O' : 'X'}</div>
                </div>
            )}
        </div>
    );
};

export default ManualControl;