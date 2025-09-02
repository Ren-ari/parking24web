import React, { useState } from 'react';

// 임시 상태 (실제로는 usePLCConnection 사용)
const PLCControl = () => {
    const [activeTab, setActiveTab] = useState('connection');
    const [showLogs, setShowLogs] = useState(false);

    // 임시 상태값들
    const isSignalRConnected = true;
    const isPLCConnected = true;
    const isAuthenticated = true;
    const sensorData = { timestamp: Date.now() };
    const logs = [
        { timestamp: '14:23:15', message: 'PLC 연결 성공', type: 'success' },
        { timestamp: '14:23:10', message: 'SignalR 연결 완료', type: 'success' },
        { timestamp: '14:22:58', message: '센서 데이터 업데이트', type: 'info' }
    ];

    const clearLogs = () => {
        console.log('로그 클리어');
    };

    const getTabStyle = (tabName) => {
        const baseStyle = "relative px-6 py-3 font-medium text-sm transition-all duration-300 ease-out";
        if (activeTab === tabName) {
            return `${baseStyle} text-blue-600 border-b-2 border-blue-500`;
        }
        return `${baseStyle} text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300`;
    };

    const StatusIndicator = ({ isConnected, label, pulseColor = "green" }) => (
        <div className="flex items-center space-x-2">
            <div className="relative">
                <div
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${isConnected ? `bg-${pulseColor}-500` : 'bg-gray-400'
                        }`}
                />
                {isConnected && (
                    <div
                        className={`absolute inset-0 w-3 h-3 rounded-full bg-${pulseColor}-500 animate-ping opacity-20`}
                    />
                )}
            </div>
            <span className={`text-sm font-medium transition-colors duration-300 ${isConnected ? 'text-gray-700' : 'text-gray-500'
                }`}>
                {label}
            </span>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
            {/* 헤더 섹션 */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                                PLC 제어 시스템
                            </h1>
                            <p className="text-gray-600 text-lg">실시간 모니터링 및 제어</p>
                        </div>
                        <div className="flex items-center space-x-6">
                            <StatusIndicator
                                isConnected={isSignalRConnected}
                                label="SignalR"
                                pulseColor="green"
                            />
                            <StatusIndicator
                                isConnected={isPLCConnected}
                                label="PLC"
                                pulseColor="blue"
                            />
                            <StatusIndicator
                                isConnected={isAuthenticated}
                                label="인증"
                                pulseColor="emerald"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* 전역 상태 카드 */}
                <div className="mb-8 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-sm font-medium text-gray-700">시스템 정상</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                    마지막 업데이트: {sensorData.timestamp ? new Date(sensorData.timestamp).toLocaleTimeString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowLogs(!showLogs)}
                            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${showLogs
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {showLogs ? '로그 숨기기' : '로그 보기'}
                        </button>
                    </div>
                </div>

                {/* 로그 패널 */}
                {showLogs && (
                    <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800">시스템 로그</h3>
                            <button
                                onClick={clearLogs}
                                className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200"
                            >
                                로그 지우기
                            </button>
                        </div>
                        <div className="p-6 max-h-64 overflow-y-auto">
                            {logs.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-8">로그가 없습니다</p>
                            ) : (
                                <div className="space-y-3">
                                    {logs.slice(0, 20).map((log, index) => (
                                        <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg text-sm ${log.type === 'error' ? 'bg-red-50 border border-red-100' :
                                                log.type === 'warning' ? 'bg-yellow-50 border border-yellow-100' :
                                                    log.type === 'success' ? 'bg-green-50 border border-green-100' :
                                                        'bg-gray-50 border border-gray-100'
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${log.type === 'error' ? 'bg-red-400' :
                                                    log.type === 'warning' ? 'bg-yellow-400' :
                                                        log.type === 'success' ? 'bg-green-400' :
                                                            'bg-gray-400'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-gray-500 font-mono text-xs">{log.timestamp}</span>
                                                <p className={`font-medium ${log.type === 'error' ? 'text-red-700' :
                                                        log.type === 'warning' ? 'text-yellow-700' :
                                                            log.type === 'success' ? 'text-green-700' :
                                                                'text-gray-700'
                                                    }`}>
                                                    {log.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 탭 네비게이션 */}
                <div className="mb-8">
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-2">
                        <nav className="flex space-x-1">
                            {[
                                { key: 'connection', label: '연결 관리', icon: '🔗' },
                                { key: 'monitor', label: '센서 모니터', icon: '📊' },
                                { key: 'control', label: '수동 제어', icon: '🎮' },
                                { key: 'parking', label: '주차장 모니터', icon: '🅿️' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === tab.key
                                            ? 'bg-white shadow-sm text-blue-600 border border-blue-100'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50/50'
                                        }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="space-y-8">
                    {activeTab === 'connection' && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">PLC 연결 관리</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4">연결 설정</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">IP 주소</label>
                                            <input
                                                type="text"
                                                placeholder="192.168.1.2"
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">포트</label>
                                            <input
                                                type="number"
                                                placeholder="2005"
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white/50"
                                            />
                                        </div>
                                        <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm">
                                            연결하기
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4">연결 상태</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                            <span className="font-medium text-green-800">SignalR 연결</span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <span className="text-green-600 text-sm">정상</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <span className="font-medium text-blue-800">PLC 연결</span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                <span className="text-blue-600 text-sm">연결됨</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'monitor' && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">센서 데이터 모니터</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} className="bg-white/60 rounded-lg p-4 border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-600">센서 {i}</span>
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {Math.floor(Math.random() * 100)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'control' && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">수동 제어</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4">승강 제어</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button className="flex flex-col items-center justify-center p-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105">
                                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                            <span className="font-medium">상승</span>
                                        </button>
                                        <button className="flex flex-col items-center justify-center p-6 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105">
                                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                            <span className="font-medium">하강</span>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4">횡행 제어</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button className="flex flex-col items-center justify-center p-6 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105">
                                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            <span className="font-medium">좌행</span>
                                        </button>
                                        <button className="flex flex-col items-center justify-center p-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105">
                                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            <span className="font-medium">우행</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8">
                                <button className="w-full p-6 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                                    🛑 비상정지
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'parking' && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">주차장 모니터</h2>
                            <div className="grid grid-cols-5 gap-4">
                                {Array.from({ length: 20 }, (_, i) => (
                                    <div key={i} className={`aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-medium ${Math.random() > 0.7
                                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                                            : 'bg-gray-100 border-gray-300 text-gray-500'
                                        }`}>
                                        {i + 1}층
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="mt-16 text-center">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/40 backdrop-blur-sm rounded-full border border-white/20">
                        <span className="text-sm text-gray-600">PLC 웹 제어 시스템</span>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-500">v1.0</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default PLCControl;