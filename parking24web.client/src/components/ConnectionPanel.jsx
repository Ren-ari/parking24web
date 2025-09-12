import React from 'react';

const ConnectionPanel = ({
    isSignalRConnected,
    isPLCConnected,
    isConnecting,
    isAuthenticated,
    error,
    plcConfig,
    setPLCConfig,
    connectToPLC,
    disconnectFromPLC,
    clearError
}) => {
    const handleIPChange = (e) => {
        setPLCConfig(prev => ({ ...prev, ip: e.target.value }));
    };

    const handlePortChange = (e) => {
        setPLCConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 2005 }));
    };

    const getConnectionStatusColor = () => {
        if (!isSignalRConnected) return 'bg-gray-500';
        if (isPLCConnected && isAuthenticated) return 'bg-green-500';
        if (isPLCConnected && !isAuthenticated) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getConnectionStatusText = () => {
        if (!isSignalRConnected) return 'SignalR 연결 안됨';
        if (isPLCConnected && isAuthenticated) return 'PLC 연결됨 (인증 완료)';
        if (isPLCConnected && !isAuthenticated) return 'PLC 연결됨 (인증 대기)';
        if (isConnecting) return 'PLC 연결 중...';
        return 'PLC 연결 안됨';
    };

    return (
        <div className="rounded-2xl p-3 md:p-4 mb-4 overflow-hidden border border-white/20 shadow-xl shadow-black/20" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
        }}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-4 space-y-2 md:space-y-0">
                <h2 className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 md:mb-0">PLC 연결 관리</h2>
                <div className="flex items-center gap-3">

                </div>
            </div>

            {/* PLC 선택 */}
            <div className="mb-8">
                <div className="flex justify-center gap-6">
                    <button
                        onClick={() => {
                            setPLCConfig({
                                ip: '192.168.0.101',
                                port: 2005
                            });
                            connectToPLC();
                        }}
                        disabled={isPLCConnected || isConnecting}
                        className={`px-12 py-6 rounded-2xl font-bold transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                            isPLCConnected || isConnecting
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed border-gray-300'
                                : plcConfig.ip === '192.168.0.101'
                                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white border-blue-300 shadow-2xl'
                                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                        }`}
                    >
                        <div className="text-xl font-bold">1호기</div>
                    </button>
                    
                    <button
                        onClick={() => {
                            setPLCConfig({
                                ip: '192.168.0.102',
                                port: 2005
                            });
                            connectToPLC();
                        }}
                        disabled={isPLCConnected || isConnecting}
                        className={`px-12 py-6 rounded-2xl font-bold transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                            isPLCConnected || isConnecting
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed border-gray-300'
                                : plcConfig.ip === '192.168.0.102'
                                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white border-blue-300 shadow-2xl'
                                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                        }`}
                    >
                        <div className="text-xl font-bold">2호기</div>
                    </button>
                    
                    <button
                        onClick={() => {
                            setPLCConfig({
                                ip: '192.168.0.103',
                                port: 2005
                            });
                            connectToPLC();
                        }}
                        disabled={isPLCConnected || isConnecting}
                        className={`px-12 py-6 rounded-2xl font-bold transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                            isPLCConnected || isConnecting
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed border-gray-300'
                                : plcConfig.ip === '192.168.0.103'
                                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white border-blue-300 shadow-2xl'
                                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                        }`}
                    >
                        <div className="text-xl font-bold">3호기</div>
                    </button>
                </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                        <div className="ml-auto">
                            <button
                                onClick={clearError}
                                className="text-red-400 hover:text-red-600"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 연결 해제 버튼 */}
            {isPLCConnected && (
                <div className="flex justify-center mb-6">
                    <button
                        onClick={disconnectFromPLC}
                        className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 shadow-md"
                    >
                        PLC 연결 해제
                    </button>
                </div>
            )}

            {/* 인증 상태 표시 */}
            {isPLCConnected && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                        {isAuthenticated ? (
                            <>
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm text-green-700 font-semibold">인증 완료</span>
                                    <div className="text-xs text-green-600">C4 = 62</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <svg className="h-5 w-5 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm text-yellow-700 font-semibold">인증 확인 중...</span>
                                    <div className="text-xs text-yellow-600">잠시만 기다려주세요</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConnectionPanel; 