import React from 'react';
import siteConfig from '../../config/sokcho2Config.js';

const currentConfig = siteConfig;

const ConnectionPanel = ({
    isSignalRConnected,
    isPLCConnected,
    isConnecting,
    isAuthenticated,
    error,
    setPLCConfig,
    connectToPLC,
    disconnectFromPLC,
    clearError,
    selectedUnit,
    setSelectedUnit,
    theme

}) => {
    const _handleIPChange = (e) => {
        setPLCConfig(prev => ({ ...prev, ip: e.target.value }));
    };

    const _handlePortChange = (e) => {
        setPLCConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 2005 }));
    };

    const _getConnectionStatusColor = () => {
        if (!isSignalRConnected) return 'bg-gray-500';
        if (isPLCConnected && isAuthenticated) return 'bg-green-500';
        if (isPLCConnected && !isAuthenticated) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const _getConnectionStatusText = () => {
        if (!isSignalRConnected) return 'SignalR 연결 안됨';
        if (isPLCConnected && isAuthenticated) return 'PLC 연결됨 (인증 완료)';
        if (isPLCConnected && !isAuthenticated) return 'PLC 연결됨 (인증 대기)';
        if (isConnecting) return 'PLC 연결 중...';
        return 'PLC 연결 안됨';
    };

    // 테마에 따른 스타일 함수들
    const getPanelBackground = () => {
        switch (theme) {
            case 'space':
                return {
                    background: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                };
            case 'dark':
                return {
                    background: 'rgba(31, 41, 55, 0.9)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                };
            case 'ocean':
                return {
                    background: 'rgba(30, 58, 138, 0.9)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                };
            default:
                return {
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                };
        }
    };

    const getPanelBorderClass = () => {
        switch (theme) {
            case 'space':
                return 'border-gray-700/30';
            case 'dark':
                return 'border-gray-500/30';
            case 'ocean':
                return 'border-blue-600/30';
            default:
                return 'border-white/20';
        }
    };

    const getTitleGradient = () => {
        switch (theme) {
            case 'space':
                return 'bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent';
            case 'dark':
                return 'bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent';
            case 'ocean':
                return 'bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent';
            default:
                return 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent';
        }
    };

    const getButtonGradient = () => {
        switch (theme) {
            case 'space':
                return 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 hover:from-purple-500 hover:via-purple-600 hover:to-purple-700 border border-purple-500/30';
            case 'dark':
                return 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 hover:from-gray-500 hover:via-gray-600 hover:to-gray-700 border border-gray-500/30';
            case 'ocean':
                return 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 border border-blue-500/30';
            default:
                return 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700';
        }
    };

    const getDisabledButtonClass = () => {
        switch (theme) {
            case 'space':
            case 'dark':
            case 'ocean':
                return 'bg-gray-600';
            default:
                return 'bg-gray-400';
        }
    };

    const getFocusRingClass = () => {
        switch (theme) {
            case 'space':
                return 'focus:ring-purple-500';
            case 'dark':
                return 'focus:ring-gray-500';
            case 'ocean':
                return 'focus:ring-blue-500';
            default:
                return 'focus:ring-blue-500';
        }
    };

    const getErrorPanelClass = () => {
        switch (theme) {
            case 'space':
                return 'mb-4 p-3 bg-red-900/20 border border-red-700/30 rounded-md backdrop-blur-sm';
            case 'dark':
                return 'mb-4 p-3 bg-red-900/20 border border-red-600/30 rounded-md backdrop-blur-sm';
            case 'ocean':
                return 'mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-md backdrop-blur-sm';
            default:
                return 'mb-4 p-3 bg-red-50 border border-red-200 rounded-md';
        }
    };

    const getErrorTextClass = () => {
        switch (theme) {
            case 'space':
            case 'dark':
            case 'ocean':
                return 'text-sm text-red-300';
            default:
                return 'text-sm text-red-700';
        }
    };

    const getAuthPanelClass = () => {
        switch (theme) {
            case 'space':
                return 'mt-6 p-4 bg-gradient-to-r from-purple-900/20 to-purple-800/20 rounded-xl border border-purple-700/30 shadow-sm backdrop-blur-sm';
            case 'dark':
                return 'mt-6 p-4 bg-gradient-to-r from-gray-800/20 to-gray-700/20 rounded-xl border border-gray-600/30 shadow-sm backdrop-blur-sm';
            case 'ocean':
                return 'mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-xl border border-blue-600/30 shadow-sm backdrop-blur-sm';
            default:
                return 'mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm';
        }
    };

    return (
        <div className={`rounded-2xl p-3 md:p-4 mb-4 overflow-hidden border ${getPanelBorderClass()} shadow-xl shadow-black/20`} style={getPanelBackground()}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-4 space-y-2 md:space-y-0">
                <h2 className={`text-base md:text-lg font-bold ${getTitleGradient()} mb-2 md:mb-0`}>PLC 연결 관리</h2>
                <div className="flex items-center gap-3">

                </div>
            </div>

            {/* PLC 선택 */}
            <div className="mb-8">
                <div className="flex justify-center gap-6">
                    {currentConfig.connectionConfig.buttons.map(button => (
                        <button
                            key={button.unit}
                            onClick={() => {
                                setSelectedUnit(button.unit);
                                connectToPLC(button.ip, button.port);
                            }}
                            disabled={isPLCConnected || isConnecting}
                            className={`px-12 py-6 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 ${isPLCConnected || isConnecting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : theme === 'space' 
                                        ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 shadow-lg hover:shadow-xl shadow-purple-600/30'
                                        : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                                }`}
                            style={theme === 'space' && !isPLCConnected && !isConnecting ? {
                                boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(124, 58, 237, 0.4)'
                            } : {}}
                        >
                            <div className="text-xl font-bold">{button.name}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className={getErrorPanelClass()}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className={getErrorTextClass()}>{error}</p>
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
                <div className={getAuthPanelClass()}>
                    <div className="flex items-center space-x-3">
                        {isAuthenticated ? (
                            <>
                                <div className="flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'space' ? 'bg-purple-100' : theme === 'dark' ? 'bg-gray-200' : theme === 'ocean' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                        <svg className={`h-5 w-5 ${theme === 'space' ? 'text-purple-600' : theme === 'dark' ? 'text-gray-600' : theme === 'ocean' ? 'text-blue-600' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <span className={`text-sm font-semibold ${theme === 'space' ? 'text-purple-700' : theme === 'dark' ? 'text-gray-200' : theme === 'ocean' ? 'text-blue-700' : 'text-green-700'}`}>인증 완료</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'space' ? 'bg-purple-100' : theme === 'dark' ? 'bg-gray-200' : theme === 'ocean' ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                                        <svg className={`h-5 w-5 animate-spin ${theme === 'space' ? 'text-purple-600' : theme === 'dark' ? 'text-gray-600' : theme === 'ocean' ? 'text-blue-600' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4v5h-.582m-15.356 2A8.001 8.001 0 0119.418 9m0 0H15M4 20v-5h.581m0 0a8.003 8.003 0 0015.357-2M4.581 15H9" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <span className={`text-sm font-semibold ${theme === 'space' ? 'text-purple-700' : theme === 'dark' ? 'text-gray-200' : theme === 'ocean' ? 'text-blue-700' : 'text-yellow-700'}`}>인증 확인 중...</span>
                                    <div className={`text-xs ${theme === 'space' ? 'text-purple-600' : theme === 'dark' ? 'text-gray-400' : theme === 'ocean' ? 'text-blue-600' : 'text-yellow-600'}`}>잠시만 기다려주세요</div>
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