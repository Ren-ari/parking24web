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
        <div className="bg-white rounded-2xl shadow-lg p-3 md:p-4 mb-4 overflow-hidden border-2 border-gray-300">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-4 space-y-2 md:space-y-0">
                <h2 className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 md:mb-0">PLC 연결 관리</h2>
                <div className="flex items-center gap-3">

                </div>
            </div>

            {/* PLC 설정 */}
            <div className="mb-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            IP
                        </label>
                        <input
                            type="text"
                            value={plcConfig.ip}
                            onChange={handleIPChange}
                            disabled={isPLCConnected || isConnecting}
                            className="w-full px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-sm md:text-base transition-all duration-300 hover:border-blue-300 shadow-sm"
                            placeholder="192.168.1.2"
                        />
                    </div>
                    <div className="space-y-2 mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            포트
                        </label>
                        <input
                            type="number"
                            value={plcConfig.port}
                            onChange={handlePortChange}
                            disabled={isPLCConnected || isConnecting}
                            className="w-full px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-sm md:text-base transition-all duration-300 hover:border-blue-300 shadow-sm"
                            placeholder="2005"
                            min="1"
                            max="65535"
                        />
                    </div>
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

            {/* 연결/해제 버튼 */}
            <div className="flex justify-center mb-6">
                {!isPLCConnected ? (
                    <button
                        onClick={connectToPLC}
                        disabled={!isSignalRConnected || isConnecting}
                        className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isSignalRConnected || isConnecting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                            }`}
                    >
                        {isConnecting ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>연결 중...</span>
                            </div>
                        ) : (
                            'PLC 연결'
                        )}
                    </button>
                ) : (
                    <button
                        onClick={disconnectFromPLC}
                        className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 shadow-md"
                    >
                        PLC 연결 해제
                    </button>
                )}
            </div>

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