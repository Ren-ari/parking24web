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
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 overflow-hidden">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-gray-800">PLC 연결 관리</h2>

            {/* 연결 상태 표시 */}
            <div className="mb-4 flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getConnectionStatusColor()}`}></div>
                <span className="text-sm font-medium text-gray-700">
                    {getConnectionStatusText()}
                </span>
            </div>

            {/* SignalR 연결 상태 */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isSignalRConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-sm text-gray-600">
                        SignalR: {isSignalRConnected ? '연결됨' : '연결 안됨'}
                    </span>
                </div>
            </div>

            {/* PLC 설정 */}
            <div className="mb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            PLC IP 주소
                        </label>
                        <input
                            type="text"
                            value={plcConfig.ip}
                            onChange={handleIPChange}
                            disabled={isPLCConnected || isConnecting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm md:text-base"
                            placeholder="192.168.1.2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            포트
                        </label>
                        <input
                            type="number"
                            value={plcConfig.port}
                            onChange={handlePortChange}
                            disabled={isPLCConnected || isConnecting}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm md:text-base"
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
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {!isPLCConnected ? (
                    <button
                        onClick={connectToPLC}
                        disabled={!isSignalRConnected || isConnecting}
                        className={`w-full sm:w-auto px-4 py-2 rounded-md font-medium text-white transition-colors ${!isSignalRConnected || isConnecting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            }`}
                    >
                        {isConnecting ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>연결 중...</span>
                            </div>
                        ) : (
                            'PLC 연결'
                        )}
                    </button>
                ) : (
                    <button
                        onClick={disconnectFromPLC}
                        className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        PLC 연결 해제
                    </button>
                )}

                {/* 현재 설정 표시 */}
                <div className="flex-1 flex items-center justify-end text-sm text-gray-500">
                    {plcConfig.ip}:{plcConfig.port}
                </div>
            </div>

            {/* 인증 상태 표시 */}
            {isPLCConnected && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <div className="flex items-center space-x-2">
                        {isAuthenticated ? (
                            <>
                                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm text-green-700 font-medium">인증 완료 (C4 = 62)</span>
                            </>
                        ) : (
                            <>
                                <svg className="h-5 w-5 text-yellow-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="text-sm text-yellow-700 font-medium">인증 확인 중...</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConnectionPanel;