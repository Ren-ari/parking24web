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
        <>
            <style jsx>{`
                @import url("https://fonts.googleapis.com/css?family=Rubik:700&display=swap");
                
                .learn-more {
                    font-weight: 600;
                    color: #1e3a8a;
                    text-transform: uppercase;
                    padding: 1.25em 2em;
                    background: #dbeafe;
                    border: 2px solid #3b82f6;
                    border-radius: 0.75em;
                    transform-style: preserve-3d;
                    transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), background 150ms cubic-bezier(0, 0, 0.58, 1);
                    position: relative;
                    display: inline-block;
                    cursor: pointer;
                    outline: none;
                    vertical-align: middle;
                    text-decoration: none;
                    font-size: inherit;
                    font-family: inherit;
                    min-width: 120px;
                }
                
                @media (min-width: 768px) {
                    .learn-more {
                        min-width: 160px;
                        padding: 1.5em 3em;
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
                    box-shadow: 0 0 0 2px #3b82f6, 0 0.625em 0 0 #bfdbfe;
                    transform: translate3d(0, 0.75em, -1em);
                    transition: transform 150ms cubic-bezier(0, 0, 0.58, 1), box-shadow 150ms cubic-bezier(0, 0, 0.58, 1);
                }
                
                .learn-more:hover {
                    background: #bfdbfe;
                    transform: translate(0, 0.25em);
                }
                
                .learn-more:hover::before {
                    box-shadow: 0 0 0 2px #3b82f6, 0 0.5em 0 0 #bfdbfe;
                    transform: translate3d(0, 0.5em, -1em);
                }
                
                .learn-more:active {
                    background: #bfdbfe;
                    transform: translate(0em, 0.75em);
                }
                
                .learn-more:active::before {
                    box-shadow: 0 0 0 2px #3b82f6, 0 0 #bfdbfe;
                    transform: translate3d(0, 0, -1em);
                }

                .emergency-button {
                    color: #7f1d1d;
                    background: #fecaca;
                    border: 2px solid #dc2626;
                }
                
                .emergency-button::before {
                    background: #fca5a5;
                    box-shadow: 0 0 0 2px #dc2626, 0 0.625em 0 0 #fecaca;
                }
                
                .emergency-button:hover {
                    background: #fca5a5;
                }
                
                .emergency-button:hover::before {
                    box-shadow: 0 0 0 2px #dc2626, 0 0.5em 0 0 #fecaca;
                }
                
                .emergency-button:active {
                    background: #fca5a5;
                }
                
                .emergency-button:active::before {
                    box-shadow: 0 0 0 2px #dc2626, 0 0 #fecaca;
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

            {/* 승강 제어 */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-6 md:gap-8 justify-center">
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

            {/* 횡행 제어 */}
            <div className="mb-6 mt-8">
                <div className="flex flex-wrap gap-6 md:gap-8 justify-center">
                    <button
                        onMouseDown={() => sendCommand('moveLeft', 1)}
                        onMouseUp={() => sendCommand('moveLeft', 0)}
                        onMouseLeave={() => sendCommand('moveLeft', 0)}
                        onTouchStart={() => sendCommand('moveLeft', 1)}
                        onTouchEnd={() => sendCommand('moveLeft', 0)}
                        disabled={isDisabled}
                        className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        className={`learn-more ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        우행
                    </button>
                </div>
            </div>

            {/* 비상정지 */}
            <div className="border-t pt-4 md:pt-6">
                <div className="flex justify-center">
                    <button
                        onClick={handleEmergencyStop}
                        disabled={!isPLCConnected}
                        className={`learn-more emergency-button ${!isPLCConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        비상정지
                    </button>
                </div>
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
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-gray-100 rounded-2xl text-xs">
                    <div>PLC 연결: {isPLCConnected ? 'O' : 'X'}</div>
                    <div>인증 상태: {isAuthenticated ? 'O' : 'X'}</div>
                    <div>활성 명령: {activeCommand || 'None'}</div>
                    <div>비상모드: {isEmergencyMode ? 'O' : 'X'}</div>
                </div>
            )}
            </div>
        </>
    );
};

export default ManualControl;